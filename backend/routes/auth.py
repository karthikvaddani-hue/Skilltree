from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import get_db
import bcrypt
from datetime import datetime
from bson import ObjectId
import re

auth_bp = Blueprint("auth", __name__)

def serialize_user(user):
    return {
        "_id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "avatar": user.get("avatar", ""),
        "xp": user.get("xp", 0),
        "level": user.get("level", 1),
        "bio": user.get("bio", ""),
        "joined_at": user.get("joined_at", "").isoformat() if user.get("joined_at") else "",
        "badges_count": user.get("badges_count", 0),
        "trees_count": user.get("trees_count", 0),
    }

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Invalid email address"}), 400

    db = get_db()
    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409
    if db.users.find_one({"username": username}):
        return jsonify({"error": "Username already taken"}), 409

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    user = {
        "username": username,
        "email": email,
        "password": hashed,
        "avatar": f"https://api.dicebear.com/7.x/bottts/svg?seed={username}",
        "xp": 0,
        "level": 1,
        "bio": "",
        "joined_at": datetime.utcnow(),
        "badges_count": 0,
        "trees_count": 0,
    }
    result = db.users.insert_one(user)
    user["_id"] = result.inserted_id
    token = create_access_token(identity=str(result.inserted_id))
    return jsonify({"token": token, "user": serialize_user(user)}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode(), user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user["_id"]))
    return jsonify({"token": token, "user": serialize_user(user)}), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    uid = get_jwt_identity()
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(uid)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(serialize_user(user)), 200

@auth_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    uid = get_jwt_identity()
    data = request.get_json()
    allowed = ["bio", "avatar"]
    update = {k: v for k, v in data.items() if k in allowed}
    db = get_db()
    db.users.update_one({"_id": ObjectId(uid)}, {"$set": update})
    user = db.users.find_one({"_id": ObjectId(uid)})
    return jsonify(serialize_user(user)), 200
