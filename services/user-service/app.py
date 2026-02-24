from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import datetime
import requests
import json
import pika

app = Flask(__name__)
CORS(app)

# ---- CONFIG
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
    "pool_recycle": 180,
    "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
    "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
}

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL")
PRICING_SERVICE_URL = os.getenv("PRICING_SERVICE_URL")
RABBITMQ_URL = os.getenv("RABBITMQ_URL")
RABBITMQ_EXCHANGE = os.getenv("RABBITMQ_EXCHANGE", "scrapzee.events")

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


class OutboxEvent(db.Model):
    __tablename__ = "outbox_events"

    id = db.Column(db.Integer, primary_key=True)
    aggregate_type = db.Column(db.String(50), nullable=False)
    aggregate_id = db.Column(db.Integer, nullable=False, index=True)
    routing_key = db.Column(db.String(100), nullable=False, index=True)
    payload = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    retry_count = db.Column(db.Integer, default=0)
    last_error = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, index=True)
    published_at = db.Column(db.DateTime)


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


def publish_event(routing_key, payload):
    """Publish async domain events for downstream services (notifications, analytics, etc.)."""
    if not RABBITMQ_URL:
        return False

    connection = None
    channel = None
    try:
        params = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.exchange_declare(exchange=RABBITMQ_EXCHANGE, exchange_type="topic", durable=True)
        channel.basic_publish(
            exchange=RABBITMQ_EXCHANGE,
            routing_key=routing_key,
            body=json.dumps(payload),
            properties=pika.BasicProperties(content_type="application/json", delivery_mode=2),
        )
    except Exception as exc:
        print(f"[publish_event] Unable to publish {routing_key}: {exc}")
        return False
    finally:
        if channel and channel.is_open:
            channel.close()
        if connection and connection.is_open:
            connection.close()

    return True



def enqueue_outbox_event(aggregate_type, aggregate_id, routing_key, payload):
    db.session.add(
        OutboxEvent(
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            routing_key=routing_key,
            payload=json.dumps(payload),
        )
    )


def flush_outbox_events(limit=20):
    pending_events = (
        OutboxEvent.query.filter_by(status="pending")
        .order_by(OutboxEvent.created_at.asc())
        .limit(limit)
        .all()
    )

    processed = 0
    for event in pending_events:
        try:
            published = publish_event(event.routing_key, json.loads(event.payload))
            if not published:
                raise RuntimeError("broker unavailable")
            event.status = "published"
            event.published_at = datetime.datetime.utcnow()
            event.last_error = None
            processed += 1
        except Exception as exc:
            event.retry_count += 1
            event.last_error = str(exc)
            print(f"[flush_outbox_events] Event {event.id} failed: {exc}")

    if pending_events:
        db.session.commit()

    return processed


# ---- ROUTES
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "user-service"}), 200


# ========== NEW ENDPOINT FOR DEALERS ==========


@app.route("/api/users/outbox/flush", methods=["POST"])
def flush_outbox():
    user = get_current_user()
    if not user or user.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 401

    flushed = flush_outbox_events(limit=request.args.get("limit", default=50, type=int))
    return jsonify({"message": "Outbox flush completed", "processed": flushed})

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
        db.session.flush()

        history = RequestHistory(
            request_id=scrap_request.id,
            status="pending",
            changed_by=user["id"],
            notes="Request created",
        )
        db.session.add(history)

        enqueue_outbox_event(
            aggregate_type="scrap_request",
            aggregate_id=scrap_request.id,
            routing_key="request.created",
            payload={
                "request_id": scrap_request.id,
                "user_id": user["id"],
                "category_id": scrap_request.category_id,
                "quantity": scrap_request.quantity,
                "status": scrap_request.status,
                "estimated_price": scrap_request.estimated_price,
                "created_at": scrap_request.created_at.isoformat(),
            },
        )
        db.session.commit()

        print(f"[create_request] Created request #{scrap_request.id} for user {user['id']}")
        flush_outbox_events(limit=10)

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


# ========== NEW: REQUEST HISTORY ENDPOINT ==========
@app.route("/api/users/requests/<int:request_id>/history", methods=["GET"])
def get_request_history(request_id):
    """Get the status change history for a request"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    # Get the request
    scrap_request = ScrapRequest.query.get(request_id)
    
    if not scrap_request:
        return jsonify({"error": "Request not found"}), 404

    # Users can only see their own request history, dealers/admins can see all
    if scrap_request.user_id != user["id"] and user.get("role") not in ["dealer", "admin"]:
        return jsonify({"error": "Forbidden"}), 403

    # Get history ordered by time
    history = (
        RequestHistory.query.filter_by(request_id=request_id)
        .order_by(RequestHistory.changed_at.asc())
        .all()
    )

    return jsonify(
        {
            "request_id": request_id,
            "current_status": scrap_request.status,
            "assigned_dealer_id": scrap_request.assigned_dealer_id,
            "history": [
                {
                    "id": h.id,
                    "status": h.status,
                    "changed_by": h.changed_by,
                    "changed_at": h.changed_at.isoformat(),
                    "notes": h.notes,
                }
                for h in history
            ],
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

        enqueue_outbox_event(
            aggregate_type="scrap_request",
            aggregate_id=request_id,
            routing_key="request.status.updated",
            payload={
                "request_id": request_id,
                "user_id": scrap_request.user_id,
                "old_status": old_status,
                "new_status": new_status,
                "changed_by": user["id"],
                "assigned_dealer_id": scrap_request.assigned_dealer_id,
                "updated_at": scrap_request.updated_at.isoformat(),
            },
        )
        db.session.commit()

        print(f"[update_status] Request #{request_id} status: {old_status} -> {new_status}")
        flush_outbox_events(limit=10)

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
