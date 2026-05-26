import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, Header, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from supabase import Client

from app.config import settings
from app.constants import FORMATS, MAX_AUDIO_BYTES, STORAGE_BUCKET, USE_CASES
from app.models.session import RegenerateRequest
from app.models.waitlist import WaitlistResponse, WaitlistSignup
from app.pipeline.orchestrator import run_regenerate
from app.services.email import send_waitlist_emails
from app.services.insights import send_weekly_insights
from app.services.profiles import ensure_user_profile
from app.services.rate_limit import rate_limit_regenerate, rate_limit_voice_process
from app.services.redis_cache import cache_get, cache_set
from app.services.sessions import get_session_with_generation, serialize_session, serialize_session_list_item
from app.services.supabase import get_supabase_client
from app.services.tasks import submit_pipeline
from app.utils.audio import extension_for_mime, is_allowed_audio_mime, normalize_audio_mime
from app.utils.auth import get_current_user
from app.utils.errors import format_api_error

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1")


# ─── Waitlist ───

@router.get("/waitlist/count")
def waitlist_count(supabase: Client = Depends(get_supabase_client)):
    try:
        result = supabase.table("waitlist").select("*", count="exact").execute()
        return {"count": result.count or 0}
    except Exception as exc:
        logger.exception("Count error")
        raise HTTPException(status_code=500, detail="Could not fetch waitlist count") from exc


@router.post("/waitlist", response_model=WaitlistResponse, status_code=status.HTTP_201_CREATED)
def waitlist_signup(
    payload: WaitlistSignup,
    background_tasks: BackgroundTasks,
    supabase: Client = Depends(get_supabase_client),
):
    if payload.website:
        return WaitlistResponse(message="You're on the list — we'll be in touch soon")

    use_case = payload.use_case if payload.use_case in USE_CASES else None
    try:
        result = (
            supabase.table("waitlist")
            .insert({
                "email": payload.email,
                "use_case": use_case,
                "source": payload.source[:64],
                "referrer": payload.referrer[:512] if payload.referrer else None,
                "utm_source": payload.utm_source[:128] if payload.utm_source else None,
                "utm_medium": payload.utm_medium[:128] if payload.utm_medium else None,
                "utm_campaign": payload.utm_campaign[:128] if payload.utm_campaign else None,
            })
            .select("id, email, created_at")
            .execute()
        )
    except Exception as exc:
        message = str(exc)
        if "23505" in message or "duplicate" in message.lower():
            raise HTTPException(status_code=409, detail="You're already on the waitlist.") from exc
        logger.exception("Signup error")
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again.") from exc

    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again.")

    row = rows[0]
    created_at = row.get("created_at")
    if isinstance(created_at, str):
        created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    else:
        created_dt = datetime.now(timezone.utc)

    background_tasks.add_task(
        send_waitlist_emails,
        email=payload.email,
        use_case=use_case,
        source=payload.source[:64],
        referrer=payload.referrer,
        utm_source=payload.utm_source,
        utm_medium=payload.utm_medium,
        utm_campaign=payload.utm_campaign,
        created_at=created_dt,
    )
    return WaitlistResponse(message="You're on the list — we'll be in touch soon", id=row.get("id"))


# ─── Profile ───

@router.get("/me")
def get_profile(user=Depends(get_current_user), supabase: Client = Depends(get_supabase_client)):
    try:
        cache_key = f"profile:{user.id}"
        cached = cache_get(cache_key)
        if cached:
            return cached

        result = supabase.table("profiles").select("id, email, voice_profile, created_at, updated_at").eq("id", user.id).maybe_single().execute()
        profile = result.data or {}
        payload = {
            "id": user.id,
            "email": user.email,
            "voice_profile": profile.get("voice_profile") or {},
            "created_at": profile.get("created_at"),
        }
        cache_set(cache_key, payload, ttl_seconds=60)
        return payload
    except Exception as exc:
        logger.exception("Profile error")
        raise HTTPException(status_code=500, detail="Could not fetch profile") from exc


# ─── Voice pipeline ───

async def _create_session_from_audio(
    *,
    supabase: Client,
    user_id: str,
    audio_bytes: bytes,
    content_type: str,
    output_format: str,
    duration_ms: int | None,
    background_tasks: BackgroundTasks,
) -> dict:
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="AI processing is not configured yet.")

    recording_id = str(uuid.uuid4())
    ext = extension_for_mime(content_type)
    storage_path = f"{user_id}/{recording_id}.{ext}"

    insert_payload = {
        "id": recording_id,
        "user_id": user_id,
        "storage_path": storage_path,
        "mime_type": content_type,
        "duration_ms": duration_ms if duration_ms and duration_ms > 0 else None,
        "format": output_format,
        "status": "pending",
        "pipeline_step": "queued",
    }

    try:
        supabase.storage.from_(STORAGE_BUCKET).upload(
            storage_path,
            audio_bytes,
            file_options={"content-type": content_type},
        )
    except Exception as exc:
        logger.exception("Storage upload error")
        raise HTTPException(status_code=500, detail=f"Could not store audio file: {format_api_error(exc)}") from exc

    try:
        result = (
            supabase.table("recordings")
            .insert(insert_payload)
            .select("id, format, status, pipeline_step, created_at")
            .execute()
        )
    except Exception as exc:
        supabase.storage.from_(STORAGE_BUCKET).remove([storage_path])
        logger.exception("Insert recording error")
        message = format_api_error(exc)
        if "pipeline_step" in message.lower() or "column" in message.lower():
            message += " — run migration 003_pipeline_fields.sql in Supabase."
        elif "foreign key" in message.lower() or "profiles" in message.lower():
            message += " — profile missing for this user."
        raise HTTPException(status_code=500, detail=f"Could not create session: {message}") from exc

    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=500, detail="Could not create session")

    session = rows[0]
    submit_pipeline(supabase, recording_id)
    return session


@router.post("/voice/process", status_code=status.HTTP_202_ACCEPTED)
async def process_voice(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    format: str = Form(default="email"),
    duration_ms: int | None = Form(default=None),
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
    _rate=Depends(rate_limit_voice_process),
):
    if not is_allowed_audio_mime(audio.content_type):
        raise HTTPException(status_code=400, detail=f"Unsupported audio type: {audio.content_type}")

    normalized_format = format.lower()
    if normalized_format not in FORMATS:
        raise HTTPException(status_code=400, detail="Invalid format. Use: email, slack, report, linkedin, journal.")

    audio_bytes = await audio.read()
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file is too large (max 10MB).")
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    mime_type = normalize_audio_mime(audio.content_type) or "audio/webm"

    ensure_user_profile(supabase, user.id, user.email)

    session = await _create_session_from_audio(
        supabase=supabase,
        user_id=user.id,
        audio_bytes=audio_bytes,
        content_type=mime_type,
        output_format=normalized_format,
        duration_ms=duration_ms,
        background_tasks=background_tasks,
    )

    return {
        "session_id": session["id"],
        "format": session["format"],
        "status": session["status"],
        "pipeline_step": session.get("pipeline_step"),
        "created_at": session.get("created_at"),
        "message": "Processing started. Poll GET /api/v1/sessions/{id} or subscribe to /events.",
    }


# ─── Sessions ───

@router.get("/sessions")
def list_sessions(
    limit: int = 20,
    status: str | None = None,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    try:
        capped = min(max(limit, 1), 50)
        query = (
            supabase.table("recordings")
            .select(
                "id, format, status, pipeline_step, duration_ms, clarity_score, error_message, created_at, updated_at, "
                "generations(format, output_text, output_meta, created_at)"
            )
            .eq("user_id", user.id)
            .order("created_at", desc=True)
            .limit(capped)
        )
        if status:
            query = query.eq("status", status)
        result = query.execute()
        sessions = [serialize_session_list_item(row) for row in (result.data or [])]
        return {"sessions": sessions}
    except Exception as exc:
        logger.exception("List sessions error")
        raise HTTPException(status_code=500, detail="Could not fetch sessions") from exc


@router.get("/sessions/{session_id}")
def get_session(
    session_id: str,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    try:
        record = get_session_with_generation(supabase, session_id, user.id)
        if not record:
            raise HTTPException(status_code=404, detail="Session not found")
        return serialize_session(record)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Get session error")
        raise HTTPException(status_code=500, detail="Could not fetch session") from exc


@router.get("/sessions/{session_id}/events")
async def session_events(
    session_id: str,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    """Server-Sent Events stream — polls session state until complete or failed."""

    async def event_generator():
        last_step = None
        for _ in range(120):
            record = get_session_with_generation(supabase, session_id, user.id)
            if not record:
                yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
                break

            payload = serialize_session(record)
            step = payload.get("pipeline_step")
            if step != last_step or payload["status"] in ("complete", "failed"):
                yield f"data: {json.dumps(payload)}\n\n"
                last_step = step

            if payload["status"] in ("complete", "failed"):
                break

            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/sessions/{session_id}/regenerate", status_code=status.HTTP_201_CREATED)
def regenerate_session(
    session_id: str,
    payload: RegenerateRequest,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
    _rate=Depends(rate_limit_regenerate),
):
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="AI processing is not configured yet.")

    normalized = payload.format.lower()
    if normalized not in FORMATS:
        raise HTTPException(status_code=400, detail="Invalid format. Use: email, slack, report, linkedin, journal.")

    try:
        recording, generation = run_regenerate(
            supabase,
            recording_id=session_id,
            user_id=user.id,
            format=normalized,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Regenerate error")
        raise HTTPException(status_code=500, detail=str(exc) or "Could not regenerate output") from exc

    return {
        "session_id": recording["id"],
        "generation": {
            "id": generation["id"],
            "format": generation["format"],
            "output_text": generation["output_text"],
            "output_meta": generation.get("output_meta") or {},
            "explanations": generation.get("explanations") or [],
            "model_version": generation.get("model_version"),
            "created_at": generation.get("created_at"),
        },
    }


# ─── Cron (weekly insights) ───

@router.post("/cron/weekly-insights")
def cron_weekly_insights(
    x_cron_secret: str | None = Header(default=None),
    supabase: Client = Depends(get_supabase_client),
):
    if not settings.cron_secret or x_cron_secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        return send_weekly_insights(supabase)
    except Exception as exc:
        logger.exception("Weekly insights cron error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
