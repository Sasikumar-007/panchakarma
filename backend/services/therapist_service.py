"""
Therapist Suggestion Service
Matches therapists based on specialization and availability.
"""
from config import get_supabase_admin


def suggest_therapist(therapy_type: str, preferred_date: str = None) -> dict:
    """
    Suggest the best available therapist for a given therapy type.

    Args:
        therapy_type: The type of therapy needed
        preferred_date: Optional preferred date (YYYY-MM-DD)

    Returns:
        dict with suggested therapist info
    """
    try:
        supabase = get_supabase_admin()

        # Fetch therapists matching specialization
        query = supabase.table("therapists").select(
            "*, users(full_name, email)"
        ).eq("availability", True)

        if therapy_type:
            query = query.ilike("specialization", f"%{therapy_type}%")

        result = query.execute()
        therapists = result.data if result.data else []

        if not therapists:
            # Fallback: return any available therapist
            fallback = supabase.table("therapists").select(
                "*, users(full_name, email)"
            ).eq("availability", True).limit(3).execute()
            therapists = fallback.data if fallback.data else []

        if not therapists:
            return {"error": "No available therapists found", "suggestions": []}

        # Sort by least assigned therapies (load balancing)
        suggestions = []
        for t in therapists:
            # Count active therapies for this therapist
            active = supabase.table("therapies").select(
                "id", count="exact"
            ).eq("therapist_id", t["id"]).eq("status", "in_progress").execute()

            active_count = active.count if active.count else 0
            suggestions.append({
                "therapist_id": t["id"],
                "user_id": t["user_id"],
                "name": t["users"]["full_name"] if t.get("users") else "Unknown",
                "email": t["users"]["email"] if t.get("users") else "",
                "specialization": t["specialization"],
                "active_therapies": active_count,
            })

        # Sort by fewest active therapies
        suggestions.sort(key=lambda x: x["active_therapies"])

        return {
            "suggestions": suggestions,
            "recommended": suggestions[0] if suggestions else None,
        }
    except Exception:
        return {
            "suggestions": [],
            "recommended": {"name": "Ayush Sharma (Auto-assigned Mock)", "specialization": therapy_type or "General"}
        }


def get_all_therapists() -> list:
    """Return all therapists with user info."""
    supabase = get_supabase_admin()
    result = supabase.table("therapists").select("*, users(full_name, email)").execute()
    return result.data if result.data else []
