from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure
import os

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is None:
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        db_name = os.getenv("DB_NAME", "skilltree_db")
        _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        _db = _client[db_name]
        _setup_indexes(_db)
    return _db

def _setup_indexes(db):
    # Users collection indexes
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.users.create_index([("username", ASCENDING)], unique=True)

    # Skill trees indexes
    db.skill_trees.create_index([("owner_id", ASCENDING)])
    db.skill_trees.create_index([("is_public", ASCENDING)])
    db.skill_trees.create_index([("category", ASCENDING)])
    db.skill_trees.create_index([("created_at", DESCENDING)])

    # Badges indexes
    db.badges.create_index([("user_id", ASCENDING)])

    print("[DB] Indexes created successfully")
