from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
import datetime
import requests
import json
import redis

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


AUTH_SERVICE_URL = os.getenv(
    "AUTH_SERVICE_URL"
)
REDIS_URL = os.getenv("REDIS_URL")
REDIS_TTL_SECONDS = int(os.getenv("REDIS_TTL_SECONDS", "120"))

if not app.config["SQLALCHEMY_DATABASE_URI"]:
    raise RuntimeError("DATABASE_URL environment variable is required")

if not AUTH_SERVICE_URL:
    raise RuntimeError("AUTH_SERVICE_URL environment variable is required")

db = SQLAlchemy(app)
redis_client = redis.from_url(REDIS_URL, decode_responses=True) if REDIS_URL else None


# ---- MODELS 
class ScrapCategory(db.Model):
    __tablename__ = "scrap_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    base_price = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default="kg")
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class PriceHistory(db.Model):
    __tablename__ = "price_history"

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("scrap_categories.id"))
    price = db.Column(db.Float, nullable=False)
    changed_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    changed_by = db.Column(db.Integer)
    reason = db.Column(db.String(255))


class DynamicPricing(db.Model):
    __tablename__ = "dynamic_pricing"

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("scrap_categories.id"))
    location = db.Column(db.String(100))
    multiplier = db.Column(db.Float, default=1.0)
    demand_level = db.Column(db.String(20))
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


# --- HELPERS 
def verify_token(token):
    """Ask Auth service to validate JWT"""
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


def require_auth():
    token = request.headers.get("Authorization")
    if not token:
        return None

    if token.startswith("Bearer "):
        token = token[7:]

    return verify_token(token)


def redis_get_json(key):
    if not redis_client:
        return None
    try:
        data = redis_client.get(key)
        return json.loads(data) if data else None
    except Exception as exc:
        print(f"[redis_get_json] {exc}")
        return None


def redis_set_json(key, payload, ttl=REDIS_TTL_SECONDS):
    if not redis_client:
        return
    try:
        redis_client.setex(key, ttl, json.dumps(payload))
    except Exception as exc:
        print(f"[redis_set_json] {exc}")


def clear_pricing_cache(category_id=None):
    if not redis_client:
        return
    patterns = ["pricing:categories:all", "pricing:calculate:*"]
    if category_id:
        patterns.append(f"pricing:category:{category_id}")
    try:
        for pattern in patterns:
            keys = redis_client.keys(pattern)
            if keys:
                redis_client.delete(*keys)
    except Exception as exc:
        print(f"[clear_pricing_cache] {exc}")


# ---- ROUTES 
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "pricing-service"}), 200


@app.route("/api/pricing/categories", methods=["GET"])
def get_categories():
    cached = redis_get_json("pricing:categories:all")
    if cached:
        return jsonify({"categories": cached, "cache": "hit"})

    categories = ScrapCategory.query.filter_by(is_active=True).all()
    payload = [
        {
            "id": c.id,
            "name": c.name,
            "base_price": c.base_price,
            "unit": c.unit,
            "description": c.description,
            "image_url": c.image_url,
        }
        for c in categories
    ]
    redis_set_json("pricing:categories:all", payload)
    return jsonify({"categories": payload, "cache": "miss"})


@app.route("/api/pricing/categories/<int:category_id>", methods=["GET"])
def get_category(category_id):
    cache_key = f"pricing:category:{category_id}"
    cached = redis_get_json(cache_key)
    if cached:
        return jsonify({**cached, "cache": "hit"})

    c = ScrapCategory.query.get_or_404(category_id)
    payload = {
        "id": c.id,
        "name": c.name,
        "base_price": c.base_price,
        "unit": c.unit,
        "description": c.description,
        "image_url": c.image_url,
    }
    redis_set_json(cache_key, payload)
    return jsonify({**payload, "cache": "miss"})


@app.route("/api/pricing/calculate", methods=["POST"])
def calculate_price():
    data = request.get_json() or {}

    category_id = data.get("category_id")
    quantity = data.get("quantity", 0)
    location = data.get("location", "default")

    if not category_id or quantity <= 0:
        return jsonify({"error": "Invalid category or quantity"}), 400

    cache_key = f"pricing:calculate:{category_id}:{quantity}:{location}"
    cached = redis_get_json(cache_key)
    if cached:
        return jsonify({**cached, "cache": "hit"})

    category = ScrapCategory.query.get(category_id)
    if not category:
        return jsonify({"error": "Category not found"}), 404

    dynamic = DynamicPricing.query.filter_by(
        category_id=category_id, location=location
    ).first()

    multiplier = dynamic.multiplier if dynamic else 1.0

    if quantity > 100:
        multiplier *= 1.05

    total = category.base_price * quantity * multiplier

    payload = {
        "category": category.name,
        "quantity": quantity,
        "unit": category.unit,
        "base_price": category.base_price,
        "multiplier": multiplier,
        "total_price": round(total, 2),
        "location": location,
    }
    redis_set_json(cache_key, payload)
    return jsonify({**payload, "cache": "miss"})


@app.route("/api/pricing/categories", methods=["POST"])
def create_category():
    user = require_auth()

    if not user or user.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}

    category = ScrapCategory(
        name=data["name"],
        base_price=data["base_price"],
        unit=data.get("unit", "kg"),
        description=data.get("description", ""),
        image_url=data.get("image_url", ""),
    )

    try:
        db.session.add(category)
        db.session.commit()

        history = PriceHistory(
            category_id=category.id,
            price=category.base_price,
            changed_by=user["id"],
            reason="Initial creation",
        )
        db.session.add(history)
        db.session.commit()

        clear_pricing_cache(category.id)
        return jsonify({"message": "Category created", "category_id": category.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/pricing/categories/<int:category_id>/price", methods=["PUT"])
def update_price(category_id):
    user = require_auth()

    if not user or user.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}
    new_price = data.get("price")

    if not new_price or new_price <= 0:
        return jsonify({"error": "Invalid price"}), 400

    category = ScrapCategory.query.get_or_404(category_id)
    old_price = category.base_price
    category.base_price = new_price

    try:
        history = PriceHistory(
            category_id=category_id,
            price=new_price,
            changed_by=user["id"],
            reason=data.get("reason", f"Updated from {old_price}"),
        )
        db.session.add(history)
        db.session.commit()

        clear_pricing_cache(category_id)
        return jsonify(
            {
                "message": "Price updated",
                "old_price": old_price,
                "new_price": new_price,
            }
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/pricing/history/<int:category_id>", methods=["GET"])
def get_history(category_id):
    history = (
        PriceHistory.query.filter_by(category_id=category_id)
        .order_by(PriceHistory.changed_at.desc())
        .limit(20)
        .all()
    )

    return jsonify(
        {
            "history": [
                {
                    "price": h.price,
                    "changed_at": h.changed_at.isoformat(),
                    "reason": h.reason,
                }
                for h in history
            ]
        }
    )


# ---------------- INIT DATA ----------------
def init_sample_data():
    if ScrapCategory.query.count() == 0:
        samples = [
            ScrapCategory(
                name="Paper",
                base_price=12.5,
                unit="kg",
                description="Newspapers, magazines, cardboard",
            ),
            ScrapCategory(
                name="Plastic",
                base_price=8.0,
                unit="kg",
                description="PET bottles, plastic containers",
            ),
            ScrapCategory(
                name="Metal",
                base_price=45.0,
                unit="kg",
                description="Iron, aluminum, copper",
            ),
            ScrapCategory(
                name="Glass",
                base_price=5.0,
                unit="kg",
                description="Glass bottles and jars",
            ),
            ScrapCategory(
                name="E-Waste",
                base_price=25.0,
                unit="kg",
                description="Old electronics, circuit boards",
            ),
        ]
        db.session.add_all(samples)
        db.session.commit()


with app.app_context():
    db.create_all()
    init_sample_data()


