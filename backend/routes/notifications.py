from flask import Blueprint, jsonify, g
from config import get_supabase_admin
from middleware.auth_middleware import require_auth

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")

@notifications_bp.route("", methods=["GET"])
@require_auth
def get_notifications():
    supabase = get_supabase_admin()
    result = supabase.table("notifications").select("*").eq("user_id", g.user_id).order("created_at", desc=True).limit(20).execute()
    return jsonify(result.data or [])

@notifications_bp.route("/<notif_id>/read", methods=["PUT"])
@require_auth
def mark_read(notif_id):
    supabase = get_supabase_admin()
    result = supabase.table("notifications").update({"is_read": True}).eq("id", notif_id).eq("user_id", g.user_id).execute()
    return jsonify(result.data[0] if result.data else {})
