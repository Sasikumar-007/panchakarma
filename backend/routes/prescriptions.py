"""Prescription routes — digital prescription management."""
from flask import Blueprint, request, jsonify, g
from config import get_supabase_admin
from middleware.auth_middleware import require_auth, require_role

prescriptions_bp = Blueprint("prescriptions", __name__, url_prefix="/api/prescriptions")


@prescriptions_bp.route("", methods=["GET"])
@require_auth
def get_prescriptions():
    """Get prescriptions based on user role."""
    supabase = get_supabase_admin()

    if g.user_role == "patient":
        patient = supabase.table("patients").select("id").eq("user_id", g.user_id).single().execute()
        if not patient.data:
            return jsonify([])
        result = supabase.table("prescriptions").select(
            "*, doctor:users!prescriptions_doctor_id_fkey(full_name)"
        ).eq("patient_id", patient.data["id"]).order("created_at", desc=True).execute()

    elif g.user_role == "doctor":
        result = supabase.table("prescriptions").select(
            "*, patients(*, users(full_name))"
        ).eq("doctor_id", g.user_id).order("created_at", desc=True).execute()

    else:
        result = supabase.table("prescriptions").select(
            "*, doctor:users!prescriptions_doctor_id_fkey(full_name), patients(*, users(full_name))"
        ).order("created_at", desc=True).limit(100).execute()

    return jsonify(result.data if result.data else [])


@prescriptions_bp.route("", methods=["POST"])
@require_auth
@require_role("doctor")
def create_prescription():
    """Generate a digital prescription."""
    data = request.get_json()
    supabase = get_supabase_admin()

    prescription = {
        "appointment_id": data.get("appointment_id"),
        "doctor_id": g.user_id,
        "patient_id": data.get("patient_id"),
        "medicines": data.get("medicines", []),
        "instructions": data.get("instructions", ""),
        "diagnosis": data.get("diagnosis", ""),
        "dosha_result_id": data.get("dosha_result_id"),
    }

    result = supabase.table("prescriptions").insert(prescription).execute()
    return jsonify(result.data[0] if result.data else {}), 201


@prescriptions_bp.route("/<prescription_id>", methods=["GET"])
@require_auth
def get_prescription(prescription_id):
    """Get a single prescription."""
    supabase = get_supabase_admin()
    result = supabase.table("prescriptions").select(
        "*, doctor:users!prescriptions_doctor_id_fkey(full_name, email), patients(*, users(full_name, email))"
    ).eq("id", prescription_id).single().execute()

    if result.data:
        return jsonify(result.data)
    return jsonify({"error": "Prescription not found"}), 404
