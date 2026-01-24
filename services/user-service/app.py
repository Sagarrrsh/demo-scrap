from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import datetime
import requests

app = Flask(__name__)
CORS(app)

# ---- CONFIG
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL")
PRICING_SERVICE_URL = os.getenv("PRICING_SERVICE_URL")

if not app.config["SQLALCHEMY_DATABASE_URI"]:
    raise RuntimeError("DATABASE_URL environment variable is required")

if not AUTH_SERVICE_URL:
    raise RuntimeError("AUTH_SERVICE_URL environment variable is required")

if not PRICING_SERVICE_URL:
    raise RuntimeError("PRICING_SERVICE_URL environment variable is required")

db = SQLAlchemy(app)


# ---- MODELS
class UserProfile(db.Model):
    __tablename__ = "user_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, unique=True, nullable=False, index=True)
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    pincode = db.Column(db.String(10))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    avatar_url = db.Column(db.String(255))
    bio = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ScrapRequest(db.Model):
    __tablename__ = "scrap_requests"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    category_id = db.Column(db.Integer, nullable=False, index=True)
    quantity = db.Column(db.Float, nullable=False)
    estimated_price = db.Column(db.Float)
    pickup_address = db.Column(db.Text, nullable=False)
    pickup_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default="pending", index=True)
    notes = db.Column(db.Text)
    assigned_dealer_id = db.Column(db.Integer, index=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class RequestHistory(db.Model):
    __tablename__ = "request_history"

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey("scrap_requests.id"), index=True)
    status = db.Column(db.String(20))
    changed_by = db.Column(db.Integer)
    notes = db.Column(db.Text)
    changed_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, index=True)


# --- HELPERS
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


def calculate_price(category_id, quantity, location):
    try:
        res = requests.post(
            f"{PRICING_SERVICE_URL}/api/pricing/calculate",
            json={
                "category_id": category_id,
                "quantity": quantity,
                "location": location,
            },
            timeout=5,
        )
        if res.status_code == 200:
            return res.json().get("total_price")
    except Exception as e:
        print(f"Price calculation error: {e}")

    return None


# ---- ROUTES
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "user-service"}), 200


# ========== NEW ENDPOINT FOR DEALERS ==========
@app.route("/api/users/requests/all", methods=["GET"])
def get_all_requests():
    """
    Get ALL requests - for dealers and admins to see available pickups
    This is different from /api/users/requests which only returns current user's requests
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    # Only dealers and admins can see all requests
    if user.get("role") not in ["dealer", "admin"]:
        return jsonify({"error": "Forbidden - Dealers and admins only"}), 403

    # Get query parameters
    status = request.args.get("status")
    limit = request.args.get("limit", type=int)
    
    query = ScrapRequest.query
    
    if status:
        query = query.filter_by(status=status)
    
    # Get all requests ordered by creation date (newest first)
    query = query.order_by(ScrapRequest.created_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    all_requests = query.all()

    print(f"[get_all_requests] Found {len(all_requests)} requests (status={status})")

    return jsonify(
        {
            "requests": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "category_id": r.category_id,
                    "quantity": r.quantity,
                    "estimated_price": r.estimated_price,
                    "pickup_address": r.pickup_address,
                    "pickup_date": r.pickup_date.isoformat() if r.pickup_date else None,
                    "status": r.status,
                    "notes": r.notes,
                    "assigned_dealer_id": r.assigned_dealer_id,
                    "created_at": r.created_at.isoformat(),
                }
                for r in all_requests
            ]
        }
    )


# ========== USER PROFILE ENDPOINTS ==========
@app.route("/api/users/profile", methods=["GET"])
def get_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    profile = UserProfile.query.filter_by(user_id=user["id"]).first()

    return jsonify(
        {
            "user": user,
            "profile": (
                {
                    "address": profile.address,
                    "city": profile.city,
                    "pincode": profile.pincode,
                    "latitude": profile.latitude,
                    "longitude": profile.longitude,
                    "avatar_url": profile.avatar_url,
                    "bio": profile.bio,
                }
                if profile
                else None
            ),
        }
    )


@app.route("/api/users/profile", methods=["POST", "PUT"])
def update_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}

    profile = UserProfile.query.filter_by(user_id=user["id"]).first()
    if not profile:
        profile = UserProfile(user_id=user["id"])

    profile.address = data.get("address", profile.address)
    profile.city = data.get("city", profile.city)
    profile.pincode = data.get("pincode", profile.pincode)
    profile.latitude = data.get("latitude", profile.latitude)
    profile.longitude = data.get("longitude", profile.longitude)
    profile.avatar_url = data.get("avatar_url", profile.avatar_url)
    profile.bio = data.get("bio", profile.bio)
    profile.updated_at = datetime.datetime.utcnow()

    try:
        db.session.add(profile)
        db.session.commit()
        return jsonify({"message": "Profile updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ========== SCRAP REQUEST ENDPOINTS ==========
@app.route("/api/users/requests", methods=["POST"])
def create_request():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}

    if not all(k in data for k in ["category_id", "quantity", "pickup_address"]):
        return jsonify({"error": "Missing required fields"}), 400

    profile = UserProfile.query.filter_by(user_id=user["id"]).first()
    location = profile.city if profile else "default"

    estimated_price = calculate_price(data["category_id"], data["quantity"], location)

    scrap_request = ScrapRequest(
        user_id=user["id"],
        category_id=data["category_id"],
        quantity=data["quantity"],
        estimated_price=estimated_price,
        pickup_address=data["pickup_address"],
        pickup_date=(
            datetime.datetime.fromisoformat(data["pickup_date"])
            if data.get("pickup_date")
            else None
        ),
        notes=data.get("notes", ""),
        status="pending"
    )

    try:
        db.session.add(scrap_request)
        db.session.commit()

        history = RequestHistory(
            request_id=scrap_request.id,
            status="pending",
            changed_by=user["id"],
            notes="Request created",
        )
        db.session.add(history)
        db.session.commit()

        print(f"[create_request] Created request #{scrap_request.id} for user {user['id']}")

        return (
            jsonify(
                {
                    "message": "Request created successfully",
                    "request_id": scrap_request.id,
                    "estimated_price": estimated_price,
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        print(f"Error creating request: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/requests", methods=["GET"])
def get_requests():
    """Get requests for the CURRENT USER only"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    query = ScrapRequest.query.filter_by(user_id=user["id"])

    status = request.args.get("status")
    if status:
        query = query.filter_by(status=status)

    scrap_requests = query.order_by(ScrapRequest.created_at.desc()).all()

    return jsonify(
        {
            "requests": [
                {
                    "id": r.id,
                    "category_id": r.category_id,
                    "quantity": r.quantity,
                    "estimated_price": r.estimated_price,
                    "pickup_address": r.pickup_address,
                    "pickup_date": r.pickup_date.isoformat() if r.pickup_date else None,
                    "status": r.status,
                    "notes": r.notes,
                    "assigned_dealer_id": r.assigned_dealer_id,
                    "created_at": r.created_at.isoformat(),
                }
                for r in scrap_requests
            ]
        }
    )


@app.route("/api/users/requests/<int:request_id>", methods=["GET"])
def get_request(request_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    scrap_request = ScrapRequest.query.get_or_404(request_id)

    # Users can only see their own requests, dealers/admins can see all
    if scrap_request.user_id != user["id"] and user.get("role") not in [
        "dealer",
        "admin",
    ]:
        return jsonify({"error": "Forbidden"}), 403

    return jsonify(
        {
            "id": scrap_request.id,
            "user_id": scrap_request.user_id,
            "category_id": scrap_request.category_id,
            "quantity": scrap_request.quantity,
            "estimated_price": scrap_request.estimated_price,
            "pickup_address": scrap_request.pickup_address,
            "pickup_date": (
                scrap_request.pickup_date.isoformat()
                if scrap_request.pickup_date
                else None
            ),
            "status": scrap_request.status,
            "notes": scrap_request.notes,
            "assigned_dealer_id": scrap_request.assigned_dealer_id,
            "created_at": scrap_request.created_at.isoformat(),
        }
    )


@app.route("/api/users/requests/<int:request_id>/status", methods=["PUT"])
def update_status(request_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json() or {}
    new_status = data.get("status")

    if new_status not in ["pending", "accepted", "completed", "cancelled"]:
        return jsonify({"error": "Invalid status"}), 400

    scrap_request = ScrapRequest.query.get_or_404(request_id)

    # Users can only cancel their own requests, dealers/admins can update any
    if scrap_request.user_id != user["id"] and user.get("role") not in [
        "dealer",
        "admin",
    ]:
        return jsonify({"error": "Forbidden"}), 403

    old_status = scrap_request.status
    scrap_request.status = new_status
    scrap_request.updated_at = datetime.datetime.utcnow()

    if data.get("assigned_dealer_id"):
        scrap_request.assigned_dealer_id = data.get("assigned_dealer_id")

    try:
        history = RequestHistory(
            request_id=request_id,
            status=new_status,
            changed_by=user["id"],
            notes=data.get(
                "notes",
                f"Status changed from {old_status} to {new_status}",
            ),
        )
        db.session.add(history)
        db.session.commit()

        print(f"[update_status] Request #{request_id} status: {old_status} -> {new_status}")

        return jsonify({"message": "Status updated successfully"})
    except Exception as e:
        db.session.rollback()
        print(f"Error updating status: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/dashboard", methods=["GET"])
def dashboard():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    total = ScrapRequest.query.filter_by(user_id=user["id"]).count()
    pending = ScrapRequest.query.filter_by(user_id=user["id"], status="pending").count()
    completed = ScrapRequest.query.filter_by(
        user_id=user["id"], status="completed"
    ).count()

    completed_requests = ScrapRequest.query.filter_by(
        user_id=user["id"], status="completed"
    ).all()

    total_earnings = sum(r.estimated_price or 0 for r in completed_requests)

    recent = (
        ScrapRequest.query.filter_by(user_id=user["id"])
        .order_by(ScrapRequest.created_at.desc())
        .limit(5)
        .all()
    )

    return jsonify(
        {
            "stats": {
                "total_requests": total,
                "pending_requests": pending,
                "completed_requests": completed,
                "total_earnings": round(total_earnings, 2),
            },
            "recent_requests": [
                {
                    "id": r.id,
                    "category_id": r.category_id,
                    "status": r.status,
                    "estimated_price": r.estimated_price,
                    "created_at": r.created_at.isoformat(),
                }
                for r in recent
            ],
        }
    )


# ========== DEBUG ENDPOINT ==========
@app.route("/api/users/debug/requests", methods=["GET"])
def debug_requests():
    """Debug endpoint to check database state"""
    user = get_current_user()
    if not user or user.get("role") not in ["admin", "dealer"]:
        return jsonify({"error": "Unauthorized"}), 401
    
    all_requests = ScrapRequest.query.all()
    pending = ScrapRequest.query.filter_by(status="pending").all()
    
    return jsonify({
        "total_requests": len(all_requests),
        "pending_requests": len(pending),
        "all_requests": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "status": r.status,
                "category_id": r.category_id,
                "assigned_dealer_id": r.assigned_dealer_id
            }
            for r in all_requests
        ],
        "pending_details": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "category_id": r.category_id,
                "quantity": r.quantity,
                "status": r.status
            }
            for r in pending
        ]
    })


# ========== INITIALIZE DATABASE ==========
with app.app_context():
    db.create_all()
    print("✓ Database tables created successfully")


# if __name__ == "__main__":
