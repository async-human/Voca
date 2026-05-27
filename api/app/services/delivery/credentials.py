"""Encrypt/decrypt OAuth tokens stored in platform_connections."""

from __future__ import annotations

import base64
import json
import logging
from typing import Any

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings

logger = logging.getLogger(__name__)


def _fernet() -> Fernet | None:
    key = settings.credentials_encryption_key
    if not key:
        return None
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except Exception:
        logger.exception("Invalid CREDENTIALS_ENCRYPTION_KEY")
        return None


def encrypt_credentials(data: dict[str, Any]) -> str:
    raw = json.dumps(data).encode()
    f = _fernet()
    if f:
        return f.encrypt(raw).decode()
    if not settings.allow_unencrypted_credentials and settings.app_env.lower() not in {"local", "development", "dev", "test"}:
        raise RuntimeError("CREDENTIALS_ENCRYPTION_KEY is required outside local development")
    logger.warning("CREDENTIALS_ENCRYPTION_KEY not set — storing credentials base64-only (dev only)")
    return base64.urlsafe_b64encode(raw).decode()


def decrypt_credentials(payload: str) -> dict[str, Any]:
    if not payload:
        return {}
    f = _fernet()
    if f:
        try:
            raw = f.decrypt(payload.encode())
            return json.loads(raw.decode())
        except InvalidToken:
            pass
    try:
        raw = base64.urlsafe_b64decode(payload.encode())
        return json.loads(raw.decode())
    except Exception as exc:
        logger.exception("Could not decrypt credentials")
        raise ValueError("Invalid stored credentials") from exc
