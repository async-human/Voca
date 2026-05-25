"""Optional Redis cache with in-memory fallback."""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

_redis = None
_memory: dict[str, tuple[float, str]] = {}


def _get_redis():
    global _redis
    if _redis is False:
        return None
    if _redis is not None:
        return _redis
    if not settings.redis_url:
        _redis = False
        return None
    try:
        import redis

        client = redis.from_url(settings.redis_url, decode_responses=True)
        client.ping()
        _redis = client
        logger.info("Redis cache connected")
        return _redis
    except Exception as exc:
        logger.warning("Redis unavailable, using in-memory cache: %s", exc)
        _redis = False
        return None


def cache_get(key: str) -> Any | None:
    client = _get_redis()
    if client:
        try:
            raw = client.get(key)
            return json.loads(raw) if raw else None
        except Exception:
            return None

    entry = _memory.get(key)
    if not entry:
        return None
    expires_at, raw = entry
    if expires_at < time.time():
        _memory.pop(key, None)
        return None
    return json.loads(raw)


def cache_set(key: str, value: Any, ttl_seconds: int = 60) -> None:
    raw = json.dumps(value)
    client = _get_redis()
    if client:
        try:
            client.setex(key, ttl_seconds, raw)
            return
        except Exception:
            pass
    _memory[key] = (time.time() + ttl_seconds, raw)


def cache_delete(key: str) -> None:
    client = _get_redis()
    if client:
        try:
            client.delete(key)
        except Exception:
            pass
    _memory.pop(key, None)


def rate_limit_check(key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    """Return (allowed, retry_after_seconds)."""
    client = _get_redis()
    if client:
        try:
            count = client.incr(key)
            if count == 1:
                client.expire(key, window_seconds)
            if count > limit:
                ttl = client.ttl(key)
                return False, max(int(ttl), 1)
            return True, 0
        except Exception:
            pass

    # In-memory fallback (single-process only)
    now = time.time()
    mem_key = f"rl:{key}"
    entry = _memory.get(mem_key)
    if not entry or entry[0] < now:
        _memory[mem_key] = (now + window_seconds, "1")
        return True, 0
    expires_at, count_raw = entry
    count = int(count_raw) + 1
    _memory[mem_key] = (expires_at, str(count))
    if count > limit:
        return False, max(int(expires_at - now), 1)
    return True, 0
