FORMATS = frozenset({"email", "slack", "report", "linkedin", "journal"})

RECORDING_STATUSES = frozenset({"pending", "transcribing", "polishing", "complete", "failed"})

ALLOWED_AUDIO_TYPES = frozenset({
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/x-m4a",
})

MAX_AUDIO_BYTES = 10 * 1024 * 1024
STORAGE_BUCKET = "recordings"

USE_CASES = frozenset({"email", "reports", "linkedin", "slack", "journal", "other"})
