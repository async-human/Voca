from __future__ import annotations

import base64
import logging
from email.message import EmailMessage
from typing import Any

import httpx

from app.config import settings
from app.services.delivery.base import DeliveryResult

logger = logging.getLogger(__name__)

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
GMAIL_DRAFTS_URL = "https://gmail.googleapis.com/gmail/v1/users/me/drafts"


class GmailDelivery:
    platform = "gmail"

    def refresh_access_token(self, credentials: dict[str, Any]) -> dict[str, Any]:
        refresh_token = credentials.get("refresh_token")
        if not refresh_token:
            raise ValueError("Gmail refresh token missing — reconnect Gmail")

        if not settings.google_client_id or not settings.google_client_secret:
            raise ValueError("Gmail OAuth is not configured on the server")

        with httpx.Client(timeout=20.0) as client:
            resp = client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        credentials = {**credentials, "access_token": data["access_token"]}
        if data.get("refresh_token"):
            credentials["refresh_token"] = data["refresh_token"]
        return credentials

    def _build_raw_message(
        self,
        *,
        to_addr: str,
        subject: str,
        content: str,
        from_addr: str,
    ) -> str:
        message = EmailMessage()
        message["From"] = from_addr
        message["To"] = to_addr
        message["Subject"] = subject
        message.set_content(content or "")
        return base64.urlsafe_b64encode(message.as_bytes()).decode().rstrip("=")

    def send(
        self,
        *,
        content: str,
        subject: str | None,
        destination: dict[str, Any],
        credentials: dict[str, Any],
        connection_metadata: dict[str, Any],
    ) -> DeliveryResult:
        to_addr = destination.get("to")
        if not to_addr:
            return DeliveryResult(status="failed", message="Recipient email (to) is required")

        subj = subject or destination.get("subject") or "Message from Vokal"
        from_addr = connection_metadata.get("email") or credentials.get("email") or "me"
        mode = (destination.get("mode") or "draft").lower()

        try:
            creds = self.refresh_access_token(credentials)
            credentials.clear()
            credentials.update(creds)
        except Exception as exc:
            return DeliveryResult(status="failed", message=str(exc))

        encoded = self._build_raw_message(
            to_addr=to_addr,
            subject=subj,
            content=content,
            from_addr=from_addr,
        )

        try:
            with httpx.Client(timeout=30.0) as client:
                headers = {"Authorization": f"Bearer {creds['access_token']}"}
                if mode == "send":
                    resp = client.post(
                        GMAIL_SEND_URL,
                        headers=headers,
                        json={"raw": encoded},
                    )
                    resp.raise_for_status()
                    body = resp.json()
                    return DeliveryResult(
                        status="sent",
                        external_id=body.get("id"),
                        message=f"Email sent to {to_addr}",
                        metadata={"thread_id": body.get("threadId"), "mode": "send"},
                    )

                resp = client.post(
                    GMAIL_DRAFTS_URL,
                    headers=headers,
                    json={"message": {"raw": encoded}},
                )
                resp.raise_for_status()
                body = resp.json()
                draft_id = body.get("id")
                return DeliveryResult(
                    status="sent",
                    external_id=draft_id,
                    message=f"Draft saved in Gmail for {to_addr}",
                    metadata={"draft_id": draft_id, "mode": "draft"},
                )
        except Exception as exc:
            logger.exception("Gmail delivery failed")
            return DeliveryResult(status="failed", message=str(exc))
