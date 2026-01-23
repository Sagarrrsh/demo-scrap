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
    service_areas = db.Column(db.Text)
    rating = db.Column(db.Float, default=0.0)
    total_pickups = db.Column(db.Integer, default=0)
    total_earnings = db.Column(db.Float, default=0.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class RequestAssignment(db.Model):
    __tablename__ = "request_assignments"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, nullable=False, unique=True)
    dealer_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default="accepted")
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
    transaction_type = db.Column(db.String(20), default="payment")
    status = db.Column(db.String(20), default="pending")
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
    except Exception as e:
        print(f"Token verification error: {e}")
    return None


def get_current_user():
    token = request.headers.get("Authorization")
    if not token:
        return None

    if token.startswith("Bearer "):
        token = token[7:]

    return verify_token(token)


def update_request_status(request_id, status, dealer_id=None):
    """Update request status in user service"""
    try:
        token = request.headers.get("Authorization")
        payload = {"status": status, "notes": f"Updated by dealer {dealer_id}"}
        
        if dealer_id:
            payload["assigned_dealer_id"] = dealer_id
            
        res = requests.put(
            f"{USER_SERVICE_URL}/api/users/requests/{request_id}/status",
            headers={"Authorization": token, "Content-Type": "application/json"},
            json=payload,
            timeout=5,
        )
        return res.status_code == 200
    except Exception as e:
        print(f"Error updating request status: {e}")
        return False


def get_all_pending_requests(token):
    """Fetch ALL pending requests from user service"""
    try:
        # Use the new /all endpoint to get all pending requests
        res = requests.get(
            f"{USER_SERVICE_URL}/api/users/requests/all?status=pending",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )
        
        if res.status_code == 200:
            data = res.json()
            pending_requests = data.get("requests", [])
            print(f"Found {len(pending_requests)} pending requests")
            return pending_requests
        else:
            print(f"Failed to fetch requests: status {res.status_code}")
            return []
    except Exception as e:
        print(f"Error fetching pending requests: {e}")
        return []


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


# FIXED: Available Requests - Show ALL unassigned pending requests
@app.route("/api/dealers/available-requests", methods=["GET"])
def get_available_requests():
    user = get_current_user()
    if not user or user.get("role") != "dealer":
        return jsonify({"error": "Unauthorized"}), 401

    try:
        token = request.headers.get("Authorization")
        
        # Get ALL pending requests from user service
        all_pending = get_all_pending_requests(token)
        
        print(f"Total pending requests from user service: {len(all_pending)}")
        
        # Get IDs of requests that are already assigned
        assigned_request_ids = set(
            assignment.request_id 
            for assignment in RequestAssignment.query.all()
        )
        
        print(f"Already assigned request IDs: {assigned_request_ids}")
        
        # Filter to show ONLY unassigned requests
        available_requests = [
            req for req in all_pending 
            if req.get("id") not in assigned_request_ids
        ]
        
        print(f"Available (unassigned) requests: {len(available_requests)}")
        
        return jsonify({"requests": available_requests})
        
    except Exception as e:
        print(f"Error in get_available_requests: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"requests": [], "error": str(e)}), 500


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
                req_data["user_id"] = assignment.user_id
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
        return jsonify({"error": "Request already assigned to a dealer"}), 400

    # Get request details to extract user_id
    try:
        token = request.headers.get("Authorization")
        res = requests.get(
            f"{USER_SERVICE_URL}/api/users/requests/{request_id}",
            headers={"Authorization": token},
            timeout=5,
        )
        if res.status_code != 200:
            return jsonify({"error": "Request not found"}), 404
            
        request_data = res.json()
        user_id = request_data.get("user_id")
        
        # Verify it's still pending
        if request_data.get("status") != "pending":
            return jsonify({"error": "Request is no longer available"}), 400
        
    except Exception as e:
        print(f"Error fetching request details: {e}")
        return jsonify({"error": "Failed to fetch request details"}), 500

    # Create assignment
    assignment = RequestAssignment(
        request_id=request_id,
        dealer_id=user["id"],
        user_id=user_id,
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
        print(f"Error accepting request: {e}")
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
        user_id=assignment.user_id,
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

    # Create profile if doesn't exist
    if not profile:
        profile = DealerProfile(dealer_id=user["id"])
        db.session.add(profile)
        db.session.commit()

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
                "total_earnings": profile.total_earnings,
                "rating": profile.rating,
                "total_pickups": profile.total_pickups,
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


# DEBUG ENDPOINT - Remove in production
@app.route("/api/dealers/debug/requests", methods=["GET"])
def debug_requests():
    """Debug endpoint to see what's happening"""
    user = get_current_user()
    if not user or user.get("role") != "dealer":
        return jsonify({"error": "Unauthorized"}), 401
    
    token = request.headers.get("Authorization")
    all_pending = get_all_pending_requests(token)
    assigned_ids = [a.request_id for a in RequestAssignment.query.all()]
    
    return jsonify({
        "total_pending_from_user_service": len(all_pending),
        "pending_requests": all_pending,
        "assigned_request_ids": assigned_ids,
        "assignments_count": len(assigned_ids)
    })


with app.app_context():
    db.create_all()