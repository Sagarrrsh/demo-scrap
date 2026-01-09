from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import datetime
import requests

app = Flask(__name__)
CORS(app)

# ---------------- CONFIG ----------------
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")

if not app.config["SQLALCHEMY_DATABASE_URI"]:
    raise RuntimeError("DATABASE_URL environment variable is required")

if not AUTH_SERVICE_URL:
    raise RuntimeError("AUTH_SERVICE_URL environment variable is required")

if not USER_SERVICE_URL:
    raise RuntimeError("USER_SERVICE_URL environment variable is required")

db = SQLAlchemy(app)


# ---------------- MODELS ----------------
class DealerProfile(db.Model):
    __tablename__ = "dealer_profiles"

    id = db.Column(db.Integer, primary_key=True)
    dealer_id = db.Column(db.Integer, unique=True, nullable=False)
    vehicle_number = db.Column(db.String(50))
    service_areas = db.Column(db.Text)  # JSON string of areas
    rating = db.Column(db.Float, default=0.0)
    total_pickups = db.Column(db.Integer, default=0)
    total_earnings = db.Column(db.Float, default=0.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class RequestAssignment(db.Model):
    __tablename__ = "request_assignments"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, nullable=False)
    dealer_id = db.Column(db.Integer, nullable=False)
    status = db.Column(
        db.String(20), default="assigned"
    )  # assigned, accepted, in_progress, completed
    assigned_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    accepted_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    actual_weight = db.Column(db.Float)
    actual_price = db.Column(db.Float)
    notes = db.Column(db.Text)


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    dealer_id = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    transaction_type = db.Column(
        db.String(20), default="payment"
    )  # payment, commission
    status = db.Column(db.String(20), default="pending")  # pending, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    completed_at = db.Column(db.DateTime)


# ---------------- HELPERS ----------------
def verify_token(token):
    try:
        res = requests.get(
            f"{AUTH_SERVICE_URL}/api/auth/verify",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )
        if res.status_code == 200:
            return res.json().get("user")
    except Exception:
        pass
    return None


def get_current_user():
    token = request.headers.get("Authorization")
    if not token:
        return None

    if token.startswith("Bearer "):
        token = token[7:]

    return verify_token(token)


def update_request_status(request_id, status, dealer_id):
    """Update request status in user service"""
    try:
        token = request.headers.get("Authorization")
        res = requests.put(
            f"{USER_SERVICE_URL}/api/users/requests/{request_id}/status",
            headers={"Authorization": token, "Content-Type": "application/json"},
            json={"status": status, "notes": f"Updated by dealer {dealer_id}"},
            timeout=5,
        )
        return res.status_code == 200
    except Exception as e:
        print(f"Error updating request status: {e}")
        return False


# ---------------- ROUTES ----------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "dealer-service"}), 200


# Dealer Profile Management
@app.route("/api/dealers/profile", methods=["GET"])
def get_dealer_profile():
    user = get_current_user()
    if not user or user.get("role") != "dealer":
        return jsonify({"error": "Unauthorized"}), 401

    profile = DealerProfile.query.filter_by(dealer_id=user["id"]).first()

    if not profile:
        # Create profile if doesn't exist
        profile = DealerProfile(dealer_id=user["id"])
        db.session.add(profile)
        db.session.commit()

    return jsonify(
        {
            "user": user,
            "profile": {
                "vehicle_number": profile.vehicle_number,
                "service_areas": profile.service_areas,
                "rating": profile.rating,
                "total_pickups": profile.total_pickups,
                "total_earnings": profile.total_earnings,
                "is_active": profile.is_active,
            },
        }
    )


@app.route("/api/dealers/profile", methods=["POST"])
def update_dealer_profile():
    user = get_current_user()
    if not user or user.get("role") != "dealer":
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}

    profile = DealerProfile.query.filter_by(dealer_id=user["id"]).first()
    if not profile:
        profile = DealerProfile(dealer_id=user["id"])

    profile.vehicle_number = data.get("vehicle_number", profile.vehicle_number)
    profile.service_areas = data.get("service_areas", profile.service_areas)
    profile.is_active = data.get("is_active", profile.is_active)
    profile.updated_at = datetime.datetime.utcnow()

    try:
        db.session.add(profile)
        db.session.commit()
        return jsonify({"message": "Profile updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Available Requests (for dealers to see and accept)
@app.route("/api/dealers/available-requests", methods=["GET"])
def get_available_requests():
    user = get_current_user()
    if not user or user.get("role") != "dealer":
        return jsonify({"error": "Unauthorized"}), 401

    try:
        # Get all pending requests from user service
        token = request.headers.get("Authorization")
        res = requests.get(
            f"{USER_SERVICE_URL}/api/users/requests?status=pending",
            headers={"Authorization": token},
            timeout=5,
        )

        if res.status_code == 200:
            all_requests = res.json().get("requests", [])

            # Filter out already assigned requests
            assigned_ids = [a.request_id for a in RequestAssignment.query.all()]
            available = [r for r in all_requests if r["id"] not in assigned_ids]

            return jsonify({"requests": available})
        else:
            return jsonify({"requests": []})
    except Exception as e:
        print(f"Error fetching requests: {e}")
        return jsonify({"requests": []})


# Dealer's Accepted Requests
@app.route("/api/dealers/my-requests", methods=["GET"])
def get_dealer_requests():
    user = get_current_user()
    if not user or user.get("role") != "dealer":
        return jsonify({"error": "Unauthorized"}), 401

    status_filter = request.args.get("status")

    query = RequestAssignment.query.filter_by(dealer_id=user["id"])

    if status_filter:
        query = query.filter_by(status=status_filter)

    assignments = query.order_by(RequestAssignment.assigned_at.desc()).all()

    # Get full request details from user service
    requests_data = []
    token = request.headers.get("Authorization")

    for assignment in assignments:
        try:
            res = requests.get(
                f"{USER_SERVICE_URL}/api/users/requests/{assignment.request_id}",
                headers={"Authorization": token},
                timeout=5,
            )
            if res.status_code == 200:
                req_data = res.json()
                req_data["assignment_status"] = assignment.status
                req_data["assigned_at"] = assignment.assigned_at.isoformat()
                req_data["accepted_at"] = (
                    assignment.accepted_at.isoformat()
                    if assignment.accepted_at
                    else None
                )
                req_data["completed_at"] = (
                    assignment.completed_at.isoformat()
                    if assignment.completed_at
                    else None
                )
                req_data["actual_weight"] = assignment.actual_weight
                req_data["actual_price"] = assignment.actual_price
                requests_data.append(req_data)
        except Exception as e:
            print(f"Error fetching request {assignment.request_id}: {e}")

    return jsonify({"requests": requests_data})


# Accept a Request
@app.route("/api/dealers/requests/<int:request_id>/accept", methods=["POST"])
def accept_request():
    user = get_current_user()
    if not user or user.get("role") != "dealer":
        return jsonify({"error": "Unauthorized"}), 401

    # Check if already assigned
    existing = RequestAssignment.query.filter_by(request_id=request_id).first()
    if existing:
        return jsonify({"error": "Request already assigned"}), 400

    # Create assignment
    assignment = RequestAssignment(
        request_id=request_id,
        dealer_id=user["id"],
        status="accepted",
        accepted_at=datetime.datetime.utcnow(),
    )

    try:
        db.session.add(assignment)
        db.session.commit()

        # Update request status in user service
        update_request_status(request_id, "accepted", user["id"])

        return (
            jsonify(
                {
                    "message": "Request accepted successfully",
                    "assignment_id": assignment.id,
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Complete a Request
@app.route("/api/dealers/requests/<int:request_id>/complete", methods=["POST"])
def complete_request():
    user = get_current_user()
    if not user or user.get("role") != "dealer":
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}

    assignment = RequestAssignment.query.filter_by(
        request_id=request_id, dealer_id=user["id"]
    ).first()

    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404

    if assignment.status == "completed":
        return jsonify({"error": "Request already completed"}), 400

    # Update assignment
    assignment.status = "completed"
    assignment.completed_at = datetime.datetime.utcnow()
    assignment.actual_weight = data.get("actual_weight")
    assignment.actual_price = data.get("actual_price")
    assignment.notes = data.get("notes", "")

    # Update dealer profile earnings
    profile = DealerProfile.query.filter_by(dealer_id=user["id"]).first()
    if profile:
        profile.total_pickups += 1
        profile.total_earnings += float(data.get("actual_price", 0))
        profile.updated_at = datetime.datetime.utcnow()

    # Create transaction
    transaction = Transaction(
        request_id=request_id,
        user_id=data.get("user_id"),  # Should be passed from request data
        dealer_id=user["id"],
        amount=float(data.get("actual_price", 0)),
        status="completed",
        completed_at=datetime.datetime.utcnow(),
    )

    try:
        db.session.add(transaction)
        db.session.commit()

        # Update request status in user service
        update_request_status(request_id, "completed", user["id"])

        return jsonify({"message": "Request completed successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Dealer Dashboard Stats
@app.route("/api/dealers/dashboard", methods=["GET"])
def dealer_dashboard():
    user = get_current_user()
    if not user or user.get("role") != "dealer":
        return jsonify({"error": "Unauthorized"}), 401

    profile = DealerProfile.query.filter_by(dealer_id=user["id"]).first()

    # Get request counts
    total = RequestAssignment.query.filter_by(dealer_id=user["id"]).count()
    accepted = RequestAssignment.query.filter_by(
        dealer_id=user["id"], status="accepted"
    ).count()
    in_progress = RequestAssignment.query.filter_by(
        dealer_id=user["id"], status="in_progress"
    ).count()
    completed = RequestAssignment.query.filter_by(
        dealer_id=user["id"], status="completed"
    ).count()

    # Recent transactions
    recent_transactions = (
        Transaction.query.filter_by(dealer_id=user["id"])
        .order_by(Transaction.created_at.desc())
        .limit(10)
        .all()
    )

    return jsonify(
        {
            "stats": {
                "total_requests": total,
                "accepted_requests": accepted,
                "in_progress_requests": in_progress,
                "completed_requests": completed,
                "total_earnings": profile.total_earnings if profile else 0,
                "rating": profile.rating if profile else 0,
                "total_pickups": profile.total_pickups if profile else 0,
            },
            "recent_transactions": [
                {
                    "id": t.id,
                    "request_id": t.request_id,
                    "amount": t.amount,
                    "status": t.status,
                    "created_at": t.created_at.isoformat(),
                }
                for t in recent_transactions
            ],
        }
    )


# Dealer Transactions
@app.route("/api/dealers/transactions", methods=["GET"])
def get_dealer_transactions():
    user = get_current_user()
    if not user or user.get("role") != "dealer":
        return jsonify({"error": "Unauthorized"}), 401

    transactions = (
        Transaction.query.filter_by(dealer_id=user["id"])
        .order_by(Transaction.created_at.desc())
        .all()
    )

    return jsonify(
        {
            "transactions": [
                {
                    "id": t.id,
                    "request_id": t.request_id,
                    "user_id": t.user_id,
                    "amount": t.amount,
                    "transaction_type": t.transaction_type,
                    "status": t.status,
                    "created_at": t.created_at.isoformat(),
                    "completed_at": (
                        t.completed_at.isoformat() if t.completed_at else None
                    ),
                }
                for t in transactions
            ]
        }
    )


# Admin: Get All Dealers
@app.route("/api/admin/dealers", methods=["GET"])
def get_all_dealers():
    user = get_current_user()
    if not user or user.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    dealers = DealerProfile.query.all()

    return jsonify(
        {
            "dealers": [
                {
                    "id": d.id,
                    "dealer_id": d.dealer_id,
                    "vehicle_number": d.vehicle_number,
                    "rating": d.rating,
                    "total_pickups": d.total_pickups,
                    "total_earnings": d.total_earnings,
                    "is_active": d.is_active,
                }
                for d in dealers
            ]
        }
    )


# Admin: Get All Assignments
@app.route("/api/admin/assignments", methods=["GET"])
def get_all_assignments():
    user = get_current_user()
    if not user or user.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    assignments = RequestAssignment.query.order_by(
        RequestAssignment.assigned_at.desc()
    ).all()

    return jsonify(
        {
            "assignments": [
                {
                    "id": a.id,
                    "request_id": a.request_id,
                    "dealer_id": a.dealer_id,
                    "status": a.status,
                    "assigned_at": a.assigned_at.isoformat(),
                    "accepted_at": a.accepted_at.isoformat() if a.accepted_at else None,
                    "completed_at": (
                        a.completed_at.isoformat() if a.completed_at else None
                    ),
                    "actual_weight": a.actual_weight,
                    "actual_price": a.actual_price,
                }
                for a in assignments
            ]
        }
    )


with app.app_context():
    db.create_all()
