from app.constants import ALLOWED_AUDIO_TYPES


def normalize_audio_mime(mime: str | None) -> str | None:
    """Strip parameters like ;codecs=opus — browsers often send audio/webm;codecs=opus."""
    if not mime:
        return None
    return mime.split(";", 1)[0].strip().lower()


def is_allowed_audio_mime(mime: str | None) -> bool:
    normalized = normalize_audio_mime(mime)
    return normalized in ALLOWED_AUDIO_TYPES if normalized else False
