from __future__ import annotations

import logging
from typing import Any

from supabase import Client

from app.services.delivery.base import DeliveryHandler, DeliveryResult
from app.services.delivery.credentials import decrypt_credentials, encrypt_credentials
from app.services.delivery.gmail import GmailDelivery
from app.services.delivery.notion import NotionDelivery
from app.services.delivery.zapier import ZapierDelivery

logger = logging.getLogger(__name__)

HANDLERS: dict[str, DeliveryHandler] = {
    "zapier": ZapierDelivery(),
    "gmail": GmailDelivery(),
    "notion": NotionDelivery(),
}


def get_connection(supabase: Client, user_id: str, connection_id: str) -> dict | None:
    result = (
        supabase.table("platform_connections")
        .select("*")
        .eq("id", connection_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return result.data


def list_connections(supabase: Client, user_id: str) -> list[dict]:
    result = (
        supabase.table("platform_connections")
        .select("id, platform, label, metadata, connected_at, updated_at")
        .eq("user_id", user_id)
        .order("connected_at", desc=True)
        .execute()
    )
    return result.data or []


def serialize_connection(row: dict) -> dict:
    return {
        "id": row["id"],
        "platform": row["platform"],
        "label": row.get("label") or row["platform"],
        "metadata": row.get("metadata") or {},
        "connected_at": row.get("connected_at"),
        "updated_at": row.get("updated_at"),
    }


def save_delivery_attempt(
    supabase: Client,
    *,
    recording_id: str,
    user_id: str,
    connection_id: str | None,
    platform: str,
    result: DeliveryResult,
    metadata: dict[str, Any] | None = None,
) -> dict:
    payload = {
        "recording_id": recording_id,
        "user_id": user_id,
        "connection_id": connection_id,
        "platform": platform,
        "status": result.status,
        "external_id": result.external_id,
        "error_message": result.message if result.status == "failed" else None,
        "metadata": {**(metadata or {}), **(result.metadata or {})},
    }
    insert = supabase.table("delivery_attempts").insert(payload).select("*").execute()
    rows = insert.data or []
    return rows[0] if rows else payload


def deliver_session(
    supabase: Client,
    *,
    recording_id: str,
    user_id: str,
    connection_id: str,
    destination: dict[str, Any],
    output_text: str,
    subject: str | None = None,
) -> tuple[DeliveryResult, dict]:
    connection = get_connection(supabase, user_id, connection_id)
    if not connection:
        raise ValueError("Connection not found")

    platform = connection["platform"]
    handler = HANDLERS.get(platform)
    if not handler:
        raise ValueError(f"Delivery not implemented for platform: {platform}")

    credentials = decrypt_credentials(connection.get("credentials_encrypted") or "")
    connection_metadata = connection.get("metadata") or {}

    result = handler.send(
        content=output_text,
        subject=subject,
        destination=destination,
        credentials=credentials,
        connection_metadata=connection_metadata,
    )

    if platform == "gmail" and credentials.get("access_token"):
        supabase.table("platform_connections").update(
            {"credentials_encrypted": encrypt_credentials(credentials)}
        ).eq("id", connection_id).execute()

    attempt = save_delivery_attempt(
        supabase,
        recording_id=recording_id,
        user_id=user_id,
        connection_id=connection_id,
        platform=platform,
        result=result,
        metadata={"destination": destination},
    )

    if result.status == "failed":
        raise ValueError(result.message or "Delivery failed")

    return result, attempt
