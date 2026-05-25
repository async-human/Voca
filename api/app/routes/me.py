import logging

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.deps import get_current_user, get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/me", tags=["me"])


@router.get("")
def get_profile(user=Depends(get_current_user), supabase: Client = Depends(get_supabase)):
    try:
        result = supabase.table("profiles").select("id, email, voice_profile, created_at, updated_at").eq("id", user.id).maybe_single().execute()
        profile = result.data or {}
        return {
            "id": user.id,
            "email": user.email,
            "voice_profile": profile.get("voice_profile") or {},
            "created_at": profile.get("created_at"),
        }
    except Exception as exc:
        logger.exception("Profile error")
        raise HTTPException(status_code=500, detail="Could not fetch profile") from exc
