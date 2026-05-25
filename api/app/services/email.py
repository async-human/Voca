import html
import logging
from datetime import datetime, timezone

import resend

from app.config import settings

logger = logging.getLogger(__name__)

USE_CASE_LABELS = {
    "email": "Emails",
    "reports": "Reports & docs",
    "linkedin": "LinkedIn posts",
    "slack": "Slack messages",
    "journal": "Personal journal",
    "other": "Something else",
}


def welcome_email_text(email: str) -> str:
    return f"""You're on the Vokal waitlist.

We'll email {email} when early access opens — and reach out personally as we onboard new users.

Speak for 60 seconds. Get a polished email, report, or LinkedIn post — written in your voice, explained by AI.

https://vokal.work

— Vokal
No spam · Free to join"""


def welcome_email_html(email: str) -> str:
    safe_email = html.escape(email)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're on the Vokal waitlist</title>
</head>
<body style="margin:0;padding:0;background:#F0EAE1;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F0EAE1;padding:48px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #DDD5CA;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:40px 40px 28px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#BF3B2A;margin-bottom:18px;">
                Vokal · Early Access
              </div>
              <h1 style="margin:0 0 16px;font-size:32px;line-height:1.15;color:#1C1814;font-weight:400;">
                Your voice.<br>
                <em style="color:#BF3B2A;font-style:italic;">Perfectly expressed.</em>
              </h1>
              <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#44392E;">
                You're on the waitlist. We'll email <strong style="color:#1C1814;">{safe_email}</strong> when early access opens — and reach out personally as we onboard new users.
              </p>
              <div style="padding:18px 20px;border-radius:16px;background:#F0EAE1;border:1px solid #DDD5CA;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#897D72;margin-bottom:8px;">
                  What happens next
                </div>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#44392E;">
                  Speak for 60 seconds. Get a perfect email, report, or LinkedIn post — written in your voice, explained by AI.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 36px;">
              <a href="https://vokal.work" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#1C1814;color:#F0EAE1;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;">
                Back to Vokal →
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#897D72;">
          No spam · Free to join · © 2026 Vokal
        </p>
      </td>
    </tr>
  </table>
</body>
</html>"""


def notify_admin_email_html(
    *,
    email: str,
    use_case: str | None,
    source: str,
    referrer: str | None,
    utm_source: str | None,
    utm_medium: str | None,
    utm_campaign: str | None,
    created_at: str,
) -> str:
    use_case_label = USE_CASE_LABELS.get(use_case, use_case) if use_case else "Not specified"

    def row(label: str, value: str | None) -> str:
        if not value:
            return ""
        return (
            f'<tr><td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;'
            f'font-size:13px;color:#897D72;width:120px;vertical-align:top;">{label}</td>'
            f'<td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;'
            f'font-size:13px;color:#1C1814;">{html.escape(value)}</td></tr>'
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Vokal waitlist signup</title>
</head>
<body style="margin:0;padding:0;background:#F0EAE1;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F0EAE1;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#FFFFFF;border:1px solid #DDD5CA;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#BF3B2A;margin-bottom:12px;">
                New waitlist signup
              </div>
              <h1 style="margin:0 0 20px;font-size:24px;line-height:1.2;color:#1C1814;font-weight:400;">
                Someone joined the waitlist
              </h1>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                {row("Email", email)}
                {row("Writes most", use_case_label)}
                {row("Source", source)}
                {row("Referrer", referrer)}
                {row("UTM source", utm_source)}
                {row("UTM medium", utm_medium)}
                {row("UTM campaign", utm_campaign)}
                {row("Signed up", created_at)}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_waitlist_emails(*, email: str, use_case: str | None, source: str, referrer: str | None,
                         utm_source: str | None, utm_medium: str | None, utm_campaign: str | None,
                         created_at: datetime) -> None:
    if not settings.resend_api_key or not settings.resend_from_email:
        return

    resend.api_key = settings.resend_api_key
    notify_email = settings.notify_email
    signup_time = created_at.astimezone(timezone.utc).strftime("%b %d, %Y, %I:%M %p UTC")

    try:
        resend.Emails.send({
            "from": settings.resend_from_email,
            "to": [email],
            "reply_to": notify_email,
            "subject": "You're on the Vokal waitlist",
            "html": welcome_email_html(email),
            "text": welcome_email_text(email),
        })
        resend.Emails.send({
            "from": settings.resend_from_email,
            "to": [notify_email],
            "reply_to": email,
            "subject": f"New waitlist signup: {email}",
            "html": notify_admin_email_html(
                email=email,
                use_case=use_case,
                source=source,
                referrer=referrer,
                utm_source=utm_source,
                utm_medium=utm_medium,
                utm_campaign=utm_campaign,
                created_at=signup_time,
            ),
        })
    except Exception:
        logger.exception("Failed to send waitlist emails for %s", email)
