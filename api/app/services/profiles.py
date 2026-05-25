import logging

from supabase import Client

logger = logging.getLogger(__name__)


def ensure_user_profile(supabase: Client, user_id: str, email: str | None) -> None:
    """Create profiles row if missing (e.g. user signed up before trigger existed)."""
    result = supabase.table("profiles").select("id").eq("id", user_id).execute()
    if result.data:
        return

    logger.info("Creating missing profile for user %s", user_id)
    supabase.table("profiles").insert({
        "id": user_id,
        "email": email,
    }).execute()
