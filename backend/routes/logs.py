from flask import Blueprint, jsonify
from config import get_supabase_admin
from middleware.auth_middleware import require_auth, require_role

logs_bp = Blueprint("logs", __name__, url_prefix="/api/logs")

@logs_bp.route("", methods=["GET"])
@require_auth
@require_role("admin")
def get_activity_logs():
    supabase = get_supabase_admin()
    result = supabase.table("activity_logs").select("*, users(full_name, email)").order("timestamp", desc=True).limit(100).execute()
    return jsonify(result.data or [])
