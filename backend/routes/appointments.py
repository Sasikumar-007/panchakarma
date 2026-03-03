"""Appointment routes — CRUD for patient appointments."""
from flask import Blueprint, request, jsonify, g
from config import get_supabase_admin
from middleware.auth_middleware import require_auth, require_role

appointments_bp = Blueprint("appointments", __name__, url_prefix="/api/appointments")


@appointments_bp.route("", methods=["GET"])
@require_auth
def get_appointments():
    """Get appointments based on user role."""
    try:
        supabase = get_supabase_admin()
        role = g.user_role

        if role == "patient":
            # Get patient record
            patient = supabase.table("patients").select("id").eq("user_id", g.user_id).single().execute()
            if not patient.data:
                return jsonify([])
            result = supabase.table("appointments").select(
                "*, patients(*, users(full_name)), doctor:users!appointments_doctor_id_fkey(full_name)"
            ).eq("patient_id", patient.data["id"]).order("date", desc=True).execute()

        elif role == "doctor":
            result = supabase.table("appointments").select(
                "*, patients(*, users(full_name)), doctor:users!appointments_doctor_id_fkey(full_name)"
            ).eq("doctor_id", g.user_id).order("date", desc=True).execute()

        else:  # admin or therapist
            result = supabase.table("appointments").select(
                "*, patients(*, users(full_name)), doctor:users!appointments_doctor_id_fkey(full_name)"
            ).order("date", desc=True).limit(100).execute()

        return jsonify(result.data if result.data else [])
    except Exception:
        from mock_db import get_mock_appointments, get_mock_users
        appointments = get_mock_appointments()
        for a in appointments:
            if "doctor_id" in a:
                docs = [u for u in get_mock_users("doctor") if u["id"] == a["doctor_id"]]
                a["doctor"] = {"full_name": docs[0]["full_name"] if docs else "Unknown Doctor"}
            if "patient_id" in a:
                pats = [u for u in get_mock_users("patient") if u["id"] == a["patient_id"]]
                a["patients"] = {"users": {"full_name": pats[0]["full_name"] if pats else "Unknown Patient"}}
        return jsonify(appointments)


@appointments_bp.route("", methods=["POST"])
@require_auth
def create_appointment():
    """Book a new appointment."""
    data = request.get_json()

    try:
        supabase = get_supabase_admin()

        # Get patient_id
        patient_id = data.get("patient_id")
        if g.user_role == "patient":
            patient = supabase.table("patients").select("id").eq("user_id", g.user_id).single().execute()
            if patient.data:
                patient_id = patient.data["id"]

        if not patient_id:
            return jsonify({"error": "Patient ID required"}), 400

        appointment = {
            "patient_id": patient_id,
            "doctor_id": data.get("doctor_id"),
            "date": data.get("date"),
            "time_slot": data.get("time_slot"),
            "status": "scheduled",
            "notes": data.get("notes", ""),
        }

        result = supabase.table("appointments").insert(appointment).execute()
        return jsonify(result.data[0] if result.data else {}), 201
    except Exception as e:
        print("======== INSERT APPOINTMENT ERROR ========")
        print(f"Exception details: {str(e)}")
        print(f"Data payload attempted: {appointment if 'appointment' in locals() else 'Failed before payload building'}")
        
        # Optionally fallback to mock DB if needed
        from mock_db import add_mock_appointment
        patient_id = data.get("patient_id") or g.user_id
        if not patient_id:
            return jsonify({"error": "Patient ID required", "details": str(e)}), 400
        appointment_mock = {
            "patient_id": patient_id,
            "doctor_id": data.get("doctor_id"),
            "date": data.get("date"),
            "time_slot": data.get("time_slot"),
            "status": "scheduled",
            "notes": data.get("notes", ""),
        }
        new_appt = add_mock_appointment(appointment_mock)
        return jsonify({"success": False, "error": str(e), "mocked_data": new_appt}), 500


@appointments_bp.route("/<appointment_id>", methods=["GET"])
@require_auth
def get_appointment(appointment_id):
    """Get a single appointment."""
    supabase = get_supabase_admin()
    result = supabase.table("appointments").select(
        "*, patients(*, users(full_name, email)), doctor:users!appointments_doctor_id_fkey(full_name, email)"
    ).eq("id", appointment_id).single().execute()

    if result.data:
        return jsonify(result.data)
    return jsonify({"error": "Appointment not found"}), 404


@appointments_bp.route("/<appointment_id>", methods=["PUT"])
@require_auth
def update_appointment(appointment_id):
    """Update appointment status/notes."""
    data = request.get_json()
    supabase = get_supabase_admin()
    allowed = {"status", "notes", "date", "time_slot", "doctor_id"}
    updates = {k: v for k, v in data.items() if k in allowed}

    result = supabase.table("appointments").update(updates).eq("id", appointment_id).execute()
    return jsonify(result.data[0] if result.data else {})


@appointments_bp.route("/<appointment_id>", methods=["DELETE"])
@require_auth
def cancel_appointment(appointment_id):
    """Cancel an appointment."""
    supabase = get_supabase_admin()
    supabase.table("appointments").update({"status": "cancelled"}).eq("id", appointment_id).execute()
    return jsonify({"message": "Appointment cancelled"})


@appointments_bp.route("/doctors", methods=["GET"])
@require_auth
def get_doctors():
    """Get list of doctors for appointment booking."""
    try:
        supabase = get_supabase_admin()
        result = supabase.table("users").select("id, full_name, email").eq("role", "doctor").execute()
        return jsonify(result.data if result.data else [])
    except Exception:
        from mock_db import get_mock_users
        doctors = get_mock_users("doctor")
        return jsonify(doctors)
