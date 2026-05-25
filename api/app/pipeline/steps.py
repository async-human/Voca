from app.config import settings
from app.prompts import (
    CLEAN_PROMPT,
    CRITIQUE_PROMPT,
    EXPLAIN_PROMPT,
    FORMAT_GUIDES,
    GENERATE_PROMPT,
    INTENT_PROMPT,
)
from app.services.openai_client import chat_json


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


def generate_draft(*, clean_transcript: str, intent: dict, voice_profile: dict, output_format: str) -> dict:
    import json

    profile_text = voice_profile.get("summary") or "No prior sessions — infer style from transcript."
    format_guide = FORMAT_GUIDES.get(output_format, FORMAT_GUIDES["email"])

    result = chat_json(
        system="Return only valid JSON. Never invent facts.",
        user=GENERATE_PROMPT.format(
            output_format=output_format,
            format_guide=format_guide,
            intent_json=json.dumps(intent, indent=2),
            voice_profile=profile_text,
            clean_transcript=clean_transcript,
        ),
        model=settings.openai_generation_model,
        temperature=0.4,
    )
    if not result.get("output_text"):
        raise RuntimeError("Generator missing output_text")
    return result


def critique_draft(*, draft: str, voice_profile: dict, output_format: str) -> dict:
    profile_text = voice_profile.get("summary") or "Match the speaker's natural tone."
    result = chat_json(
        system="Return only valid JSON.",
        user=CRITIQUE_PROMPT.format(
            output_format=output_format,
            voice_profile=profile_text,
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
