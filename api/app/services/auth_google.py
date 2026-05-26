"""Google OAuth login (redirect on vokal.work, not Supabase Auth)."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import secrets
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


def _find_user_by_email(supabase: Client, email: str):
    page = 1
    while page <= 20:
        result = supabase.auth.admin.list_users(page=page, per_page=200)
        users = getattr(result, "users", None) or []
        for user in users:
            if (user.email or "").lower() == email.lower():
                return user
        if len(users) < 200:
            break
        page += 1
    return None


def get_or_create_auth_user(supabase: Client, *, email: str, name: str | None, picture: str | None, google_sub: str | None):
    existing = _find_user_by_email(supabase, email)
    if existing:
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
        return created.user
    except Exception as exc:
        logger.warning("create_user failed for %s: %s", email, exc)
        again = _find_user_by_email(supabase, email)
        if again:
            return again
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
    ensure_user_profile(supabase, user_id, email)

    access_token = create_access_token(user_id=user_id, email=email)
    return access_token, {
        "id": user_id,
        "email": email,
        "name": profile.get("name"),
        "picture": profile.get("picture"),
    }
