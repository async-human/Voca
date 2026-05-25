from __future__ import annotations

import logging
from typing import Any

import httpx

from app.services.delivery.base import DeliveryResult

logger = logging.getLogger(__name__)


class ZapierDelivery:
    platform = "zapier"

    def send(
        self,
        *,
        content: str,
        subject: str | None,
        destination: dict[str, Any],
        credentials: dict[str, Any],
        connection_metadata: dict[str, Any],
    ) -> DeliveryResult:
        webhook_url = credentials.get("webhook_url") or connection_metadata.get("webhook_url")
        if not webhook_url:
            return DeliveryResult(status="failed", message="Zapier webhook URL missing")

        payload = {
            "text": content,
            "subject": subject,
            "platform": destination.get("target_platform") or "zapier",
            **{k: v for k, v in destination.items() if k not in {"target_platform"}},
        }

        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(webhook_url, json=payload)
                resp.raise_for_status()
            return DeliveryResult(
                status="sent",
                message="Delivered via Zapier webhook",
                metadata={"status_code": resp.status_code},
            )
        except Exception as exc:
            logger.exception("Zapier delivery failed")
            return DeliveryResult(status="failed", message=str(exc))
