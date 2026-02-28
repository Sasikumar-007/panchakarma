from functools import wraps
from flask import request, jsonify, g
import jwt
from config import JWT_SECRET, get_supabase_client


def require_auth(f):
    """Verify Supabase JWT token on protected routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Authentication token is missing"}), 401

        try:
            # Decode with Supabase JWT secret
            payload = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_aud": False}
            )
            g.user_id = payload.get("sub")
            g.user_email = payload.get("email")
            g.user_role = payload.get("user_metadata", {}).get("role", "patient")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401

        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    """Restrict access to specific roles."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.user_role not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
