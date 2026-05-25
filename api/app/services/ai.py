import io
import json
import re

from openai import OpenAI

from app.config import settings
from app.services.prompts import build_generation_prompt


def _get_openai() -> OpenAI:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    return OpenAI(api_key=settings.openai_api_key)


def transcribe_audio(*, audio_bytes: bytes, mime_type: str, filename: str = "recording.webm") -> str:
    client = _get_openai()
    file_obj = io.BytesIO(audio_bytes)
    file_obj.name = filename

    result = client.audio.transcriptions.create(
        file=(filename, file_obj, mime_type),
        model=settings.openai_transcribe_model,
        response_format="text",
    )

    text = str(result or "").strip()
    if not text:
        raise RuntimeError("Transcription returned empty text")
    return text


def _parse_json_response(raw: str) -> dict:
    trimmed = str(raw or "").strip()
    match = re.search(r"\{[\s\S]*\}", trimmed)
    if not match:
        raise RuntimeError("Model did not return valid JSON")
    return json.loads(match.group(0))


def generate_from_transcript(*, format: str, transcript: str, voice_profile: dict) -> dict:
    client = _get_openai()
    model = settings.openai_generation_model

    completion = client.chat.completions.create(
        model=model,
        temperature=0.4,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are Vokal. Return only valid JSON matching the requested schema. "
                    "Never invent facts not in the transcript."
                ),
            },
            {
                "role": "user",
                "content": build_generation_prompt(
                    format=format,
                    transcript=transcript,
                    voice_profile=voice_profile,
                ),
            },
        ],
    )

    raw = completion.choices[0].message.content or ""
    parsed = _parse_json_response(raw)

    output_text = parsed.get("output_text")
    if not output_text or not isinstance(output_text, str):
        raise RuntimeError("Generation missing output_text")

    output_meta = parsed.get("output_meta")
    explanations = parsed.get("explanations")
    voice_signals = parsed.get("voice_signals")

    return {
        "output_text": output_text.strip(),
        "output_meta": output_meta if isinstance(output_meta, dict) else {},
        "explanations": explanations if isinstance(explanations, list) else [],
        "voice_signals": voice_signals.strip() if isinstance(voice_signals, str) else "",
        "model_version": model,
    }
