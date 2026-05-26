"""JWT access tokens for Vokal API sessions."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings

ALGORITHM = "HS256"
TOKEN_DAYS = 7


def create_access_token(*, user_id: str, email: str | None) -> str:
    if not settings.jwt_secret:
        raise ValueError("JWT_SECRET is not configured")
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(days=TOKEN_DAYS),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    if not settings.jwt_secret:
        raise ValueError("JWT_SECRET is not configured")
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
