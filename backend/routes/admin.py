"""Admin routes — user management, analytics, reports."""
from flask import Blueprint, request, jsonify, g
from config import get_supabase_admin
from middleware.auth_middleware import require_auth, require_role

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/users", methods=["GET"])
@require_auth
@require_role("admin")
def get_users():
    """Get all users with optional role filter."""
    supabase = get_supabase_admin()
    role = request.args.get("role")
    query = supabase.table("users").select("*")
    if role:
        query = query.eq("role", role)
    result = query.order("created_at", desc=True).execute()
    return jsonify(result.data if result.data else [])


@admin_bp.route("/users/<user_id>", methods=["PUT"])
@require_auth
@require_role("admin")
def update_user(user_id):
    """Update user details."""
    data = request.get_json()
    supabase = get_supabase_admin()
    allowed = {"full_name", "role", "email"}
    updates = {k: v for k, v in data.items() if k in allowed}

    result = supabase.table("users").update(updates).eq("id", user_id).execute()
    return jsonify(result.data[0] if result.data else {})


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@require_auth
@require_role("admin")
def delete_user(user_id):
    """Remove a user."""
    supabase = get_supabase_admin()
    supabase.table("users").delete().eq("id", user_id).execute()
    return jsonify({"message": "User deleted"})


@admin_bp.route("/analytics", methods=["GET"])
@require_auth
@require_role("admin")
def get_analytics():
    """Get dashboard analytics."""
    supabase = get_supabase_admin()

    # Count users by role
    doctors = supabase.table("users").select("id", count="exact").eq("role", "doctor").execute()
    therapists = supabase.table("users").select("id", count="exact").eq("role", "therapist").execute()
    patients = supabase.table("users").select("id", count="exact").eq("role", "patient").execute()

    # Count appointments by status
    scheduled = supabase.table("appointments").select("id", count="exact").eq("status", "scheduled").execute()
    completed = supabase.table("appointments").select("id", count="exact").eq("status", "completed").execute()

    # Count active therapies
    active_therapies = supabase.table("therapies").select("id", count="exact").eq("status", "in_progress").execute()

    # Revenue
    paid = supabase.table("billing").select("amount").eq("status", "paid").execute()
    total_revenue = sum(float(b["amount"]) for b in (paid.data or []))

    return jsonify({
        "users": {
            "doctors": doctors.count or 0,
            "therapists": therapists.count or 0,
            "patients": patients.count or 0,
        },
        "appointments": {
            "scheduled": scheduled.count or 0,
            "completed": completed.count or 0,
        },
        "active_therapies": active_therapies.count or 0,
        "total_revenue": total_revenue,
    })


@admin_bp.route("/therapists", methods=["POST"])
@require_auth
@require_role("admin")
def add_therapist():
    """Register a therapist profile."""
    data = request.get_json()
    supabase = get_supabase_admin()

    therapist = {
        "user_id": data.get("user_id"),
        "specialization": data.get("specialization", "General"),
        "availability": data.get("availability", True),
    }

    result = supabase.table("therapists").insert(therapist).execute()
    return jsonify(result.data[0] if result.data else {}), 201
