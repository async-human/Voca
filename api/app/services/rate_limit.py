"""Rate limiting dependencies for FastAPI routes."""

from fastapi import Depends, HTTPException, Request, status

from app.services.redis_cache import rate_limit_check
from app.utils.auth import get_current_user


def rate_limit_voice_process(user=Depends(get_current_user)):
    key = f"voice:{user.id}"
    allowed, retry_after = rate_limit_check(key, limit=20, window_seconds=3600)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after}s.",
            headers={"Retry-After": str(retry_after)},
        )


def rate_limit_regenerate(user=Depends(get_current_user)):
    key = f"regen:{user.id}"
    allowed, retry_after = rate_limit_check(key, limit=30, window_seconds=3600)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after}s.",
            headers={"Retry-After": str(retry_after)},
        )
