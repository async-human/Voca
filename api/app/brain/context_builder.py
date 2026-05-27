from __future__ import annotations

import json
import logging
from typing import Any

from supabase import Client

from app.config import settings
from app.services.openai_client import chat_json
from app.services.pinecone_memory import query_similar_sessions

logger = logging.getLogger(__name__)

SALES_FORMATS = {
    "sales",
    "post_call_followup",
    "crm_note",
    "voicemail_script",
    "pipeline_update",
}


CONTACT_HINT_PROMPT = """Extract sales context hints from this transcript. Do not invent.

Return JSON:
{
  "workflow_type": "post_call_followup|crm_note|voicemail_script|pipeline_update|null",
  "contact": {
    "name": "person name or null",
    "company": "company or null",
    "role": "role/title or null",
    "email": "email or null"
  },
  "next_action": "specific next action or null",
  "next_action_date": "date/time mentioned or null",
  "confidence": 0.0
}

Transcript:
\"\"\"
{transcript}
\"\"\""""


def _latest_generation(generations: list[dict] | None) -> dict | None:
    if not generations:
        return None
    return max(generations, key=lambda g: g.get("created_at") or "")


def _shorten(value: str | None, limit: int = 360) -> str:
    text = " ".join(str(value or "").split())
    return text[: limit - 3] + "..." if len(text) > limit else text


def _extract_contact_hint(transcript: str, output_format: str) -> dict[str, Any]:
    if output_format not in SALES_FORMATS or not transcript.strip() or not settings.openai_api_key:
        return {}

    try:
        result = chat_json(
            system="Return only valid JSON. Extract only explicit or strongly implied sales context.",
            user=CONTACT_HINT_PROMPT.format(transcript=transcript),
            model=settings.openai_fast_model,
            temperature=0.0,
        )
    except Exception as exc:
        logger.warning("Contact hint extraction failed: %s", exc)
        return {}

    if not isinstance(result, dict):
        return {}

    contact = result.get("contact") if isinstance(result.get("contact"), dict) else {}
    workflow = result.get("workflow_type")
    if workflow not in {"post_call_followup", "crm_note", "voicemail_script", "pipeline_update"}:
        workflow = None

    return {
        "workflow_type": workflow,
        "contact": {
            "name": contact.get("name"),
            "company": contact.get("company"),
            "role": contact.get("role"),
            "email": contact.get("email"),
        },
        "next_action": result.get("next_action"),
        "next_action_date": result.get("next_action_date"),
        "confidence": result.get("confidence"),
    }


def _fetch_recent_sessions(supabase: Client, user_id: str, limit: int = 5) -> list[dict[str, Any]]:
    try:
        result = (
            supabase.table("recordings")
            .select(
                "id, format, clean_transcript, raw_transcript, clarity_score, created_at, "
                "generations(format, output_text, output_meta, created_at)"
            )
            .eq("user_id", user_id)
            .eq("status", "complete")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
    except Exception as exc:
        logger.warning("Recent session context fetch failed: %s", exc)
        return []

    sessions: list[dict[str, Any]] = []
    for row in result.data or []:
        generation = _latest_generation(row.get("generations"))
        sessions.append({
            "id": row.get("id"),
            "format": row.get("format"),
            "created_at": row.get("created_at"),
            "clarity_score": row.get("clarity_score"),
            "transcript": _shorten(row.get("clean_transcript") or row.get("raw_transcript")),
            "output_preview": _shorten(generation.get("output_text") if generation else None),
            "workflow_type": ((generation or {}).get("output_meta") or {}).get("workflow_type"),
        })
    return sessions


def _fetch_platform_context(supabase: Client, user_id: str) -> list[dict[str, Any]]:
    try:
        result = (
            supabase.table("platform_connections")
            .select("id, platform, label, metadata, connected_at")
            .eq("user_id", user_id)
            .execute()
        )
    except Exception as exc:
        logger.warning("Platform context fetch failed: %s", exc)
        return []

    return [
        {
            "id": row.get("id"),
            "platform": row.get("platform"),
            "label": row.get("label"),
            "metadata": row.get("metadata") or {},
            "connected_at": row.get("connected_at"),
        }
        for row in (result.data or [])
    ]


def build_context(
    supabase: Client,
    *,
    user_id: str,
    transcript: str,
    output_format: str,
) -> dict[str, Any]:
    """Build pre-generation context from existing product memory and connections.

    This is intentionally connector-light. It creates the stable context contract now,
    while Gmail thread reading and native CRM lookup can be added behind the same keys.
    """

    similar_sessions = query_similar_sessions(user_id=user_id, text=transcript, top_k=3)
    contact_hint = _extract_contact_hint(transcript, output_format)

    return {
        "requested_format": output_format,
        "contact_hint": contact_hint,
        "recent_sessions": _fetch_recent_sessions(supabase, user_id),
        "similar_sessions": similar_sessions,
        "platform_connections": _fetch_platform_context(supabase, user_id),
        "gmail_thread": None,
        "crm_context": None,
    }


def format_context_for_prompt(context: dict[str, Any] | None) -> str:
    if not context:
        return "No additional context available."

    lines: list[str] = []

    contact_hint = context.get("contact_hint") or {}
    contact = contact_hint.get("contact") or {}
    if any(contact.values()) or contact_hint.get("workflow_type"):
        lines.append("Inferred workflow/contact hints:")
        lines.append(json.dumps(contact_hint, indent=2))

    platforms = context.get("platform_connections") or []
    if platforms:
        labels = [f"{p.get('platform')}:{p.get('label')}" for p in platforms[:5]]
        lines.append("Connected destinations: " + ", ".join(labels))

    recent = context.get("recent_sessions") or []
    if recent:
        lines.append("Recent completed sessions:")
        for item in recent[:5]:
            bits = [item.get("format") or "unknown"]
            if item.get("workflow_type"):
                bits.append(f"workflow {item['workflow_type']}")
            if item.get("clarity_score") is not None:
                bits.append(f"clarity {item['clarity_score']}")
            lines.append(f"- {'; '.join(bits)}: {item.get('output_preview') or item.get('transcript') or ''}")

    similar = context.get("similar_sessions") or []
    if similar:
        lines.append("Similar memory matches:")
        for item in similar[:3]:
            meta = item.get("metadata") or {}
            lines.append(
                f"- {meta.get('format', 'unknown')} session "
                f"(score {float(item.get('score') or 0):.2f}, clarity {meta.get('clarity_score', 'n/a')})"
            )

    if context.get("gmail_thread"):
        lines.append("Gmail thread context:")
        lines.append(json.dumps(context["gmail_thread"], indent=2)[:1200])

    if context.get("crm_context"):
        lines.append("CRM context:")
        lines.append(json.dumps(context["crm_context"], indent=2)[:1200])

    return "\n".join(lines) if lines else "No additional context available."
