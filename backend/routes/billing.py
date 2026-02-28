"""Billing routes — bill generation, payment, invoices."""
from flask import Blueprint, request, jsonify, g
from config import get_supabase_admin, RAZORPAY_KEY_ID
from middleware.auth_middleware import require_auth, require_role
from services.payment_service import create_order, confirm_payment

billing_bp = Blueprint("billing", __name__, url_prefix="/api/billing")


@billing_bp.route("", methods=["GET"])
@require_auth
def get_bills():
    """Get billing records based on role."""
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


@billing_bp.route("", methods=["POST"])
@require_auth
@require_role("doctor", "admin")
def create_bill():
    """Generate a bill for a patient."""
    data = request.get_json()
    supabase = get_supabase_admin()

    bill = {
        "patient_id": data.get("patient_id"),
        "appointment_id": data.get("appointment_id"),
        "amount": data.get("amount"),
        "description": data.get("description", "Panchakarma Treatment"),
        "status": "pending",
    }

    result = supabase.table("billing").insert(bill).execute()
    return jsonify(result.data[0] if result.data else {}), 201


@billing_bp.route("/<bill_id>/pay", methods=["POST"])
@require_auth
def initiate_payment(bill_id):
    """Create Razorpay order for a bill."""
    supabase = get_supabase_admin()
    bill = supabase.table("billing").select("*").eq("id", bill_id).single().execute()

    if not bill.data:
        return jsonify({"error": "Bill not found"}), 404

    if bill.data["status"] == "paid":
        return jsonify({"error": "Bill already paid"}), 400

    amount_paise = int(float(bill.data["amount"]) * 100)
    order_result = create_order(
        amount=amount_paise,
        receipt=f"bill_{bill_id}",
        notes={"bill_id": bill_id},
    )

    if not order_result["success"]:
        return jsonify({"error": order_result["error"]}), 500

    # Store order ID in billing
    supabase.table("billing").update({
        "razorpay_order_id": order_result["order"]["id"],
    }).eq("id", bill_id).execute()

    return jsonify({
        "order_id": order_result["order"]["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
    })


@billing_bp.route("/<bill_id>/confirm", methods=["POST"])
@require_auth
def confirm_bill_payment(bill_id):
    """Confirm Razorpay payment for a bill."""
    data = request.get_json()
    result = confirm_payment(
        billing_id=bill_id,
        razorpay_order_id=data.get("razorpay_order_id"),
        razorpay_payment_id=data.get("razorpay_payment_id"),
        razorpay_signature=data.get("razorpay_signature"),
    )

    if result["success"]:
        return jsonify(result)
    return jsonify(result), 400


@billing_bp.route("/revenue", methods=["GET"])
@require_auth
@require_role("admin")
def get_revenue():
    """Get revenue analytics."""
    supabase = get_supabase_admin()
    paid = supabase.table("billing").select("amount").eq("status", "paid").execute()
    pending = supabase.table("billing").select("amount").eq("status", "pending").execute()

    total_paid = sum(float(b["amount"]) for b in (paid.data or []))
    total_pending = sum(float(b["amount"]) for b in (pending.data or []))

    return jsonify({
        "total_revenue": total_paid,
        "pending_amount": total_pending,
        "paid_count": len(paid.data or []),
        "pending_count": len(pending.data or []),
    })
