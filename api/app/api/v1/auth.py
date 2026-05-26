"""Google sign-in for Studio (OAuth callback on vokal.work)."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.config import settings
from app.models.auth import (
    AuthUserResponse,
    GoogleCompleteRequest,
    GoogleCompleteResponse,
    GoogleStartResponse,
)
from app.services.auth_google import (
    complete_google_login,
    google_authorize_url,
    google_login_redirect_uri,
    parse_oauth_state,
)
from app.services.supabase import get_supabase_client
from app.utils.auth import AuthUser, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _ensure_auth_configured():
    if not settings.jwt_secret:
        raise HTTPException(status_code=503, detail="JWT_SECRET is not configured on the API.")
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured on the API.")


@router.get("/google/start", response_model=GoogleStartResponse)
def google_auth_start(next: str = Query("/app/")):
    _ensure_auth_configured()
    try:
        safe_next = next if next.startswith("/") else "/app/"
        url = google_authorize_url(next_path=safe_next)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return GoogleStartResponse(url=url)


@router.post("/google/complete", response_model=GoogleCompleteResponse)
def google_auth_complete(
    payload: GoogleCompleteRequest,
    supabase: Client = Depends(get_supabase_client),
):
    _ensure_auth_configured()
    try:
        access_token, user = complete_google_login(supabase, payload.code.strip())
    except Exception as exc:
        logger.exception("Google login failed")
        raise HTTPException(status_code=400, detail=f"Google sign-in failed: {exc}") from exc

    return GoogleCompleteResponse(
        access_token=access_token,
        user=AuthUserResponse(**user),
        next=parse_oauth_state(payload.state),
    )


@router.get("/me", response_model=AuthUserResponse)
def auth_me(user: AuthUser = Depends(get_current_user)):
    return AuthUserResponse(id=user.id, email=user.email)


@router.get("/google/redirect-uri")
def google_redirect_uri_debug():
    """Helper for setup — shows the exact URI to add in Google Cloud."""
    return {"redirect_uri": google_login_redirect_uri()}
