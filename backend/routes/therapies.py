"""Therapy routes — manage therapy assignments and progress."""
from flask import Blueprint, request, jsonify, g
from config import get_supabase_admin
from middleware.auth_middleware import require_auth, require_role
from services.ai_engine import analyze_dosha, get_available_symptoms
from services.therapist_service import suggest_therapist

therapies_bp = Blueprint("therapies", __name__, url_prefix="/api/therapies")


@therapies_bp.route("", methods=["GET"])
@require_auth
def get_therapies():
    """Get therapies based on user role."""
    try:
        supabase = get_supabase_admin()

        if g.user_role == "therapist":
            # Get therapist record
            therapist = supabase.table("therapists").select("id").eq("user_id", g.user_id).single().execute()
            if not therapist.data:
                return jsonify([])
            result = supabase.table("therapies").select(
                "*, patients(*, users(full_name)), therapist:therapists(*, users(full_name))"
            ).eq("therapist_id", therapist.data["id"]).order("created_at", desc=True).execute()

        elif g.user_role == "patient":
            patient = supabase.table("patients").select("id").eq("user_id", g.user_id).single().execute()
            if not patient.data:
                return jsonify([])
            result = supabase.table("therapies").select(
                "*, patients(*, users(full_name)), therapist:therapists(*, users(full_name))"
            ).eq("patient_id", patient.data["id"]).order("created_at", desc=True).execute()

        else:
            result = supabase.table("therapies").select(
                "*, patients(*, users(full_name)), therapist:therapists(*, users(full_name))"
            ).order("created_at", desc=True).limit(100).execute()

        return jsonify(result.data if result.data else [])
    except Exception:
        return jsonify([])


@therapies_bp.route("", methods=["POST"])
@require_auth
@require_role("doctor", "admin")
def create_therapy():
    """Assign a therapy to a patient."""
    data = request.get_json()
    try:
        supabase = get_supabase_admin()

        therapy = {
            "appointment_id": data.get("appointment_id"),
            "patient_id": data.get("patient_id"),
            "therapist_id": data.get("therapist_id"),
            "therapy_type": data.get("therapy_type"),
            "status": "assigned",
            "start_date": data.get("start_date"),
            "end_date": data.get("end_date"),
            "progress_notes": "",
        }

        result = supabase.table("therapies").insert(therapy).execute()
        return jsonify(result.data[0] if result.data else {}), 201
    except Exception as e:
        print(f"Mocked Therapy created: {e}")
        return jsonify({"message": "Therapy assigned (mock offline mode)"}), 201


@therapies_bp.route("/<therapy_id>", methods=["PUT"])
@require_auth
def update_therapy(therapy_id):
    """Update therapy progress."""
    data = request.get_json()
    supabase = get_supabase_admin()

    allowed = {"status", "progress_notes", "end_date"}
    updates = {k: v for k, v in data.items() if k in allowed}

    result = supabase.table("therapies").update(updates).eq("id", therapy_id).execute()
    return jsonify(result.data[0] if result.data else {})


@therapies_bp.route("/<therapy_id>/complete", methods=["POST"])
@require_auth
@require_role("therapist", "doctor", "admin")
def complete_therapy(therapy_id):
    """Mark therapy as completed."""
    supabase = get_supabase_admin()
    data = request.get_json() or {}

    supabase.table("therapies").update({
        "status": "completed",
        "progress_notes": data.get("final_notes", "Therapy completed successfully"),
    }).eq("id", therapy_id).execute()

    return jsonify({"message": "Therapy marked as completed"})


# ---- AI Dosha Analysis Endpoints ----

@therapies_bp.route("/dosha/analyze", methods=["POST"])
@require_auth
def dosha_analyze():
    """Run AI Dosha analysis on symptoms."""
    data = request.get_json()
    symptoms = data.get("symptoms", [])

    if not symptoms:
        return jsonify({"error": "Please provide symptoms list"}), 400

    result = analyze_dosha(symptoms)

    if "error" in result:
        return jsonify(result), 400

    # Optionally store the result
    if data.get("patient_id") and data.get("save", False):
        try:
            supabase = get_supabase_admin()
            supabase.table("dosha_results").insert({
                "patient_id": data["patient_id"],
                "doctor_id": g.user_id if g.user_role == "doctor" else None,
                "symptoms": symptoms,
                "vata_score": result["scores"]["vata"],
                "pitta_score": result["scores"]["pitta"],
                "kapha_score": result["scores"]["kapha"],
                "dominant_dosha": result["dominant_dosha"],
                "confidence": result["confidence"],
                "recommended_therapy": result["recommended_therapies"],
                "medicines": result["recommended_medicines"],
                "diet": result["suggested_diet"],
            }).execute()
        except Exception as e:
            # Fallback for mockup if Auth / DB are restricted
            print(f"Skipping dosha_results save: {e}")

    return jsonify(result)


@therapies_bp.route("/dosha/symptoms", methods=["GET"])
@require_auth
def dosha_symptoms():
    """Get list of available symptoms for Dosha analysis."""
    return jsonify({"symptoms": get_available_symptoms()})


@therapies_bp.route("/suggest-therapist", methods=["POST"])
@require_auth
@require_role("doctor", "admin")
def suggest():
    """Suggest best therapist for a therapy type."""
    data = request.get_json()
    therapy_type = data.get("therapy_type", "")
    result = suggest_therapist(therapy_type, data.get("preferred_date"))
    return jsonify(result)
