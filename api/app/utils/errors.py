def format_api_error(exc: Exception) -> str:
    for attr in ("message", "details", "detail"):
        if hasattr(exc, attr):
            value = getattr(exc, attr)
            if value:
                return str(value)
    text = str(exc).strip()
    return text or "Unknown error"
