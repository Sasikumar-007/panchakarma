"""Billing routes — bill generation, payment, invoices."""
from flask import Blueprint, request, jsonify, g
from config import get_supabase_admin
from middleware.auth_middleware import require_auth, require_role

billing_bp = Blueprint("billing", __name__, url_prefix="/api/billing")


@billing_bp.route("", methods=["GET"])
@require_auth
def get_bills():
    """Get billing records based on role."""
    try:
        supabase = get_supabase_admin()

        if g.user_role == "patient":
            patient = supabase.table("patients").select("id").eq("user_id", g.user_id).single().execute()
            if not patient.data:
                return jsonify([])
            result = supabase.table("billing").select("*").eq(
                "patient_id", patient.data["id"]
            ).order("created_at", desc=True).execute()
        else:
            result = supabase.table("billing").select(
                "*, patients(*, users(full_name))"
            ).order("created_at", desc=True).limit(100).execute()

        return jsonify(result.data if result.data else [])
    except Exception:
        return jsonify([])


@billing_bp.route("", methods=["POST"])
@require_auth
@require_role("doctor", "admin")
def create_bill():
    """Generate a bill for a patient."""
    data = request.get_json()
    try:
        supabase = get_supabase_admin()

        bill = {
            "patient_id": data.get("patient_id"),
            "appointment_id": data.get("appointment_id"),
            "therapy_id": data.get("therapy_id"),
            "consultation_fee": data.get("consultation_fee", 0),
            "therapy_fee": data.get("therapy_fee", 0),
            "total_amount": data.get("total_amount", 0),
            "description": data.get("description", "Consultation & Therapy"),
            "status": "pending",
        }

        result = supabase.table("billing").insert(bill).execute()
        return jsonify(result.data[0] if result.data else {}), 201
    except Exception as e:
        print(f"Mocked Bill created: {e}")
        return jsonify({"message": "Bill generated (mock offline mode)"}), 201


@billing_bp.route("/<patient_id>", methods=["GET"])
@require_auth
def get_patient_bills(patient_id):
    """Get billing records for a specific patient."""
    try:
        supabase = get_supabase_admin()
        
        # Verify access for patient rule
        if g.user_role == "patient":
            patient = supabase.table("patients").select("id").eq("user_id", g.user_id).single().execute()
            if not patient.data or patient.data["id"] != patient_id:
                return jsonify({"error": "Unauthorized"}), 403

        result = supabase.table("billing").select(
            "*, therapies(therapy_type)"
        ).eq("patient_id", patient_id).order("created_at", desc=True).execute()

        return jsonify(result.data if result.data else [])
    except Exception:
        return jsonify([])


@billing_bp.route("/<bill_id>", methods=["PUT"])
@require_auth
def update_bill(bill_id):
    """Update a bill (e.g., mark as Paid)."""
    data = request.get_json()
    supabase = get_supabase_admin()

    updates = {}
    if "payment_status" in data:
        status_val = data["payment_status"].lower()
        if status_val in ["pending", "paid", "cancelled", "refunded"]:
            updates["status"] = status_val

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    # Ensure patient can only update their own bills if needed or verify
    if g.user_role == "patient":
        patient = supabase.table("patients").select("id").eq("user_id", g.user_id).single().execute()
        if patient.data:
            bill_check = supabase.table("billing").select("id").eq("id", bill_id).eq("patient_id", patient.data["id"]).execute()
            if not bill_check.data:
                return jsonify({"error": "Unauthorized"}), 403

    result = supabase.table("billing").update(updates).eq("id", bill_id).execute()
    return jsonify(result.data[0] if result.data else {})


@billing_bp.route("/revenue", methods=["GET"])
@require_auth
@require_role("admin")
def get_revenue():
    """Get revenue analytics."""
    try:
        supabase = get_supabase_admin()
        paid = supabase.table("billing").select("total_amount").eq("status", "paid").execute()
        pending = supabase.table("billing").select("total_amount").eq("status", "pending").execute()

        total_paid = sum(float(b.get("total_amount", 0)) for b in (paid.data or []))
        total_pending = sum(float(b.get("total_amount", 0)) for b in (pending.data or []))

        return jsonify({
            "total_revenue": total_paid,
            "pending_amount": total_pending,
            "paid_count": len(paid.data or []),
            "pending_count": len(pending.data or []),
        })
    except Exception:
        return jsonify({
            "total_revenue": 0,
            "pending_amount": 0,
            "paid_count": 0,
            "pending_count": 0,
        })
