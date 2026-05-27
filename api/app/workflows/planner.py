from __future__ import annotations

from typing import Any

from app.workflows.state import WorkflowAction, WorkflowState

SALES_FORMATS = {"sales", "post_call_followup", "crm_note", "voicemail_script", "pipeline_update"}


def _contact_from_meta(output_meta: dict[str, Any]) -> dict[str, Any]:
    crm_note = output_meta.get("crm_note") if isinstance(output_meta.get("crm_note"), dict) else {}
    return {
        "name": crm_note.get("contact"),
        "company": crm_note.get("company"),
        "role": crm_note.get("role"),
        "email": crm_note.get("email"),
    }


def _contact_from_context(context: dict[str, Any]) -> dict[str, Any]:
    hint = context.get("contact_hint") if isinstance(context.get("contact_hint"), dict) else {}
    contact = hint.get("contact") if isinstance(hint.get("contact"), dict) else {}
    return {
        "name": contact.get("name"),
        "company": contact.get("company"),
        "role": contact.get("role"),
        "email": contact.get("email"),
    }


def _workflow_type(requested_format: str, output_meta: dict[str, Any], context: dict[str, Any]) -> str | None:
    explicit = output_meta.get("workflow_type")
    if explicit:
        return str(explicit)
    hint = context.get("contact_hint") if isinstance(context.get("contact_hint"), dict) else {}
    if hint.get("workflow_type"):
        return str(hint["workflow_type"])
    if requested_format in {"post_call_followup", "crm_note", "voicemail_script", "pipeline_update"}:
        return requested_format
    if requested_format == "sales":
        return "post_call_followup"
    return None


def plan_workflow(
    *,
    user_id: str,
    transcript: str,
    requested_format: str,
    output_text: str,
    output_meta: dict[str, Any] | None,
    context: dict[str, Any] | None,
    session_id: str | None = None,
) -> WorkflowState:
    meta = output_meta or {}
    ctx = context or {}
    workflow_type = _workflow_type(requested_format, meta, ctx)
    domain = "sales" if requested_format in SALES_FORMATS or (workflow_type or "").startswith(("post_", "crm_", "pipeline_", "voicemail")) else None

    state = WorkflowState(
        session_id=session_id,
        user_id=user_id,
        transcript=transcript,
        requested_format=requested_format,
        domain=domain,
        workflow_type=workflow_type,
        context=ctx,
        entities={"contact": {**_contact_from_context(ctx), **{k: v for k, v in _contact_from_meta(meta).items() if v}}},
    )

    if domain != "sales":
        state.workflow_type = requested_format
        state.actions.append(
            WorkflowAction(
                id="primary_output",
                type="review_output",
                title="Review generated output",
                payload={"format": requested_format, "body": output_text, "subject": meta.get("subject")},
                approval_reason="Generated communication should be reviewed before use.",
            )
        )
        return state

    contact = state.entities.get("contact") or {}
    contact_email = contact.get("email")
    subject = meta.get("subject")
    crm_note = meta.get("crm_note") if isinstance(meta.get("crm_note"), dict) else {}

    if workflow_type in {"post_call_followup", "sales"}:
        if not contact_email:
            state.missing_fields.append("contact_email")
        state.actions.append(
            WorkflowAction(
                id="email_1",
                type="draft_email",
                title="Review follow-up email",
                payload={
                    "to": contact_email,
                    "subject": subject,
                    "body": output_text,
                    "connection_platform": "gmail",
                },
                approval_reason="External email requires user approval.",
            )
        )

    if crm_note or workflow_type in {"crm_note", "post_call_followup", "pipeline_update"}:
        state.actions.append(
            WorkflowAction(
                id="crm_1",
                type="create_crm_note",
                title="Review CRM note",
                payload={
                    "target_platform": "zapier",
                    "crm_note": crm_note,
                    "deal_stage_signal": meta.get("deal_stage_signal"),
                },
                approval_reason="CRM updates affect external records.",
            )
        )

    next_action = crm_note.get("next_action") if crm_note else None
    next_action_date = crm_note.get("next_action_date") if crm_note else None
    if next_action or next_action_date:
        state.actions.append(
            WorkflowAction(
                id="reminder_1",
                type="create_callback_reminder",
                title="Review callback reminder",
                payload={"title": next_action or "Follow up", "time": next_action_date},
                approval_reason="Calendar/task creation requires confirmation.",
            )
        )

    if not state.actions:
        state.actions.append(
            WorkflowAction(
                id="primary_output",
                type="review_output",
                title="Review sales output",
                payload={"format": requested_format, "body": output_text, "subject": subject},
            )
        )

    if state.missing_fields:
        state.risk_level = "high"
        state.approval_reason = "Missing fields must be filled before execution."
    else:
        state.risk_level = "medium"
        state.approval_reason = "External workflow actions require approval."

    return state
