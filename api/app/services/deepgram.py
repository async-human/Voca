import io
import logging

import httpx

from app.config import settings
from app.services.openai_client import get_openai_client
from app.utils.audio import filename_for_mime, normalize_audio_mime

logger = logging.getLogger(__name__)


def transcribe_whisper(*, audio_bytes: bytes, mime_type: str, filename: str) -> str:
    client = get_openai_client()
    normalized_mime = normalize_audio_mime(mime_type) or "audio/webm"
    safe_name = filename if "." in filename else filename_for_mime(normalized_mime)

    file_obj = io.BytesIO(audio_bytes)
    file_obj.name = safe_name

    result = client.audio.transcriptions.create(
        file=(safe_name, file_obj, normalized_mime),
        model=settings.openai_transcribe_model,
        response_format="text",
    )
    text = str(result or "").strip()
    if not text:
        raise RuntimeError("Whisper returned empty transcript")
    return text


def transcribe_deepgram(*, audio_bytes: bytes, mime_type: str) -> str:
    if not settings.deepgram_api_key:
        raise RuntimeError("DEEPGRAM_API_KEY is not configured")

    normalized_mime = normalize_audio_mime(mime_type) or "audio/webm"
    url = (
        "https://api.deepgram.com/v1/listen"
        f"?model={settings.deepgram_model}&smart_format=true&punctuate=true"
    )
    response = httpx.post(
        url,
        headers={
            "Authorization": f"Token {settings.deepgram_api_key}",
            "Content-Type": normalized_mime,
        },
        content=audio_bytes,
        timeout=90.0,
    )
    response.raise_for_status()
    payload = response.json()
    transcript = (
        payload.get("results", {})
        .get("channels", [{}])[0]
        .get("alternatives", [{}])[0]
        .get("transcript", "")
    )
    text = str(transcript).strip()
    if not text:
        raise RuntimeError("Deepgram returned empty transcript")
    return text


def transcribe(*, audio_bytes: bytes, mime_type: str, filename: str) -> tuple[str, str]:
    """Returns (transcript, provider_name)."""
    if settings.deepgram_api_key:
        try:
            return transcribe_deepgram(audio_bytes=audio_bytes, mime_type=mime_type), "deepgram"
        except Exception as exc:
            logger.warning("Deepgram failed, falling back to Whisper: %s", exc)

    if not settings.openai_api_key:
        raise RuntimeError("No STT provider configured (set DEEPGRAM_API_KEY or OPENAI_API_KEY)")

    return transcribe_whisper(audio_bytes=audio_bytes, mime_type=mime_type, filename=filename), "whisper"
