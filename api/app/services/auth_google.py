"""Google OAuth login (redirect on vokal.work, not Supabase Auth)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import secrets
from types import SimpleNamespace
from typing import Any
from urllib.parse import urlencode

import httpx
from supabase import Client

from app.config import settings
from app.services.auth_jwt import create_access_token
from app.services.profiles import ensure_user_profile

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

LOGIN_SCOPES = "openid email profile"


def google_login_redirect_uri() -> str:
    if settings.google_login_redirect_uri:
        return settings.google_login_redirect_uri.rstrip("/")
    return f"{settings.app_frontend_url.rstrip('/')}/auth/callback"


def _state_secret() -> bytes:
    secret = settings.jwt_secret or settings.google_client_secret or "vokal-dev"
    return secret.encode()


def make_oauth_state(next_path: str = "/app/") -> str:
    payload = json.dumps({"next": next_path, "n": secrets.token_urlsafe(8)}, separators=(",", ":"))
    sig = hmac.new(_state_secret(), payload.encode(), hashlib.sha256).hexdigest()
    raw = f"{payload}|{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def parse_oauth_state(state: str | None) -> str:
    if not state:
        return "/app/"
    try:
        padded = state + "=" * (-len(state) % 4)
        raw = base64.urlsafe_b64decode(padded.encode()).decode()
        payload, sig = raw.rsplit("|", 1)
        expected = hmac.new(_state_secret(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            return "/app/"
        data = json.loads(payload)
        nxt = data.get("next") or "/app/"
        return nxt if nxt.startswith("/") else "/app/"
    except Exception:
        logger.warning("Invalid OAuth state; using default next path")
        return "/app/"


def google_authorize_url(*, next_path: str = "/app/") -> str:
    if not settings.google_client_id:
        raise ValueError("Google OAuth is not configured (GOOGLE_CLIENT_ID)")
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": google_login_redirect_uri(),
        "response_type": "code",
        "scope": LOGIN_SCOPES,
        "access_type": "online",
        "prompt": "select_account",
        "state": make_oauth_state(next_path),
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_google_code(code: str) -> tuple[dict[str, Any], dict[str, Any]]:
    if not settings.google_client_id or not settings.google_client_secret:
        raise ValueError("Google OAuth is not configured")
    with httpx.Client(timeout=20.0) as client:
        token_resp = client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": google_login_redirect_uri(),
                "grant_type": "authorization_code",
            },
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()

        profile_resp = client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        profile_resp.raise_for_status()
        profile = profile_resp.json()
    return tokens, profile


def _normalize_auth_user(user: Any) -> SimpleNamespace:
    if isinstance(user, dict):
        return SimpleNamespace(id=user.get("id"), email=user.get("email"))
    return SimpleNamespace(id=getattr(user, "id", None), email=getattr(user, "email", None))


def _find_user_by_email(supabase: Client, email: str) -> SimpleNamespace | None:
    """Look up auth.users by email via Admin API (handles existing magic-link accounts)."""
    normalized = email.lower().strip()
    base = settings.supabase_url.rstrip("/")
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }

    # Prefer SDK list (fast path)
    try:
        page = 1
        while page <= 30:
            result = supabase.auth.admin.list_users(page=page, per_page=200)
            users = getattr(result, "users", None)
            if users is None and isinstance(result, dict):
                users = result.get("users", [])
            if users is None:
                users = []
            for user in users:
                u = _normalize_auth_user(user)
                if (u.email or "").lower() == normalized:
                    return u
            if len(users) < 200:
                break
            page += 1
    except Exception as exc:
        logger.warning("SDK list_users failed, falling back to HTTP: %s", exc)

    # HTTP fallback — same Admin API, explicit JSON parsing
    page = 1
    with httpx.Client(timeout=30.0) as client:
        while page <= 30:
            resp = client.get(
                f"{base}/auth/v1/admin/users",
                headers=headers,
                params={"page": page, "per_page": 200},
            )
            resp.raise_for_status()
            users = resp.json().get("users") or []
            for row in users:
                if (row.get("email") or "").lower() == normalized:
                    return SimpleNamespace(id=row.get("id"), email=row.get("email"))
            if len(users) < 200:
                break
            page += 1
    return None


def _is_duplicate_user_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(
        phrase in msg
        for phrase in (
            "already been registered",
            "already registered",
            "already exists",
            "duplicate",
            "user_already_exists",
        )
    )


def get_or_create_auth_user(supabase: Client, *, email: str, name: str | None, picture: str | None, google_sub: str | None):
    existing = _find_user_by_email(supabase, email)
    if existing and existing.id:
        logger.info("Google login: existing user %s for %s", existing.id, email)
        return existing

    metadata = {
        "full_name": name,
        "avatar_url": picture,
        "provider": "google",
        "google_sub": google_sub,
    }
    try:
        created = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": secrets.token_urlsafe(32),
                "email_confirm": True,
                "user_metadata": metadata,
            }
        )
        return _normalize_auth_user(created.user)
    except Exception as exc:
        if _is_duplicate_user_error(exc):
            existing = _find_user_by_email(supabase, email)
            if existing and existing.id:
                logger.info("Google login: linked existing user %s after duplicate", existing.id)
                return existing
        logger.exception("create_user failed for %s", email)
        raise


def complete_google_login(supabase: Client, code: str) -> tuple[str, dict[str, Any]]:
    _, profile = exchange_google_code(code)
    email = profile.get("email")
    if not email:
        raise ValueError("Google account has no email")

    user = get_or_create_auth_user(
        supabase,
        email=email,
        name=profile.get("name"),
        picture=profile.get("picture"),
        google_sub=profile.get("id"),
    )
    user_id = str(user.id)
    if not user_id or user_id == "None":
        raise ValueError("Could not resolve user account for this email")
    ensure_user_profile(supabase, user_id, email)

    access_token = create_access_token(user_id=user_id, email=email)
    return access_token, {
        "id": user_id,
        "email": email,
        "name": profile.get("name"),
        "picture": profile.get("picture"),
    }
