"""
Panchakarma Patient Management System — Flask Backend
Main application entry point.
"""
from flask import Flask
from flask_cors import CORS
from config import SECRET_KEY, DEBUG, PORT

# Import blueprints
from routes.auth import auth_bp
from routes.appointments import appointments_bp
from routes.therapies import therapies_bp
from routes.prescriptions import prescriptions_bp
from routes.billing import billing_bp
from routes.admin import admin_bp


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY

    # CORS — allow frontend origins
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(appointments_bp)
    app.register_blueprint(therapies_bp)
    app.register_blueprint(prescriptions_bp)
    app.register_blueprint(billing_bp)
    app.register_blueprint(admin_bp)

    # Health check
    @app.route("/api/health")
    def health():
        return {"status": "healthy", "service": "Panchakarma API"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=DEBUG, port=PORT, host="0.0.0.0")
