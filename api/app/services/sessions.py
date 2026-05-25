from supabase import Client


def get_session_with_generation(supabase: Client, session_id: str, user_id: str) -> dict | None:
    recording_result = (
        supabase.table("recordings")
        .select("*")
        .eq("id", session_id)
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
        .eq("recording_id", session_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    generations = generations_result.data or []
    recording["generation"] = generations[0] if generations else None
    return recording


def _latest_generation(generations: list[dict] | None) -> dict | None:
    if not generations:
        return None
    return max(generations, key=lambda g: g.get("created_at") or "")


def serialize_session_list_item(record: dict) -> dict:
    generation = _latest_generation(record.get("generations"))
    output_text = generation.get("output_text") if generation else None
    preview = output_text
    if preview and len(preview) > 180:
        preview = preview[:180].rstrip() + "…"

    return {
        "id": record["id"],
        "format": record["format"],
        "status": record["status"],
        "duration_ms": record.get("duration_ms"),
        "clarity_score": record.get("clarity_score"),
        "created_at": record.get("created_at"),
        "output_preview": preview,
        "generation_format": generation.get("format") if generation else None,
        "output_meta": (generation.get("output_meta") or {}) if generation else {},
    }


def serialize_session(record: dict) -> dict:
    generation = record.get("generation")
    return {
        "id": record["id"],
        "format": record["format"],
        "status": record["status"],
        "pipeline_step": record.get("pipeline_step"),
        "duration_ms": record.get("duration_ms"),
        "error_message": record.get("error_message"),
        "raw_transcript": record.get("raw_transcript"),
        "clean_transcript": record.get("clean_transcript"),
        "intent": record.get("intent"),
        "clarity_score": record.get("clarity_score"),
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
