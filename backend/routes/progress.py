from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from datetime import datetime
from bson import ObjectId

progress_bp = Blueprint("progress", __name__)

XP_PER_LEVEL = 500

def compute_level(xp):
    return max(1, xp // XP_PER_LEVEL + 1)

BADGE_DEFINITIONS = [
    {"id": "first_node", "title": "First Step", "description": "Complete your first skill node", "icon": "🌱", "condition_type": "nodes_completed", "threshold": 1},
    {"id": "five_nodes", "title": "Getting Started", "description": "Complete 5 nodes", "icon": "⭐", "condition_type": "nodes_completed", "threshold": 5},
    {"id": "ten_nodes", "title": "Rising Scholar", "description": "Complete 10 nodes", "icon": "🎯", "condition_type": "nodes_completed", "threshold": 10},
    {"id": "first_tree", "title": "Tree Master", "description": "Complete an entire skill tree", "icon": "🌳", "condition_type": "trees_completed", "threshold": 1},
    {"id": "xp_500", "title": "XP Hunter", "description": "Earn 500 XP total", "icon": "💎", "condition_type": "xp_earned", "threshold": 500},
    {"id": "xp_1000", "title": "XP Champion", "description": "Earn 1000 XP total", "icon": "🏆", "condition_type": "xp_earned", "threshold": 1000},
    {"id": "level_5", "title": "Level 5 Reached", "description": "Reach level 5", "icon": "🔥", "condition_type": "level_reached", "threshold": 5},
]

def check_and_award_badges(db, user_id, user):
    existing_badges = {b["badge_id"] for b in db.badges.find({"user_id": ObjectId(user_id)}, {"badge_id": 1})}
    new_badges = []
    xp = user.get("xp", 0)
    level = compute_level(xp)

    # Count total completed nodes across all trees for this user
    nodes_completed = sum(
        len(p.get("completed_nodes", []))
        for p in db.progress.find({"user_id": ObjectId(user_id)})
    )
    trees_completed = db.progress.count_documents({"user_id": ObjectId(user_id), "tree_completed": True})

    for badge in BADGE_DEFINITIONS:
        if badge["id"] in existing_badges:
            continue
        earned = False
        ct = badge["condition_type"]
        if ct == "nodes_completed" and nodes_completed >= badge["threshold"]:
            earned = True
        elif ct == "trees_completed" and trees_completed >= badge["threshold"]:
            earned = True
        elif ct == "xp_earned" and xp >= badge["threshold"]:
            earned = True
        elif ct == "level_reached" and level >= badge["threshold"]:
            earned = True

        if earned:
            db.badges.insert_one({
                "user_id": ObjectId(user_id),
                "badge_id": badge["id"],
                "title": badge["title"],
                "description": badge["description"],
                "icon": badge["icon"],
                "earned_at": datetime.utcnow()
            })
            new_badges.append(badge)

    if new_badges:
        db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"badges_count": len(new_badges)}})

    return new_badges

@progress_bp.route("/<tree_id>", methods=["GET"])
@jwt_required()
def get_progress(tree_id):
    uid = get_jwt_identity()
    db = get_db()
    prog = db.progress.find_one({"user_id": ObjectId(uid), "tree_id": ObjectId(tree_id)})
    if not prog:
        return jsonify({"completed_nodes": [], "tree_completed": False}), 200
    return jsonify({
        "completed_nodes": prog.get("completed_nodes", []),
        "tree_completed": prog.get("tree_completed", False),
        "started_at": prog.get("started_at", "").isoformat() if prog.get("started_at") else "",
        "completed_at": prog.get("completed_at", "").isoformat() if prog.get("completed_at") else None,
    }), 200

@progress_bp.route("/<tree_id>/complete-node", methods=["POST"])
@jwt_required()
def complete_node(tree_id):
    uid = get_jwt_identity()
    data = request.get_json()
    node_id = data.get("node_id")
    if not node_id:
        return jsonify({"error": "node_id required"}), 400

    db = get_db()
    tree = db.skill_trees.find_one({"_id": ObjectId(tree_id)})
    if not tree:
        return jsonify({"error": "Tree not found"}), 404

    node = next((n for n in tree.get("nodes", []) if n["id"] == node_id), None)
    if not node:
        return jsonify({"error": "Node not found"}), 404

    xp_reward = node.get("xp_reward", 50)

    prog = db.progress.find_one({"user_id": ObjectId(uid), "tree_id": ObjectId(tree_id)})
    if not prog:
        db.progress.insert_one({
            "user_id": ObjectId(uid),
            "tree_id": ObjectId(tree_id),
            "completed_nodes": [node_id],
            "tree_completed": False,
            "started_at": datetime.utcnow(),
        })
    else:
        if node_id in prog.get("completed_nodes", []):
            return jsonify({"message": "Already completed", "xp_gained": 0}), 200
        db.progress.update_one(
            {"user_id": ObjectId(uid), "tree_id": ObjectId(tree_id)},
            {"$push": {"completed_nodes": node_id}}
        )

    # Re-fetch to get updated completed_nodes
    prog = db.progress.find_one({"user_id": ObjectId(uid), "tree_id": ObjectId(tree_id)})

    # Check if tree fully completed
    all_node_ids = {n["id"] for n in tree.get("nodes", [])}
    completed_set = set(prog.get("completed_nodes", []))
    tree_completed = all_node_ids.issubset(completed_set) and len(all_node_ids) > 0

    if tree_completed:
        db.progress.update_one(
            {"user_id": ObjectId(uid), "tree_id": ObjectId(tree_id)},
            {"$set": {"tree_completed": True, "completed_at": datetime.utcnow()}}
        )

    # Award XP
    db.users.update_one({"_id": ObjectId(uid)}, {"$inc": {"xp": xp_reward}})
    user = db.users.find_one({"_id": ObjectId(uid)})
    new_level = compute_level(user["xp"])
    if new_level != user.get("level", 1):
        db.users.update_one({"_id": ObjectId(uid)}, {"$set": {"level": new_level}})
        user["level"] = new_level

    new_badges = check_and_award_badges(db, uid, user)

    return jsonify({
        "xp_gained": xp_reward,
        "total_xp": user["xp"],
        "level": new_level,
        "tree_completed": tree_completed,
        "new_badges": new_badges,
    }), 200

@progress_bp.route("/<tree_id>/uncomplete-node", methods=["POST"])
@jwt_required()
def uncomplete_node(tree_id):
    uid = get_jwt_identity()
    data = request.get_json()
    node_id = data.get("node_id")
    if not node_id:
        return jsonify({"error": "node_id required"}), 400

    db = get_db()
    tree = db.skill_trees.find_one({"_id": ObjectId(tree_id)})
    if not tree:
        return jsonify({"error": "Tree not found"}), 404

    node = next((n for n in tree.get("nodes", []) if n["id"] == node_id), None)
    xp_reward = node.get("xp_reward", 50) if node else 50

    prog = db.progress.find_one({"user_id": ObjectId(uid), "tree_id": ObjectId(tree_id)})
    if not prog or node_id not in prog.get("completed_nodes", []):
        return jsonify({"message": "Node not completed", "xp_lost": 0}), 200

    db.progress.update_one(
        {"user_id": ObjectId(uid), "tree_id": ObjectId(tree_id)},
        {"$pull": {"completed_nodes": node_id}, "$set": {"tree_completed": False}}
    )
    db.users.update_one({"_id": ObjectId(uid)}, {"$inc": {"xp": -xp_reward}})
    user = db.users.find_one({"_id": ObjectId(uid)})
    # Ensure XP never goes below 0
    if user.get("xp", 0) < 0:
        db.users.update_one({"_id": ObjectId(uid)}, {"$set": {"xp": 0}})
        user["xp"] = 0
    new_level = compute_level(user.get("xp", 0))
    db.users.update_one({"_id": ObjectId(uid)}, {"$set": {"level": new_level}})

    return jsonify({"xp_lost": xp_reward, "total_xp": user["xp"], "level": new_level}), 200

@progress_bp.route("/all", methods=["GET"])
@jwt_required()
def all_progress():
    uid = get_jwt_identity()
    db = get_db()
    progs = list(db.progress.find({"user_id": ObjectId(uid)}))
    return jsonify([{
        "tree_id": str(p["tree_id"]),
        "completed_nodes": p.get("completed_nodes", []),
        "tree_completed": p.get("tree_completed", False),
    } for p in progs]), 200
