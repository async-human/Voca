from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings
from app.services.delivery.base import DeliveryResult

logger = logging.getLogger(__name__)

NOTION_PAGES_URL = "https://api.notion.com/v1/pages"


class NotionDelivery:
    platform = "notion"

    def send(
        self,
        *,
        content: str,
        subject: str | None,
        destination: dict[str, Any],
        credentials: dict[str, Any],
        connection_metadata: dict[str, Any],
    ) -> DeliveryResult:
        access_token = credentials.get("access_token")
        if not access_token:
            return DeliveryResult(status="failed", message="Notion not connected")

        database_id = destination.get("database_id") or connection_metadata.get("database_id")
        if not database_id:
            return DeliveryResult(status="failed", message="Notion database_id is required")

        title = subject or destination.get("title") or "Journal entry"

        payload = {
            "parent": {"database_id": database_id},
            "properties": {
                "Name": {
                    "title": [{"text": {"content": title[:2000]}}],
                }
            },
            "children": [
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": content[:2000]}}],
                    },
                }
            ],
        }

        # Append remaining content in chunks if long
        if len(content) > 2000:
            for i in range(2000, len(content), 2000):
                chunk = content[i : i + 2000]
                payload["children"].append(
                    {
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {"rich_text": [{"type": "text", "text": {"content": chunk}}]},
                    }
                )

        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(
                    NOTION_PAGES_URL,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Notion-Version": settings.notion_api_version,
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                resp.raise_for_status()
                body = resp.json()
            return DeliveryResult(
                status="sent",
                external_id=body.get("id"),
                message="Page created in Notion",
                metadata={"url": body.get("url")},
            )
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text[:300]
            logger.exception("Notion delivery failed: %s", detail)
            return DeliveryResult(status="failed", message=detail or str(exc))
        except Exception as exc:
            logger.exception("Notion delivery failed")
            return DeliveryResult(status="failed", message=str(exc))
