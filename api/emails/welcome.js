export function welcomeEmailHtml({ email }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're on the Voca waitlist</title>
</head>
<body style="margin:0;padding:0;background:#F0EAE1;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F0EAE1;padding:48px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #DDD5CA;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:40px 40px 28px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#BF3B2A;margin-bottom:18px;">
                Voca · Early Access
              </div>
              <h1 style="margin:0 0 16px;font-size:32px;line-height:1.15;color:#1C1814;font-weight:400;">
                Think out loud.<br>
                <em style="color:#BF3B2A;font-style:italic;">Send something brilliant.</em>
              </h1>
              <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#44392E;">
                You're on the waitlist. We'll email <strong style="color:#1C1814;">${email}</strong> when early access opens — we're onboarding the first 500 users personally.
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
                Back to Voca →
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#897D72;">
          No spam · Free to join · © 2026 Voca
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
