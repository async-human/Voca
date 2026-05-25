import logging

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from supabase import Client

from app.api.v1.router import (
    get_session,
    get_profile,
    list_sessions,
    process_voice,
    regenerate_session,
    session_events,
    waitlist_count,
    waitlist_signup,
)
from app.models.waitlist import WaitlistResponse
from app.services.supabase import get_supabase_client
from app.utils.auth import get_current_user

legacy = APIRouter()

legacy.add_api_route("/api/waitlist/count", waitlist_count, methods=["GET"])
legacy.add_api_route("/api/waitlist", waitlist_signup, methods=["POST"], response_model=WaitlistResponse)
legacy.add_api_route("/api/me", get_profile, methods=["GET"])
legacy.add_api_route("/api/recordings", list_sessions, methods=["GET"])
legacy.add_api_route("/api/recordings/{session_id}", get_session, methods=["GET"])
legacy.add_api_route("/api/recordings/{session_id}/regenerate", regenerate_session, methods=["POST"])
legacy.add_api_route("/api/recordings/{session_id}/events", session_events, methods=["GET"])


@legacy.post("/api/recordings", status_code=status.HTTP_202_ACCEPTED)
async def legacy_create_recording(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    format: str = Form(default="email"),
    duration_ms: int | None = Form(default=None),
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    return await process_voice(background_tasks, audio, format, duration_ms, user, supabase)
