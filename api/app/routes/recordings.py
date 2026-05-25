import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from supabase import Client

from app.config import settings
from app.constants import ALLOWED_AUDIO_TYPES, FORMATS, MAX_AUDIO_BYTES, STORAGE_BUCKET
from app.deps import get_current_user, get_supabase
from app.schemas.recordings import RegenerateRequest
from app.services.processor import (
    get_recording_with_latest_generation,
    process_recording,
    regenerate_format,
    serialize_recording,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/recordings", tags=["recordings"])


@router.get("")
def list_recordings(
    limit: int = 20,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    try:
        capped = min(max(limit, 1), 50)
        result = (
            supabase.table("recordings")
            .select("id, format, status, duration_ms, error_message, created_at, updated_at")
            .eq("user_id", user.id)
            .order("created_at", desc=True)
            .limit(capped)
            .execute()
        )
        return {"recordings": result.data or []}
    except Exception as exc:
        logger.exception("List recordings error")
        raise HTTPException(status_code=500, detail="Could not fetch recordings") from exc


@router.get("/{recording_id}")
def get_recording(
    recording_id: str,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    try:
        record = get_recording_with_latest_generation(supabase, recording_id, user.id)
        if not record:
            raise HTTPException(status_code=404, detail="Recording not found")
        return serialize_recording(record)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Get recording error")
        raise HTTPException(status_code=500, detail="Could not fetch recording") from exc


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def create_recording(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    format: str = Form(default="email"),
    duration_ms: int | None = Form(default=None),
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="AI processing is not configured yet.")

    if not audio.content_type or audio.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported audio type: {audio.content_type}")

    normalized_format = format.lower()
    if normalized_format not in FORMATS:
        raise HTTPException(
            status_code=400,
            detail="Invalid format. Use: email, slack, report, linkedin, journal.",
        )

    audio_bytes = await audio.read()
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file is too large (max 10MB).")
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    recording_id = str(uuid.uuid4())
    storage_path = f"{user.id}/{recording_id}.webm"

    try:
        supabase.storage.from_(STORAGE_BUCKET).upload(
            storage_path,
            audio_bytes,
            file_options={"content-type": audio.content_type},
        )
    except Exception as exc:
        logger.exception("Storage upload error")
        raise HTTPException(status_code=500, detail="Could not store audio file") from exc

    try:
        result = (
            supabase.table("recordings")
            .insert({
                "id": recording_id,
                "user_id": user.id,
                "storage_path": storage_path,
                "mime_type": audio.content_type,
                "duration_ms": duration_ms if duration_ms and duration_ms > 0 else None,
                "format": normalized_format,
                "status": "pending",
            })
            .select("id, format, status, created_at")
            .execute()
        )
    except Exception as exc:
        supabase.storage.from_(STORAGE_BUCKET).remove([storage_path])
        logger.exception("Insert recording error")
        raise HTTPException(status_code=500, detail="Could not create recording") from exc

    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=500, detail="Could not create recording")

    recording = rows[0]
    background_tasks.add_task(process_recording, supabase, recording_id)

    return {
        "id": recording["id"],
        "format": recording["format"],
        "status": recording["status"],
        "created_at": recording.get("created_at"),
        "message": "Recording received. Poll GET /api/recordings/:id for results.",
    }


@router.post("/{recording_id}/regenerate", status_code=status.HTTP_201_CREATED)
def regenerate_recording(
    recording_id: str,
    payload: RegenerateRequest,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
):
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="AI processing is not configured yet.")

    try:
        normalized_format = payload.validated_format()
        recording, generation = regenerate_format(
            supabase,
            recording_id=recording_id,
            user_id=user.id,
            format=normalized_format,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Regenerate error")
        raise HTTPException(status_code=500, detail="Could not regenerate output") from exc

    return {
        "recording_id": recording["id"],
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
