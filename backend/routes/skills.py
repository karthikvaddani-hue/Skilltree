from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from datetime import datetime
from bson import ObjectId

skills_bp = Blueprint("skills", __name__)

CATEGORIES = ["Programming", "Design", "Mathematics", "Language", "Science", "Business", "Arts", "Other"]

def serialize_tree(tree):
    t = dict(tree)
    t["_id"] = str(t["_id"])
    t["owner_id"] = str(t["owner_id"])
    if "created_at" in t:
        t["created_at"] = t["created_at"].isoformat()
    if "updated_at" in t:
        t["updated_at"] = t["updated_at"].isoformat()
    return t

@skills_bp.route("/templates", methods=["GET"])
def get_templates():
    """Return built-in starter templates"""
    templates = [
        {
            "id": "web-dev",
            "title": "Web Development",
            "description": "Full-stack web development path",
            "category": "Programming",
            "color": "#6366f1",
            "icon": "🌐",
            "nodes": [
                {"id": "n1", "title": "HTML Basics", "description": "Learn HTML structure and tags", "x": 400, "y": 80, "tier": 0, "parents": [], "xp_reward": 50},
                {"id": "n2", "title": "CSS Styling", "description": "Style your web pages", "x": 250, "y": 200, "tier": 1, "parents": ["n1"], "xp_reward": 75},
                {"id": "n3", "title": "JavaScript Core", "description": "JS fundamentals and DOM", "x": 550, "y": 200, "tier": 1, "parents": ["n1"], "xp_reward": 100},
                {"id": "n4", "title": "Responsive Design", "description": "Flexbox, Grid, Media Queries", "x": 150, "y": 340, "tier": 2, "parents": ["n2"], "xp_reward": 100},
                {"id": "n5", "title": "React Basics", "description": "Components, state, props", "x": 400, "y": 340, "tier": 2, "parents": ["n2", "n3"], "xp_reward": 150},
                {"id": "n6", "title": "Node.js & Express", "description": "Backend fundamentals", "x": 650, "y": 340, "tier": 2, "parents": ["n3"], "xp_reward": 150},
                {"id": "n7", "title": "React Advanced", "description": "Hooks, Context, Redux", "x": 280, "y": 480, "tier": 3, "parents": ["n5"], "xp_reward": 200},
                {"id": "n8", "title": "REST APIs", "description": "Design and consume APIs", "x": 520, "y": 480, "tier": 3, "parents": ["n5", "n6"], "xp_reward": 175},
                {"id": "n9", "title": "MongoDB / SQL", "description": "Database fundamentals", "x": 700, "y": 480, "tier": 3, "parents": ["n6"], "xp_reward": 175},
                {"id": "n10", "title": "Full Stack App", "description": "Build a complete web project", "x": 400, "y": 620, "tier": 4, "parents": ["n7", "n8", "n9"], "xp_reward": 500},
            ]
        },
        {
            "id": "data-science",
            "title": "Data Science",
            "description": "From beginner to ML engineer",
            "category": "Science",
            "color": "#10b981",
            "icon": "📊",
            "nodes": [
                {"id": "n1", "title": "Python Basics", "description": "Syntax, loops, functions", "x": 400, "y": 80, "tier": 0, "parents": [], "xp_reward": 50},
                {"id": "n2", "title": "NumPy", "description": "Numerical computing", "x": 250, "y": 220, "tier": 1, "parents": ["n1"], "xp_reward": 75},
                {"id": "n3", "title": "Pandas", "description": "Data manipulation", "x": 550, "y": 220, "tier": 1, "parents": ["n1"], "xp_reward": 75},
                {"id": "n4", "title": "Matplotlib / Seaborn", "description": "Data visualization", "x": 180, "y": 360, "tier": 2, "parents": ["n2", "n3"], "xp_reward": 100},
                {"id": "n5", "title": "Statistics", "description": "Probability and stats", "x": 420, "y": 360, "tier": 2, "parents": ["n2", "n3"], "xp_reward": 125},
                {"id": "n6", "title": "Scikit-Learn", "description": "ML models and pipelines", "x": 660, "y": 360, "tier": 2, "parents": ["n3"], "xp_reward": 150},
                {"id": "n7", "title": "Machine Learning", "description": "Supervised & unsupervised", "x": 350, "y": 500, "tier": 3, "parents": ["n5", "n6"], "xp_reward": 250},
                {"id": "n8", "title": "Deep Learning", "description": "Neural nets with TensorFlow", "x": 400, "y": 640, "tier": 4, "parents": ["n7"], "xp_reward": 400},
            ]
        },
        {
            "id": "ui-design",
            "title": "UI/UX Design",
            "description": "Design thinking to high-fidelity prototypes",
            "category": "Design",
            "color": "#f59e0b",
            "icon": "🎨",
            "nodes": [
                {"id": "n1", "title": "Design Principles", "description": "Color, typography, spacing", "x": 400, "y": 80, "tier": 0, "parents": [], "xp_reward": 50},
                {"id": "n2", "title": "Wireframing", "description": "Low-fidelity sketches", "x": 250, "y": 220, "tier": 1, "parents": ["n1"], "xp_reward": 75},
                {"id": "n3", "title": "User Research", "description": "Interviews and usability tests", "x": 560, "y": 220, "tier": 1, "parents": ["n1"], "xp_reward": 75},
                {"id": "n4", "title": "Figma Basics", "description": "Frames, components, variants", "x": 200, "y": 360, "tier": 2, "parents": ["n2"], "xp_reward": 100},
                {"id": "n5", "title": "Prototyping", "description": "Interactions and animations", "x": 400, "y": 360, "tier": 2, "parents": ["n2", "n3"], "xp_reward": 125},
                {"id": "n6", "title": "Accessibility", "description": "WCAG standards and inclusive design", "x": 620, "y": 360, "tier": 2, "parents": ["n3"], "xp_reward": 100},
                {"id": "n7", "title": "Design Systems", "description": "Component libraries and tokens", "x": 400, "y": 500, "tier": 3, "parents": ["n4", "n5", "n6"], "xp_reward": 300},
                {"id": "n8", "title": "Portfolio Project", "description": "End-to-end case study", "x": 400, "y": 640, "tier": 4, "parents": ["n7"], "xp_reward": 500},
            ]
        }
    ]
    return jsonify(templates), 200

@skills_bp.route("/", methods=["GET"])
@jwt_required()
def list_trees():
    uid = get_jwt_identity()
    db = get_db()
    trees = list(db.skill_trees.find({"owner_id": ObjectId(uid)}).sort("created_at", -1))
    return jsonify([serialize_tree(t) for t in trees]), 200

@skills_bp.route("/public", methods=["GET"])
def public_trees():
    db = get_db()
    trees = list(db.skill_trees.find({"is_public": True}).sort("created_at", -1).limit(20))
    return jsonify([serialize_tree(t) for t in trees]), 200

@skills_bp.route("/<tree_id>", methods=["GET"])
@jwt_required()
def get_tree(tree_id):
    uid = get_jwt_identity()
    db = get_db()
    tree = db.skill_trees.find_one({"_id": ObjectId(tree_id)})
    if not tree:
        return jsonify({"error": "Tree not found"}), 404
    if str(tree["owner_id"]) != uid and not tree.get("is_public"):
        return jsonify({"error": "Access denied"}), 403
    return jsonify(serialize_tree(tree)), 200

@skills_bp.route("/", methods=["POST"])
@jwt_required()
def create_tree():
    uid = get_jwt_identity()
    data = request.get_json()
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    db = get_db()
    tree = {
        "owner_id": ObjectId(uid),
        "title": title,
        "description": data.get("description", ""),
        "category": data.get("category", "Other"),
        "color": data.get("color", "#6366f1"),
        "icon": data.get("icon", "📚"),
        "nodes": data.get("nodes", []),
        "is_public": data.get("is_public", False),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "total_xp": sum(n.get("xp_reward", 0) for n in data.get("nodes", [])),
        "completed_count": 0,
    }
    result = db.skill_trees.insert_one(tree)
    db.users.update_one({"_id": ObjectId(uid)}, {"$inc": {"trees_count": 1}})
    tree["_id"] = result.inserted_id
    return jsonify(serialize_tree(tree)), 201

@skills_bp.route("/<tree_id>", methods=["PUT"])
@jwt_required()
def update_tree(tree_id):
    uid = get_jwt_identity()
    db = get_db()
    tree = db.skill_trees.find_one({"_id": ObjectId(tree_id), "owner_id": ObjectId(uid)})
    if not tree:
        return jsonify({"error": "Tree not found"}), 404

    data = request.get_json()
    allowed = ["title", "description", "category", "color", "icon", "nodes", "is_public"]
    update = {k: v for k, v in data.items() if k in allowed}
    update["updated_at"] = datetime.utcnow()
    if "nodes" in update:
        update["total_xp"] = sum(n.get("xp_reward", 0) for n in update["nodes"])

    db.skill_trees.update_one({"_id": ObjectId(tree_id)}, {"$set": update})
    tree = db.skill_trees.find_one({"_id": ObjectId(tree_id)})
    return jsonify(serialize_tree(tree)), 200

@skills_bp.route("/<tree_id>", methods=["DELETE"])
@jwt_required()
def delete_tree(tree_id):
    uid = get_jwt_identity()
    db = get_db()
    result = db.skill_trees.delete_one({"_id": ObjectId(tree_id), "owner_id": ObjectId(uid)})
    if result.deleted_count == 0:
        return jsonify({"error": "Tree not found"}), 404
    db.users.update_one({"_id": ObjectId(uid)}, {"$inc": {"trees_count": -1}})
    return jsonify({"message": "Tree deleted"}), 200
