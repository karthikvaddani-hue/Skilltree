"""
Seed script: creates demo user + sample skill trees in MongoDB.
Run: python scripts/seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from datetime import datetime
from bson import ObjectId
import bcrypt

def seed():
    db = get_db()
    
    # Clear existing demo data
    db.users.delete_many({"email": "demo@skilltree.dev"})
    
    # Create demo user
    hashed = bcrypt.hashpw(b"demo1234", bcrypt.gensalt())
    user = {
        "username": "hero_scholar",
        "email": "demo@skilltree.dev",
        "password": hashed,
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=hero_scholar",
        "xp": 750,
        "level": 2,
        "bio": "Learning everything, one node at a time 🚀",
        "joined_at": datetime.utcnow(),
        "badges_count": 2,
        "trees_count": 2,
    }
    uid = db.users.insert_one(user).inserted_id
    print(f"[SEED] Created demo user: {uid}")
    
    # Create sample trees
    web_tree = {
        "owner_id": uid,
        "title": "Web Development",
        "description": "Full-stack web development path from HTML to full apps",
        "category": "Programming",
        "icon": "🌐",
        "color": "#6366f1",
        "is_public": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "nodes": [
            {"id":"n1","title":"HTML Basics","description":"Learn HTML structure","x":400,"y":80,"tier":0,"parents":[],"xp_reward":50},
            {"id":"n2","title":"CSS Styling","description":"Style your pages","x":250,"y":220,"tier":1,"parents":["n1"],"xp_reward":75},
            {"id":"n3","title":"JavaScript","description":"JS fundamentals","x":560,"y":220,"tier":1,"parents":["n1"],"xp_reward":100},
            {"id":"n4","title":"Responsive Design","description":"Flexbox and Grid","x":150,"y":360,"tier":2,"parents":["n2"],"xp_reward":100},
            {"id":"n5","title":"React Basics","description":"Components and state","x":400,"y":360,"tier":2,"parents":["n2","n3"],"xp_reward":150},
            {"id":"n6","title":"Node.js","description":"Backend with Express","x":660,"y":360,"tier":2,"parents":["n3"],"xp_reward":150},
            {"id":"n7","title":"Full Stack App","description":"Build a complete project","x":400,"y":500,"tier":3,"parents":["n5","n6"],"xp_reward":500},
        ]
    }
    tree_id = db.skill_trees.insert_one(web_tree).inserted_id
    
    # Add progress
    db.progress.delete_many({"user_id": uid, "tree_id": tree_id})
    db.progress.insert_one({
        "user_id": uid,
        "tree_id": tree_id,
        "completed_nodes": ["n1", "n2", "n3"],
        "tree_completed": False,
        "started_at": datetime.utcnow(),
    })
    
    # Seed badges
    db.badges.delete_many({"user_id": uid})
    db.badges.insert_many([
        {"user_id": uid, "badge_id": "first_node", "title": "First Step", "description": "Complete your first node", "icon": "🌱", "earned_at": datetime.utcnow()},
        {"user_id": uid, "badge_id": "five_nodes", "title": "Getting Started", "description": "Complete 5 nodes", "icon": "⭐", "earned_at": datetime.utcnow()},
    ])
    
    print("[SEED] Done! Login: demo@skilltree.dev / demo1234")

if __name__ == "__main__":
    seed()
