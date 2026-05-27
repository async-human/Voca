"""Execute approval-bundle workflow actions (email + CRM + reminders)."""

from __future__ import annotations

import json
import logging
from typing import Any

from supabase import Client

from app.services.delivery.agent import deliver_session, list_connections

logger = logging.getLogger(__name__)


def _format_crm_note(crm_note: dict[str, Any]) -> str:
    lines: list[str] = []
    contact = crm_note.get("contact")
    company = crm_note.get("company")
    if contact or company:
        lines.append(f"Contact: {' at '.join(x for x in [contact, company] if x)}")
    if crm_note.get("role"):
        lines.append(f"Role: {crm_note['role']}")
    if crm_note.get("call_outcome"):
        lines.append(f"Outcome: {crm_note['call_outcome']}")
    if crm_note.get("pain_identified"):
        lines.append(f"Pain: {crm_note['pain_identified']}")
    for point in crm_note.get("key_points") or []:
        lines.append(f"- {point}")
    for obj in crm_note.get("objections_raised") or []:
        lines.append(f"Objection: {obj}")
    if crm_note.get("next_action"):
        lines.append(f"Next action: {crm_note['next_action']}")
    if crm_note.get("next_action_date"):
        lines.append(f"When: {crm_note['next_action_date']}")
    return "\n".join(lines) if lines else json.dumps(crm_note, indent=2)


def _pick_connection(
    connections: list[dict],
    platform: str,
    preferred_id: str | None,
) -> dict | None:
    if preferred_id:
        for row in connections:
            if row["id"] == preferred_id and row.get("platform") == platform:
                return row
    for row in connections:
        if row.get("platform") == platform:
            return row
    return None


def deliver_workflow_bundle(
    supabase: Client,
    *,
    recording_id: str,
    user_id: str,
    output_meta: dict[str, Any],
    output_text: str,
    subject: str | None = None,
    gmail_connection_id: str | None = None,
    zapier_connection_id: str | None = None,
    gmail_mode: str = "draft",
    recipient_email: str | None = None,
) -> list[dict[str, Any]]:
    """Run deliverable actions from output_meta.approval_bundle."""
    bundle = output_meta.get("approval_bundle") or {}
    actions = bundle.get("actions") or []
    if not actions:
        raise ValueError("No workflow actions to deliver")

    connections = list_connections(supabase, user_id)
    results: list[dict[str, Any]] = []

    for action in actions:
        action_id = str(action.get("id") or "")
        action_type = str(action.get("type") or "")
        payload = action.get("payload") or {}

        if action_type in {"review_output"}:
            results.append({
                "action_id": action_id,
                "type": action_type,
                "status": "skipped",
                "message": "Review only — no delivery",
            })
            continue

        try:
            if action_type == "draft_email":
                conn = _pick_connection(connections, "gmail", gmail_connection_id)
                if not conn:
                    results.append({
                        "action_id": action_id,
                        "type": action_type,
                        "status": "skipped",
                        "message": "Connect Gmail in Connections",
                    })
                    continue
                to_addr = payload.get("to") or (recipient_email or "").strip() or None
                if not to_addr:
                    results.append({
                        "action_id": action_id,
                        "type": action_type,
                        "status": "skipped",
                        "message": "Missing recipient email",
                    })
                    continue
                body = str(payload.get("body") or output_text)
                subj = payload.get("subject") or subject
                result, attempt = deliver_session(
                    supabase,
                    recording_id=recording_id,
                    user_id=user_id,
                    connection_id=conn["id"],
                    destination={"to": to_addr, "mode": gmail_mode},
                    output_text=body,
                    subject=str(subj) if subj else None,
                    action_id=action_id,
                )
                results.append({
                    "action_id": action_id,
                    "type": action_type,
                    "status": result.status,
                    "platform": "gmail",
                    "external_id": result.external_id,
                    "message": result.message,
                    "attempt_id": attempt.get("id"),
                })

            elif action_type == "create_crm_note":
                conn = _pick_connection(connections, "zapier", zapier_connection_id)
                if not conn:
                    results.append({
                        "action_id": action_id,
                        "type": action_type,
                        "status": "skipped",
                        "message": "Connect Zapier webhook for CRM sync",
                    })
                    continue
                crm_note = payload.get("crm_note") or output_meta.get("crm_note") or {}
                if not isinstance(crm_note, dict):
                    crm_note = {}
                text = _format_crm_note(crm_note)
                target = payload.get("target_platform") or "salesforce"
                result, attempt = deliver_session(
                    supabase,
                    recording_id=recording_id,
                    user_id=user_id,
                    connection_id=conn["id"],
                    destination={
                        "target_platform": target,
                        "action": "create_crm_note",
                        "crm_note": crm_note,
                        "deal_stage_signal": payload.get("deal_stage_signal")
                        or output_meta.get("deal_stage_signal"),
                    },
                    output_text=text,
                    subject=subject,
                    action_id=action_id,
                )
                results.append({
                    "action_id": action_id,
                    "type": action_type,
                    "status": result.status,
                    "platform": "zapier",
                    "external_id": result.external_id,
                    "message": result.message,
                    "attempt_id": attempt.get("id"),
                })

            elif action_type == "create_callback_reminder":
                conn = _pick_connection(connections, "zapier", zapier_connection_id)
                if not conn:
                    results.append({
                        "action_id": action_id,
                        "type": action_type,
                        "status": "skipped",
                        "message": "Connect Zapier for calendar/reminder Zaps",
                    })
                    continue
                reminder_text = (
                    f"Callback: {payload.get('title') or 'Follow up'}\n"
                    f"When: {payload.get('time') or 'TBD'}"
                )
                result, attempt = deliver_session(
                    supabase,
                    recording_id=recording_id,
                    user_id=user_id,
                    connection_id=conn["id"],
                    destination={
                        "target_platform": "calendar",
                        "action": "create_callback_reminder",
                        "title": payload.get("title"),
                        "time": payload.get("time"),
                    },
                    output_text=reminder_text,
                    subject=subject,
                    action_id=action_id,
                )
                results.append({
                    "action_id": action_id,
                    "type": action_type,
                    "status": result.status,
                    "platform": "zapier",
                    "external_id": result.external_id,
                    "message": result.message,
                    "attempt_id": attempt.get("id"),
                })

            else:
                results.append({
                    "action_id": action_id,
                    "type": action_type,
                    "status": "skipped",
                    "message": f"Unsupported action type: {action_type}",
                })

        except Exception as exc:
            logger.exception("Workflow action %s failed", action_id)
            results.append({
                "action_id": action_id,
                "type": action_type,
                "status": "failed",
                "message": str(exc),
            })

    return results
