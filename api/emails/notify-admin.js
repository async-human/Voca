const useCaseLabels = {
  email: 'Emails',
  reports: 'Reports & docs',
  linkedin: 'LinkedIn posts',
  slack: 'Slack messages',
  journal: 'Personal journal',
  other: 'Something else',
};

export function notifyAdminEmailHtml({
  email,
  useCase,
  source,
  referrer,
  utm_source,
  utm_medium,
  utm_campaign,
  createdAt,
}) {
  const useCaseLabel = useCase ? (useCaseLabels[useCase] || useCase) : 'Not specified';
  const row = (label, value) =>
    value
      ? `<tr><td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#897D72;width:120px;vertical-align:top;">${label}</td><td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1C1814;">${value}</td></tr>`
      : '';

  return `<!DOCTYPE html>
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
                ${row('Email', `<strong>${email}</strong>`)}
                ${row('Writes most', useCaseLabel)}
                ${row('Source', source)}
                ${row('Referrer', referrer)}
                ${row('UTM source', utm_source)}
                ${row('UTM medium', utm_medium)}
                ${row('UTM campaign', utm_campaign)}
                ${row('Signed up', createdAt)}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
