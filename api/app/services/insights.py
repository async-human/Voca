"""Weekly voice insights email digest."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

import resend
from supabase import Client

from app.config import settings

logger = logging.getLogger(__name__)


def _insights_html(*, email: str, profile: dict, week_label: str) -> str:
    sessions = profile.get("sessions_count") or 0
    clarity = profile.get("avg_clarity_score")
    insights = profile.get("longitudinal_insights") or []
    traits = profile.get("traits") or {}
    format_usage = profile.get("format_usage") or {}

    insight_items = "".join(f"<li>{i}</li>" for i in insights[:5]) or "<li>Keep recording — patterns emerge after a few sessions.</li>"
    trait_rows = "".join(
        f"<tr><td style='padding:4px 0;color:#897D72'>{k.title()}</td>"
        f"<td style='padding:4px 0;text-align:right'>{traits[k]:.0%}</td></tr>"
        for k in ("directness", "conciseness", "warmth", "formality")
        if k in traits
    )
    top_format = max(format_usage.items(), key=lambda x: x[1])[0] if format_usage else "email"

    return f"""
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1C1814">
      <h1 style="font-size:22px;margin-bottom:8px">Your week in voice · {week_label}</h1>
      <p style="color:#897D72;font-size:14px;line-height:1.6">
        Hi — here's what Vokal learned about how you communicate this week.
      </p>
      <div style="background:#F0EAE1;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px;font-size:13px;color:#897D72">SESSIONS</p>
        <p style="margin:0;font-size:28px;font-weight:bold">{sessions}</p>
        {f'<p style="margin:8px 0 0;color:#2A7A72">Avg clarity {clarity}/100</p>' if clarity else ''}
      </div>
      {'<table style="width:100%;margin-bottom:20px">' + trait_rows + '</table>' if trait_rows else ''}
      <p style="font-size:13px;color:#897D72;margin-bottom:8px">PATTERNS WE NOTICED</p>
      <ul style="font-size:14px;line-height:1.7;padding-left:20px">{insight_items}</ul>
      <p style="font-size:13px;color:#897D72">Most used format: <strong>{top_format}</strong></p>
      <p style="margin-top:24px"><a href="https://vokal.work/app" style="background:#1C1814;color:#F0EAE1;padding:12px 24px;border-radius:100px;text-decoration:none;font-size:14px">Open Studio →</a></p>
    </div>
    """


def send_weekly_insights(supabase: Client) -> dict:
    if not settings.resend_api_key or not settings.resend_from_email:
        return {"sent": 0, "skipped": "email not configured"}

    resend.api_key = settings.resend_api_key
    week_label = datetime.now(timezone.utc).strftime("%b %d")

    result = supabase.table("profiles").select("id, email, voice_profile, updated_at").execute()
    profiles = result.data or []

    sent = 0
    for row in profiles:
        profile = row.get("voice_profile") or {}
        sessions = int(profile.get("sessions_count") or 0)
        if sessions < 3:
            continue

        email = row.get("email")
        if not email:
            continue

        last_sent = profile.get("last_weekly_insight_at")
        if last_sent:
            try:
                last_dt = datetime.fromisoformat(last_sent.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) - last_dt < timedelta(days=6):
                    continue
            except ValueError:
                pass

        try:
            resend.Emails.send({
                "from": settings.resend_from_email,
                "to": email,
                "subject": f"Your Vokal week — {week_label}",
                "html": _insights_html(email=email, profile=profile, week_label=week_label),
            })
            profile["last_weekly_insight_at"] = datetime.now(timezone.utc).isoformat()
            supabase.table("profiles").update({
                "voice_profile": profile,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", row["id"]).execute()
            sent += 1
        except Exception as exc:
            logger.warning("Weekly insight email failed for %s: %s", email, exc)

    return {"sent": sent, "total_profiles": len(profiles)}
