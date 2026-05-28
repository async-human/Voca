"""OAuth helpers for platform connections."""

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

from app.config import settings
from app.services.delivery.credentials import encrypt_credentials

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

NOTION_AUTH_URL = "https://api.notion.com/v1/oauth/authorize"
NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token"

# compose: create drafts; send: send messages (both required for draft + send-now flows)
GMAIL_SCOPES = (
    "https://www.googleapis.com/auth/gmail.compose "
    "https://www.googleapis.com/auth/gmail.send "
    "email profile"
)
NOTION_SCOPES = ""  # Notion uses integration capabilities at authorize time

GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"
GMAIL_COMPOSE_SCOPE = "https://www.googleapis.com/auth/gmail.compose"
GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"
FULL_MAIL_SCOPE = "https://mail.google.com/"


def gmail_has_draft_permission(scope: str | None) -> bool:
    """True when the granted token can call users.drafts.create."""
    if not scope:
        return False
    return (
        GMAIL_COMPOSE_SCOPE in scope
        or FULL_MAIL_SCOPE in scope
        or "gmail.compose" in scope
    )


def revoke_google_token(credentials: dict[str, Any]) -> None:
    """Invalidate refresh/access token so the next Connect gets fresh scopes."""
    token = credentials.get("refresh_token") or credentials.get("access_token")
    if not token:
        return
    try:
        with httpx.Client(timeout=10.0) as client:
            client.post(GOOGLE_REVOKE_URL, params={"token": token})
    except Exception:
        logger.warning("Google token revoke failed (continuing disconnect)", exc_info=True)


def _state_secret() -> bytes:
    secret = settings.jwt_secret or settings.google_client_secret or settings.notion_client_secret or "vokal-dev"
    return secret.encode()


def _oauth_state(user_id: str) -> str:
    payload = json.dumps(
        {"user_id": user_id, "n": secrets.token_urlsafe(16)},
        separators=(",", ":"),
    )
    sig = hmac.new(_state_secret(), payload.encode(), hashlib.sha256).hexdigest()
    raw = f"{payload}|{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def parse_oauth_state(state: str) -> str:
    try:
        padded = state + "=" * (-len(state) % 4)
        raw = base64.urlsafe_b64decode(padded.encode()).decode()
        payload, sig = raw.rsplit("|", 1)
        expected = hmac.new(_state_secret(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            raise ValueError("Invalid OAuth state signature")
        data = json.loads(payload)
        user_id = data.get("user_id")
        if not user_id:
            raise ValueError("Invalid OAuth state payload")
        return str(user_id)
    except Exception as exc:
        raise ValueError("Invalid OAuth state") from exc


def gmail_authorize_url(user_id: str) -> str:
    if not settings.google_client_id or not settings.google_redirect_uri:
        raise ValueError("Gmail OAuth is not configured")
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": GMAIL_SCOPES,
        "access_type": "offline",
        "prompt": "consent",
        "state": _oauth_state(user_id),
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def notion_authorize_url(user_id: str) -> str:
    if not settings.notion_client_id or not settings.notion_redirect_uri:
        raise ValueError("Notion OAuth is not configured")
    params = {
        "client_id": settings.notion_client_id,
        "redirect_uri": settings.notion_redirect_uri,
        "response_type": "code",
        "owner": "user",
        "state": _oauth_state(user_id),
    }
    return f"{NOTION_AUTH_URL}?{urlencode(params)}"


def exchange_gmail_code(code: str) -> tuple[dict[str, Any], dict[str, Any]]:
    with httpx.Client(timeout=20.0) as client:
        token_resp = client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
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

    granted_scope = tokens.get("scope") or ""
    credentials = {
        "access_token": tokens["access_token"],
        "refresh_token": tokens.get("refresh_token"),
        "expires_in": tokens.get("expires_in"),
        "email": profile.get("email"),
        "scope": granted_scope,
    }
    metadata = {
        "email": profile.get("email"),
        "name": profile.get("name"),
        "granted_scopes": granted_scope,
        "has_draft_permission": gmail_has_draft_permission(granted_scope),
        "has_send_permission": GMAIL_SEND_SCOPE in granted_scope or FULL_MAIL_SCOPE in granted_scope,
    }
    return credentials, metadata


def exchange_notion_code(code: str) -> tuple[dict[str, Any], dict[str, Any]]:
    auth = (settings.notion_client_id, settings.notion_client_secret)
    with httpx.Client(timeout=20.0) as client:
        resp = client.post(
            NOTION_TOKEN_URL,
            auth=auth,
            json={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.notion_redirect_uri,
            },
            headers={"Notion-Version": settings.notion_api_version},
        )
        resp.raise_for_status()
        data = resp.json()

    credentials = {
        "access_token": data["access_token"],
        "workspace_id": data.get("workspace_id"),
        "bot_id": data.get("bot_id"),
    }
    metadata = {
        "workspace_name": data.get("workspace_name"),
        "workspace_id": data.get("workspace_id"),
    }
    return credentials, metadata


def upsert_connection(
    supabase,
    *,
    user_id: str,
    platform: str,
    credentials: dict[str, Any],
    metadata: dict[str, Any],
    label: str | None = None,
) -> dict:
    encrypted = encrypt_credentials(credentials)
    default_label = label or metadata.get("email") or metadata.get("workspace_name") or platform

    existing = (
        supabase.table("platform_connections")
        .select("id")
        .eq("user_id", user_id)
        .eq("platform", platform)
        .limit(1)
        .execute()
    )
    rows = existing.data or []

    payload = {
        "label": default_label,
        "credentials_encrypted": encrypted,
        "metadata": metadata,
    }

    if rows:
        result = (
            supabase.table("platform_connections")
            .update(payload)
            .eq("id", rows[0]["id"])
            .select("id, platform, label, metadata, connected_at, updated_at")
            .execute()
        )
    else:
        payload.update({"user_id": user_id, "platform": platform})
        result = (
            supabase.table("platform_connections")
            .insert(payload)
            .select("id, platform, label, metadata, connected_at, updated_at")
            .execute()
        )

    out = result.data or []
    return out[0] if out else payload
