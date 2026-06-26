from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from bson import ObjectId

badges_bp = Blueprint("badges", __name__)

@badges_bp.route("/", methods=["GET"])
@jwt_required()
def get_badges():
    uid = get_jwt_identity()
    db = get_db()
    badges = list(db.badges.find({"user_id": ObjectId(uid)}).sort("earned_at", -1))
    return jsonify([{
        "badge_id": b["badge_id"],
        "title": b["title"],
        "description": b["description"],
        "icon": b["icon"],
        "earned_at": b["earned_at"].isoformat()
    } for b in badges]), 200

@badges_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    db = get_db()
    users = list(db.users.find({}, {"username": 1, "xp": 1, "level": 1, "avatar": 1, "badges_count": 1}).sort("xp", -1).limit(10))
    return jsonify([{
        "username": u["username"],
        "xp": u.get("xp", 0),
        "level": u.get("level", 1),
        "avatar": u.get("avatar", ""),
        "badges_count": u.get("badges_count", 0),
    } for u in users]), 200
