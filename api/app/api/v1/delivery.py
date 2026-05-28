"""Connections and delivery API routes."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from supabase import Client

from app.config import settings
from app.models.delivery import (
    DeliverRequest,
    DeliverResponse,
    DeliverWorkflowRequest,
    DeliverWorkflowResponse,
    NotionConnectMetadataRequest,
    WorkflowActionResult,
    ZapierConnectRequest,
)
from app.services.delivery.agent import deliver_session, list_connections, serialize_connection
from app.services.delivery.workflow_executor import deliver_workflow_bundle
from app.services.delivery.credentials import decrypt_credentials, encrypt_credentials
from app.services.delivery.oauth import (
    GMAIL_SCOPES,
    exchange_gmail_code,
    exchange_notion_code,
    gmail_authorize_url,
    gmail_has_draft_permission,
    notion_authorize_url,
    parse_oauth_state,
    revoke_google_token,
    upsert_connection,
)
from app.services.sessions import get_session_with_generation
from app.utils.auth import get_current_user
from app.services.supabase import get_supabase_client
from app.utils.errors import format_api_error

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["connections"])


def _delivery_db_error(exc: Exception) -> HTTPException | None:
    message = format_api_error(exc).lower()
    if "platform_connections" in message or "delivery_attempts" in message or "does not exist" in message:
        return HTTPException(
            status_code=503,
            detail="Delivery tables missing — run migration 006_delivery_schema.sql in Supabase.",
        )
    return None


def _frontend_connections_url(query: str = "") -> str:
    base = settings.app_frontend_url.rstrip("/")
    path = f"{base}/app/connections/"
    return f"{path}?{query}" if query else path


@router.get("/connections")
def get_connections(
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    try:
        rows = list_connections(supabase, user.id)
        return {"connections": [serialize_connection(r) for r in rows]}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("List connections error")
        mapped = _delivery_db_error(exc)
        if mapped:
            raise mapped from exc
        raise HTTPException(status_code=500, detail="Could not fetch connections") from exc


@router.post("/connections/zapier", status_code=201)
def connect_zapier(
    payload: ZapierConnectRequest,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    if not payload.webhook_url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Webhook URL must use HTTPS")

    try:
        insert = (
            supabase.table("platform_connections")
            .insert(
                {
                    "user_id": user.id,
                    "platform": "zapier",
                    "label": payload.label,
                    "credentials_encrypted": encrypt_credentials({"webhook_url": payload.webhook_url}),
                    "metadata": {"webhook_url": payload.webhook_url, "label": payload.label},
                }
            )
            .select("id, platform, label, metadata, connected_at, updated_at")
            .execute()
        )
    except Exception as exc:
        logger.exception("Zapier connect error")
        mapped = _delivery_db_error(exc)
        if mapped:
            raise mapped from exc
        raise HTTPException(status_code=500, detail="Could not save Zapier connection") from exc

    rows = insert.data or []
    if not rows:
        raise HTTPException(status_code=500, detail="Could not save Zapier connection")
    return serialize_connection(rows[0])


@router.patch("/connections/{connection_id}/notion")
def update_notion_metadata(
    connection_id: str,
    payload: NotionConnectMetadataRequest,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    result = (
        supabase.table("platform_connections")
        .select("id, platform, metadata")
        .eq("id", connection_id)
        .eq("user_id", user.id)
        .maybe_single()
        .execute()
    )
    row = result.data
    if not row or row.get("platform") != "notion":
        raise HTTPException(status_code=404, detail="Notion connection not found")

    metadata = {**(row.get("metadata") or {}), "database_id": payload.database_id}
    if payload.label:
        metadata["label"] = payload.label

    updated = (
        supabase.table("platform_connections")
        .update({"metadata": metadata, "label": payload.label or row.get("label")})
        .eq("id", connection_id)
        .select("id, platform, label, metadata, connected_at, updated_at")
        .execute()
    )
    rows = updated.data or []
    return serialize_connection(rows[0])


@router.delete("/connections/{connection_id}", status_code=204)
def disconnect(
    connection_id: str,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    result = (
        supabase.table("platform_connections")
        .select("platform, credentials_encrypted")
        .eq("id", connection_id)
        .eq("user_id", user.id)
        .maybe_single()
        .execute()
    )
    row = result.data
    if row and row.get("platform") == "gmail":
        try:
            creds = decrypt_credentials(row["credentials_encrypted"])
            revoke_google_token(creds)
        except Exception:
            logger.warning("Could not revoke Gmail token before disconnect", exc_info=True)
    supabase.table("platform_connections").delete().eq("id", connection_id).eq("user_id", user.id).execute()
    return None


@router.get("/connections/oauth/gmail/redirect-uri")
def gmail_redirect_uri_debug():
    """Shows the exact redirect URI to add in Google Cloud (must match byte-for-byte)."""
    from app.config import settings

    return {
        "redirect_uri": settings.google_redirect_uri,
        "configured": bool(settings.google_client_id and settings.google_redirect_uri),
    }


@router.get("/connections/oauth/gmail/start")
def gmail_oauth_start(user=Depends(get_current_user)):
    try:
        url = gmail_authorize_url(user.id)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"url": url}


@router.get("/connections/oauth/notion/start")
def notion_oauth_start(user=Depends(get_current_user)):
    try:
        url = notion_authorize_url(user.id)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"url": url}


@router.get("/connections/oauth/gmail/callback")
def gmail_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    supabase: Client = Depends(get_supabase_client),
):
    try:
        user_id = parse_oauth_state(state)
        credentials, metadata = exchange_gmail_code(code)
        if not gmail_has_draft_permission(metadata.get("granted_scopes")):
            revoke_google_token(credentials)
            return RedirectResponse(
                _frontend_connections_url(
                    "error=Gmail+connected+without+draft+permission.+In+Google+Cloud+OAuth+consent+screen+add+scope+gmail.compose+then+Remove+and+Connect+Gmail+again."
                )
            )
        upsert_connection(
            supabase,
            user_id=user_id,
            platform="gmail",
            credentials=credentials,
            metadata=metadata,
            label=metadata.get("email"),
        )
        return RedirectResponse(_frontend_connections_url("connected=gmail&drafts=1"))
    except Exception as exc:
        logger.exception("Gmail OAuth callback failed")
        return RedirectResponse(_frontend_connections_url(f"error={str(exc)[:120]}"))


@router.get("/connections/oauth/notion/callback")
def notion_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    supabase: Client = Depends(get_supabase_client),
):
    try:
        user_id = parse_oauth_state(state)
        credentials, metadata = exchange_notion_code(code)
        upsert_connection(
            supabase,
            user_id=user_id,
            platform="notion",
            credentials=credentials,
            metadata=metadata,
            label=metadata.get("workspace_name") or "Notion",
        )
        return RedirectResponse(_frontend_connections_url("connected=notion"))
    except Exception as exc:
        logger.exception("Notion OAuth callback failed")
        return RedirectResponse(_frontend_connections_url(f"error={str(exc)[:120]}"))


@router.post("/sessions/{session_id}/deliver")
def send_session(
    session_id: str,
    payload: DeliverRequest,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    record = get_session_with_generation(supabase, session_id, user.id)
    if not record:
        raise HTTPException(status_code=404, detail="Session not found")
    if record.get("status") != "complete":
        raise HTTPException(status_code=400, detail="Session is not complete yet")

    generation = record.get("generation")
    if not generation and not payload.output_text:
        raise HTTPException(status_code=400, detail="No output to deliver")

    output_text = payload.output_text or generation.get("output_text") or ""
    subject = (generation.get("output_meta") or {}).get("subject") if generation else None

    try:
        result, attempt = deliver_session(
            supabase,
            recording_id=session_id,
            user_id=user.id,
            connection_id=payload.connection_id,
            destination=payload.destination,
            output_text=output_text,
            subject=subject,
            action_id=payload.action_id,
            idempotency_key=payload.idempotency_key,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Delivery error")
        raise HTTPException(status_code=500, detail="Delivery failed") from exc

    connection = (
        supabase.table("platform_connections")
        .select("platform")
        .eq("id", payload.connection_id)
        .maybe_single()
        .execute()
    )
    platform = (connection.data or {}).get("platform", "unknown")

    return DeliverResponse(
        attempt_id=attempt.get("id", ""),
        status=result.status,
        platform=platform,
        external_id=result.external_id,
        message=result.message,
    )


@router.post("/sessions/{session_id}/deliver-workflow")
def deliver_workflow(
    session_id: str,
    payload: DeliverWorkflowRequest,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client),
):
    record = get_session_with_generation(supabase, session_id, user.id)
    if not record:
        raise HTTPException(status_code=404, detail="Session not found")
    if record.get("status") != "complete":
        raise HTTPException(status_code=400, detail="Session is not complete yet")

    generation = record.get("generation")
    if not generation:
        raise HTTPException(status_code=400, detail="No generation to deliver")

    output_meta = generation.get("output_meta") or {}
    if not output_meta.get("approval_bundle", {}).get("actions"):
        raise HTTPException(status_code=400, detail="No workflow approval plan on this session")

    output_text = payload.output_text or generation.get("output_text") or ""
    subject = output_meta.get("subject")
    gmail_mode = payload.gmail_mode if payload.gmail_mode in {"draft", "send"} else "draft"

    try:
        raw_results = deliver_workflow_bundle(
            supabase,
            recording_id=session_id,
            user_id=user.id,
            output_meta=output_meta,
            output_text=output_text,
            subject=subject,
            gmail_connection_id=payload.gmail_connection_id,
            zapier_connection_id=payload.zapier_connection_id,
            gmail_mode=gmail_mode,
            recipient_email=(payload.recipient_email or "").strip() or None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Workflow delivery error")
        raise HTTPException(status_code=500, detail="Workflow delivery failed") from exc

    return DeliverWorkflowResponse(
        results=[WorkflowActionResult(**row) for row in raw_results],
    )
