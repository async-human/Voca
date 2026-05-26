from app.config import settings
from app.prompts import (
    CLEAN_PROMPT,
    CRITIQUE_PROMPT,
    EXPLAIN_PROMPT,
    FORMAT_GUIDES,
    GENERATE_PROMPT,
    INTENT_PROMPT,
)
from app.prompts.structured_facts import STRUCTURED_FACTS_PROMPT
from app.services.openai_client import chat_json
from app.services.voice_profile import format_voice_profile_for_prompt


def _format_memory_context(memory_context: list[dict] | None) -> str:
    if not memory_context:
        return ""
    lines = []
    for item in memory_context:
        meta = item.get("metadata") or {}
        fmt = meta.get("format", "unknown")
        score = meta.get("clarity_score")
        suffix = f" (clarity {score})" if score else ""
        lines.append(f"- Past {fmt} session{suffix}, relevance {item.get('score', 0):.2f}")
    return "Similar past sessions:\n" + "\n".join(lines)


def clean_transcript(transcript: str) -> str:
    result = chat_json(
        system="Return only valid JSON.",
        user=CLEAN_PROMPT.format(transcript=transcript),
        model=settings.openai_fast_model,
        temperature=0.2,
    )
    clean = result.get("clean_transcript")
    if not clean or not isinstance(clean, str):
        raise RuntimeError("Cleaner missing clean_transcript")
    return clean.strip()


def extract_intent(*, transcript: str, output_format: str) -> dict:
    result = chat_json(
        system="Return only valid JSON.",
        user=INTENT_PROMPT.format(transcript=transcript, output_format=output_format),
        model=settings.openai_generation_model,
        temperature=0.3,
    )
    return result


def extract_numerical_facts(*, transcript: str) -> dict:
    result = chat_json(
        system="Return only valid JSON. Extract only numbers spoken in the transcript; never invent.",
        user=STRUCTURED_FACTS_PROMPT.format(transcript=transcript),
        model=settings.openai_fast_model,
        temperature=0.0,
    )
    if not isinstance(result, dict):
        return {"sections": [], "critical_non_numeric": []}
    if not result.get("sections") and result.get("facts"):
        return result
    return result


def generate_draft(
    *,
    clean_transcript: str,
    intent: dict,
    voice_profile: dict,
    output_format: str,
    memory_context: list[dict] | None = None,
    numerical_facts: dict | None = None,
) -> dict:
    import json

    profile_text = format_voice_profile_for_prompt(voice_profile)
    memory_text = _format_memory_context(memory_context)
    if memory_text:
        profile_text = profile_text + "\n\n" + memory_text

    format_guide = FORMAT_GUIDES.get(output_format, FORMAT_GUIDES["email"])
    must_include = intent.get("must_include_facts") or intent.get("key_points") or []

    result = chat_json(
        system="Return only valid JSON. Never invent facts. Include every extracted fact in blocks.",
        user=GENERATE_PROMPT.format(
            output_format=output_format,
            format_guide=format_guide,
            intent_json=json.dumps(intent, indent=2),
            voice_profile=profile_text,
            clean_transcript=clean_transcript,
            numerical_facts_json=json.dumps(numerical_facts or {}, indent=2),
            must_include_json=json.dumps(must_include, indent=2),
        ),
        model=settings.openai_generation_model,
        temperature=0.4,
    )
    if not result.get("output_text"):
        raise RuntimeError("Generator missing output_text")
    return result


def critique_draft(
    *,
    draft: str,
    voice_profile: dict,
    output_format: str,
    draft_meta: dict | None = None,
) -> dict:
    import json

    profile_text = format_voice_profile_for_prompt(voice_profile)
    result = chat_json(
        system="Return only valid JSON.",
        user=CRITIQUE_PROMPT.format(
            output_format=output_format,
            voice_profile=profile_text,
            draft_meta=json.dumps(draft_meta or {}, indent=2),
            draft=draft,
        ),
        model=settings.openai_fast_model,
        temperature=0.3,
    )
    if not result.get("output_text"):
        raise RuntimeError("Critic missing output_text")
    return result


def explain_changes(*, raw_transcript: str, final_output: str, output_format: str) -> dict:
    result = chat_json(
        system="Return only valid JSON.",
        user=EXPLAIN_PROMPT.format(
            output_format=output_format,
            raw_transcript=raw_transcript,
            final_output=final_output,
        ),
        model=settings.openai_generation_model,
        temperature=0.3,
    )
    return result
