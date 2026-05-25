import logging
from datetime import datetime, timezone

from supabase import Client

from app.constants import STORAGE_BUCKET
from app.pipeline import steps
from app.services.deepgram import transcribe

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _update_recording(supabase: Client, recording_id: str, **fields) -> None:
    payload = {**fields, "updated_at": _now_iso()}
    supabase.table("recordings").update(payload).eq("id", recording_id).execute()


def _set_step(supabase: Client, recording_id: str, pipeline_step: str) -> None:
    _update_recording(
        supabase,
        recording_id,
        status="processing",
        pipeline_step=pipeline_step,
    )


def load_voice_profile(supabase: Client, user_id: str) -> dict:
    result = supabase.table("profiles").select("voice_profile").eq("id", user_id).maybe_single().execute()
    data = result.data or {}
    return data.get("voice_profile") or {}


def update_voice_profile(supabase: Client, user_id: str, explanation: dict) -> None:
    voice_signals = explanation.get("voice_signals") or ""
    if not voice_signals:
        return

    current = load_voice_profile(supabase, user_id)
    sessions_count = int(current.get("sessions_count") or 0) + 1
    patterns = explanation.get("patterns_flagged") or []
    weak_patterns = list(set((current.get("weak_patterns") or []) + patterns))[:20]

    supabase.table("profiles").update({
        "voice_profile": {
            **current,
            "summary": voice_signals,
            "sessions_count": sessions_count,
            "weak_patterns": weak_patterns,
            "updated_at": _now_iso(),
        },
        "updated_at": _now_iso(),
    }).eq("id", user_id).execute()


def save_generation(
    supabase: Client,
    *,
    recording_id: str,
    user_id: str,
    format: str,
    output_text: str,
    output_meta: dict,
    explanations: list,
    model_version: str,
) -> dict:
    response = (
        supabase.table("generations")
        .insert({
            "recording_id": recording_id,
            "user_id": user_id,
            "format": format,
            "output_text": output_text,
            "output_meta": output_meta,
            "explanations": explanations,
            "model_version": model_version,
        })
        .select("*")
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise RuntimeError("Failed to save generation")
    return rows[0]


def run_pipeline(supabase: Client, recording_id: str) -> None:
    result = supabase.table("recordings").select("*").eq("id", recording_id).single().execute()
    recording = result.data
    if not recording:
        logger.error("Recording not found: %s", recording_id)
        return

    output_format = recording["format"]
    user_id = recording["user_id"]

    try:
        _set_step(supabase, recording_id, "transcribing")
        file_response = supabase.storage.from_(STORAGE_BUCKET).download(recording["storage_path"])
        audio_bytes = file_response if isinstance(file_response, bytes) else bytes(file_response)
        filename = recording["storage_path"].split("/")[-1]

        raw_transcript, stt_provider = transcribe(
            audio_bytes=audio_bytes,
            mime_type=recording["mime_type"],
            filename=filename,
        )
        _update_recording(supabase, recording_id, raw_transcript=raw_transcript)

        _set_step(supabase, recording_id, "cleaning")
        clean = steps.clean_transcript(raw_transcript)
        _update_recording(supabase, recording_id, clean_transcript=clean)

        _set_step(supabase, recording_id, "understanding")
        intent = steps.extract_intent(transcript=clean, output_format=output_format)
        _update_recording(supabase, recording_id, intent=intent)

        voice_profile = load_voice_profile(supabase, user_id)

        _set_step(supabase, recording_id, "generating")
        draft_result = steps.generate_draft(
            clean_transcript=clean,
            intent=intent,
            voice_profile=voice_profile,
            output_format=output_format,
        )

        _set_step(supabase, recording_id, "critiquing")
        revised = steps.critique_draft(
            draft=draft_result["output_text"],
            voice_profile=voice_profile,
            output_format=output_format,
        )

        _set_step(supabase, recording_id, "explaining")
        explanation = steps.explain_changes(
            raw_transcript=raw_transcript,
            final_output=revised["output_text"],
            output_format=output_format,
        )

        from app.config import settings

        save_generation(
            supabase,
            recording_id=recording_id,
            user_id=user_id,
            format=output_format,
            output_text=revised["output_text"],
            output_meta=revised.get("output_meta") or draft_result.get("output_meta") or {},
            explanations=explanation.get("explanations") or [],
            model_version=f"{settings.openai_generation_model}+{stt_provider}",
        )

        update_voice_profile(supabase, user_id, explanation)

        _update_recording(
            supabase,
            recording_id,
            status="complete",
            pipeline_step="complete",
            clarity_score=explanation.get("clarity_score"),
        )
    except Exception as exc:
        logger.exception("Pipeline failed for %s", recording_id)
        _update_recording(
            supabase,
            recording_id,
            status="failed",
            pipeline_step="failed",
            error_message=str(exc) or "Pipeline failed",
        )


def run_regenerate(
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

    clean = recording.get("clean_transcript") or recording.get("raw_transcript")
    if not clean:
        raise RuntimeError("Transcript not available yet")

    intent = recording.get("intent") or steps.extract_intent(transcript=clean, output_format=format)
    voice_profile = load_voice_profile(supabase, user_id)

    draft = steps.generate_draft(
        clean_transcript=clean,
        intent=intent,
        voice_profile=voice_profile,
        output_format=format,
    )
    revised = steps.critique_draft(
        draft=draft["output_text"],
        voice_profile=voice_profile,
        output_format=format,
    )
    explanation = steps.explain_changes(
        raw_transcript=recording.get("raw_transcript") or clean,
        final_output=revised["output_text"],
        output_format=format,
    )

    from app.config import settings

    generation = save_generation(
        supabase,
        recording_id=recording_id,
        user_id=user_id,
        format=format,
        output_text=revised["output_text"],
        output_meta=revised.get("output_meta") or draft.get("output_meta") or {},
        explanations=explanation.get("explanations") or [],
        model_version=f"{settings.openai_generation_model}+regenerate",
    )
    update_voice_profile(supabase, user_id, explanation)
    return recording, generation
