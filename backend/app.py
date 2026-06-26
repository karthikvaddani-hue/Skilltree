from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)

    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "skilltree-super-secret-key-change-in-prod")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    JWTManager(app)

    from routes.auth import auth_bp
    from routes.skills import skills_bp
    from routes.progress import progress_bp
    from routes.badges import badges_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(skills_bp, url_prefix="/api/skills")
    app.register_blueprint(progress_bp, url_prefix="/api/progress")
    app.register_blueprint(badges_bp, url_prefix="/api/badges")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "SkillTree API running"}

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
