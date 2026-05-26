import logging
from datetime import datetime, timezone

from supabase import Client

from app.constants import STORAGE_BUCKET
from app.pipeline import steps
from app.services.deepgram import transcribe
from app.services.pinecone_memory import query_similar_sessions, upsert_session_memory
from app.services.redis_cache import cache_delete
from app.services.voice_profile import load_voice_profile, update_voice_profile

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _update_recording(supabase: Client, recording_id: str, **fields) -> None:
    payload = {**fields, "updated_at": _now_iso()}
    supabase.table("recordings").update(payload).eq("id", recording_id).execute()
    cache_delete(f"session:{recording_id}")


def _set_step(supabase: Client, recording_id: str, pipeline_step: str) -> None:
    _update_recording(
        supabase,
        recording_id,
        status="processing",
        pipeline_step=pipeline_step,
    )


def _delete_audio(supabase: Client, storage_path: str) -> None:
    try:
        supabase.storage.from_(STORAGE_BUCKET).remove([storage_path])
        logger.info("Deleted audio: %s", storage_path)
    except Exception as exc:
        logger.warning("Could not delete audio %s: %s", storage_path, exc)


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
    storage_path = recording["storage_path"]

    try:
        _set_step(supabase, recording_id, "transcribing")
        file_response = supabase.storage.from_(STORAGE_BUCKET).download(storage_path)
        audio_bytes = file_response if isinstance(file_response, bytes) else bytes(file_response)
        filename = storage_path.split("/")[-1]

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
        numerical_facts = steps.extract_numerical_facts(transcript=clean)
        intent["numerical_facts"] = numerical_facts
        _update_recording(supabase, recording_id, intent=intent)

        voice_profile = load_voice_profile(supabase, user_id)
        memory_context = query_similar_sessions(user_id=user_id, text=clean, top_k=3)

        _set_step(supabase, recording_id, "generating")
        draft_result = steps.generate_draft(
            clean_transcript=clean,
            intent=intent,
            voice_profile=voice_profile,
            output_format=output_format,
            memory_context=memory_context,
            numerical_facts=numerical_facts,
        )

        _set_step(supabase, recording_id, "critiquing")
        revised = steps.critique_draft(
            draft=draft_result["output_text"],
            draft_meta=draft_result.get("output_meta"),
            voice_profile=voice_profile,
            output_format=output_format,
        )

        _set_step(supabase, recording_id, "explaining")
        explanation = steps.explain_changes(
            raw_transcript=raw_transcript,
            final_output=revised["output_text"],
            output_format=output_format,
        )

        clarity_score = explanation.get("clarity_score")

        from app.config import settings

        from app.services.output_blocks import ensure_output_blocks

        output_meta = ensure_output_blocks(
            revised["output_text"],
            revised.get("output_meta") or draft_result.get("output_meta") or {},
            output_format,
            source_transcript=clean,
            numerical_facts=numerical_facts,
        )

        save_generation(
            supabase,
            recording_id=recording_id,
            user_id=user_id,
            format=output_format,
            output_text=revised["output_text"],
            output_meta=output_meta,
            explanations=explanation.get("explanations") or [],
            model_version=f"{settings.openai_generation_model}+{stt_provider}",
        )

        update_voice_profile(
            supabase,
            user_id,
            explanation=explanation,
            output_format=output_format,
            clarity_score=clarity_score,
        )

        upsert_session_memory(
            user_id=user_id,
            recording_id=recording_id,
            text=clean,
            output_format=output_format,
            clarity_score=clarity_score,
        )

        _update_recording(
            supabase,
            recording_id,
            status="complete",
            pipeline_step="complete",
            clarity_score=clarity_score,
        )

        _delete_audio(supabase, storage_path)
        cache_delete(f"profile:{user_id}")

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
    numerical_facts = (intent.get("numerical_facts") if isinstance(intent, dict) else None) or steps.extract_numerical_facts(transcript=clean)
    if isinstance(intent, dict):
        intent["numerical_facts"] = numerical_facts
    voice_profile = load_voice_profile(supabase, user_id)
    memory_context = query_similar_sessions(user_id=user_id, text=clean, top_k=3)

    draft = steps.generate_draft(
        clean_transcript=clean,
        intent=intent,
        voice_profile=voice_profile,
        output_format=format,
        memory_context=memory_context,
        numerical_facts=numerical_facts,
    )
    revised = steps.critique_draft(
        draft=draft["output_text"],
        draft_meta=draft.get("output_meta"),
        voice_profile=voice_profile,
        output_format=format,
    )
    explanation = steps.explain_changes(
        raw_transcript=recording.get("raw_transcript") or clean,
        final_output=revised["output_text"],
        output_format=format,
    )

    from app.config import settings

    from app.services.output_blocks import ensure_output_blocks

    output_meta = ensure_output_blocks(
        revised["output_text"],
        revised.get("output_meta") or draft.get("output_meta") or {},
        format,
        source_transcript=clean,
        numerical_facts=numerical_facts,
    )

    generation = save_generation(
        supabase,
        recording_id=recording_id,
        user_id=user_id,
        format=format,
        output_text=revised["output_text"],
        output_meta=output_meta,
        explanations=explanation.get("explanations") or [],
        model_version=f"{settings.openai_generation_model}+regenerate",
    )
    update_voice_profile(
        supabase,
        user_id,
        explanation=explanation,
        output_format=format,
        clarity_score=explanation.get("clarity_score"),
    )
    cache_delete(f"session:{recording_id}")
    cache_delete(f"profile:{user_id}")
    return recording, generation
