"""Auth routes — login verification, profile management."""
from flask import Blueprint, request, jsonify, g
from config import get_supabase_client, get_supabase_admin
from middleware.auth_middleware import require_auth

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user via Supabase Auth."""
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name", "")
    role = data.get("role", "patient")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    supabase = get_supabase_client()
    try:
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": full_name,
                    "role": role,
                }
            }
        })

        if auth_response.user:
            # Create user record in users table
            admin = get_supabase_admin()
            admin.table("users").insert({
                "id": auth_response.user.id,
                "email": email,
                "full_name": full_name,
                "role": role,
            }).execute()

            # If patient, create patient record
            if role == "patient":
                admin.table("patients").insert({
                    "user_id": auth_response.user.id,
                    "phone": data.get("phone", ""),
                    "gender": data.get("gender", ""),
                    "dob": data.get("dob"),
                    "address": data.get("address", ""),
                }).execute()

            return jsonify({
                "message": "Registration successful",
                "user_id": auth_response.user.id,
            }), 201
        else:
            return jsonify({"error": "Registration failed"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@auth_bp.route("/login", methods=["POST"])
def login():
    """Login with email/password via Supabase Auth."""
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    supabase = get_supabase_client()
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })

        if auth_response.session:
            # Fetch user profile
            admin = get_supabase_admin()
            user_data = admin.table("users").select("*").eq(
                "id", auth_response.user.id
            ).single().execute()

            return jsonify({
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
                "user": user_data.data,
            })
        else:
            return jsonify({"error": "Login failed"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 401


@auth_bp.route("/profile", methods=["GET"])
@require_auth
def get_profile():
    """Get current user's profile."""
    supabase = get_supabase_admin()
    user = supabase.table("users").select("*").eq("id", g.user_id).single().execute()
    if user.data:
        return jsonify(user.data)
    return jsonify({"error": "User not found"}), 404


@auth_bp.route("/profile", methods=["PUT"])
@require_auth
def update_profile():
    """Update current user's profile."""
    data = request.get_json()
    supabase = get_supabase_admin()
    allowed = {"full_name", "phone", "address"}
    updates = {k: v for k, v in data.items() if k in allowed}

    if updates:
        supabase.table("users").update(updates).eq("id", g.user_id).execute()

    user = supabase.table("users").select("*").eq("id", g.user_id).single().execute()
    return jsonify(user.data)
