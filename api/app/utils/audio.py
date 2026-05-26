from app.constants import ALLOWED_AUDIO_TYPES

MIME_TO_EXTENSION = {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/x-m4a": "m4a",
}


def normalize_audio_mime(mime: str | None) -> str | None:
    """Strip parameters like ;codecs=opus — browsers often send audio/webm;codecs=opus."""
    if not mime:
        return None
    return mime.split(";", 1)[0].strip().lower()


def is_allowed_audio_mime(mime: str | None) -> bool:
    normalized = normalize_audio_mime(mime)
    return normalized in ALLOWED_AUDIO_TYPES if normalized else False


def extension_for_mime(mime: str | None) -> str:
    normalized = normalize_audio_mime(mime) or "audio/webm"
    return MIME_TO_EXTENSION.get(normalized, "webm")


def filename_for_mime(mime: str | None, base: str = "recording") -> str:
    return f"{base}.{extension_for_mime(mime)}"
