"""
Payment Service — Razorpay Integration
Handles order creation, payment verification, and invoice generation.
"""
import hmac
import hashlib
from config import get_razorpay_client, RAZORPAY_KEY_SECRET, get_supabase_admin


def create_order(amount: int, currency: str = "INR", receipt: str = None, notes: dict = None) -> dict:
    """
    Create a Razorpay order.

    Args:
        amount: Amount in paise (INR smallest unit). E.g., 50000 = ₹500
        currency: Currency code (default INR)
        receipt: Optional receipt ID
        notes: Optional metadata

    Returns:
        Razorpay order dict
    """
    client = get_razorpay_client()
    order_data = {
        "amount": amount,
        "currency": currency,
        "receipt": receipt or "receipt_auto",
        "notes": notes or {},
    }
    try:
        order = client.order.create(data=order_data)
        return {"success": True, "order": order}
    except Exception as e:
        return {"success": False, "error": str(e)}


def verify_payment(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
    """
    Verify Razorpay payment signature.
    """
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    generated_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(generated_signature, razorpay_signature)


def confirm_payment(billing_id: str, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> dict:
    """
    Confirm payment and update billing record.
    """
    is_valid = verify_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature)

    if not is_valid:
        return {"success": False, "error": "Invalid payment signature"}

    supabase = get_supabase_admin()

    # Update billing record
    supabase.table("billing").update({
        "status": "paid",
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": razorpay_signature,
    }).eq("id", billing_id).execute()

    # Create payment record
    supabase.table("payments").insert({
        "billing_id": billing_id,
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": razorpay_payment_id,
        "status": "captured",
        "amount": 0,  # Will be updated from billing
    }).execute()

    return {"success": True, "message": "Payment confirmed successfully"}
