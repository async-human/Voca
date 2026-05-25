import logging
from datetime import datetime, timezone

from supabase import Client

from app.constants import STORAGE_BUCKET
from app.services.ai import generate_from_transcript, transcribe_audio

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _set_recording_status(supabase: Client, recording_id: str, status: str, **extra) -> None:
    payload = {"status": status, "updated_at": _now_iso(), **extra}
    supabase.table("recordings").update(payload).eq("id", recording_id).execute()


def _get_voice_profile(supabase: Client, user_id: str) -> dict:
    result = supabase.table("profiles").select("voice_profile").eq("id", user_id).maybe_single().execute()
    data = result.data or {}
    return data.get("voice_profile") or {}


def _update_voice_profile(supabase: Client, user_id: str, voice_signals: str) -> None:
    if not voice_signals:
        return

    current = _get_voice_profile(supabase, user_id)
    sessions_count = int(current.get("sessions_count") or 0) + 1

    supabase.table("profiles").update({
        "voice_profile": {
            **current,
            "summary": voice_signals,
            "sessions_count": sessions_count,
            "updated_at": _now_iso(),
        },
        "updated_at": _now_iso(),
    }).eq("id", user_id).execute()


def _save_generation(
    supabase: Client,
    *,
    recording_id: str,
    user_id: str,
    format: str,
    result: dict,
) -> dict:
    response = supabase.table("generations").insert({
        "recording_id": recording_id,
        "user_id": user_id,
        "format": format,
        "output_text": result["output_text"],
        "output_meta": result["output_meta"],
        "explanations": result["explanations"],
        "model_version": result["model_version"],
    }).execute()

    rows = response.data or []
    if not rows:
        raise RuntimeError("Failed to save generation")
    return rows[0]


def process_recording(supabase: Client, recording_id: str) -> None:
    result = supabase.table("recordings").select("*").eq("id", recording_id).single().execute()
    recording = result.data
    if not recording:
        logger.error("Recording not found: %s", recording_id)
        return

    try:
        _set_recording_status(supabase, recording_id, "transcribing")

        file_response = supabase.storage.from_(STORAGE_BUCKET).download(recording["storage_path"])
        audio_bytes = file_response if isinstance(file_response, bytes) else bytes(file_response)

        transcript = transcribe_audio(
            audio_bytes=audio_bytes,
            mime_type=recording["mime_type"],
            filename=recording["storage_path"].split("/")[-1],
        )

        _set_recording_status(supabase, recording_id, "polishing", raw_transcript=transcript)

        voice_profile = _get_voice_profile(supabase, recording["user_id"])
        generation_result = generate_from_transcript(
            format=recording["format"],
            transcript=transcript,
            voice_profile=voice_profile,
        )

        _save_generation(
            supabase,
            recording_id=recording_id,
            user_id=recording["user_id"],
            format=recording["format"],
            result=generation_result,
        )

        _update_voice_profile(supabase, recording["user_id"], generation_result["voice_signals"])
        _set_recording_status(supabase, recording_id, "complete")
    except Exception as exc:
        logger.exception("Processing failed for %s", recording_id)
        _set_recording_status(
            supabase,
            recording_id,
            "failed",
            error_message=str(exc) or "Processing failed",
        )


def regenerate_format(
    supabase: Client,
    *,
    recording_id: str,
    user_id: str,
    format: str,
) -> tuple[dict, dict]:
    result = (
        supabase.table("recordings")
        .select("*")
        .eq("id", recording_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    recording = result.data
    if not recording:
        raise LookupError("Recording not found")
    if not recording.get("raw_transcript"):
        raise RuntimeError("Transcript not available yet")

    voice_profile = _get_voice_profile(supabase, user_id)
    generation_result = generate_from_transcript(
        format=format,
        transcript=recording["raw_transcript"],
        voice_profile=voice_profile,
    )

    generation = _save_generation(
        supabase,
        recording_id=recording_id,
        user_id=user_id,
        format=format,
        result=generation_result,
    )
    _update_voice_profile(supabase, user_id, generation_result["voice_signals"])
    return recording, generation


def get_recording_with_latest_generation(
    supabase: Client,
    recording_id: str,
    user_id: str,
) -> dict | None:
    recording_result = (
        supabase.table("recordings")
        .select("*")
        .eq("id", recording_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    recording = recording_result.data
    if not recording:
        return None

    generations_result = (
        supabase.table("generations")
        .select("*")
        .eq("recording_id", recording_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    generations = generations_result.data or []
    recording["generation"] = generations[0] if generations else None
    return recording


def serialize_recording(record: dict) -> dict:
    generation = record.get("generation")
    return {
        "id": record["id"],
        "format": record["format"],
        "status": record["status"],
        "duration_ms": record.get("duration_ms"),
        "error_message": record.get("error_message"),
        "raw_transcript": record.get("raw_transcript"),
        "created_at": record.get("created_at"),
        "updated_at": record.get("updated_at"),
        "generation": {
            "id": generation["id"],
            "format": generation["format"],
            "output_text": generation["output_text"],
            "output_meta": generation.get("output_meta") or {},
            "explanations": generation.get("explanations") or [],
            "model_version": generation.get("model_version"),
            "created_at": generation.get("created_at"),
        } if generation else None,
    }
