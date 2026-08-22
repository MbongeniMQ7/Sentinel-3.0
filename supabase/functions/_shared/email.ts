// Branded Sentinel-AI OTP email — shared by the OTP edge functions.
// The banner image lives in the app's public folder and is referenced by URL.
const BANNER_URL = "https://sentinel-30.vercel.app/images/banners/welcome.png"
const LOGO_URL = "https://sentinel-30.vercel.app/images/logo.png"
const SUPPORT_EMAIL = "support@sentinelai-software.co.za"

// Renders the six-digit code into individual styled boxes.
export function renderOtpEmail(code: string, heading: string, intro: string, expiryMinutes: number): string {
  const digits = code
    .split("")
    .map(
      (d) =>
        `<td align="center" style="width:44px;height:56px;background:#F5F4F0;border:1px solid rgba(0,0,0,0.08);border-radius:10px;font-family:'Courier New',monospace;font-size:28px;font-weight:600;color:#111;">${d}</td>`,
    )
    .join(`<td style="width:8px;">&nbsp;</td>`)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#EDECE7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDECE7;padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid rgba(0,0,0,0.07);border-radius:20px;overflow:hidden;">
    <tr>
      <td style="padding:0;">
        <img src="${BANNER_URL}" alt="Sentinel-AI" width="520" style="display:block;width:100%;height:auto;border:0;" />
      </td>
    </tr>
    <tr>
      <td style="padding:36px 40px 8px 40px;">
        <h1 style="margin:0;font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;font-weight:300;font-size:26px;line-height:1.2;color:#111;letter-spacing:-0.01em;">${heading}</h1>
        <p style="margin:14px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:rgba(0,0,0,0.5);">${intro}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 40px 8px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>${digits}</tr></table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 0 40px;">
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:rgba(0,0,0,0.4);text-align:center;">This code expires in ${expiryMinutes} minutes and can only be used once.<br/>For your security, never share it with anyone.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px 36px 40px;">
        <div style="height:1px;background:rgba(0,0,0,0.07);margin-bottom:24px;"></div>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:8px;">
            <img src="${LOGO_URL}" alt="" width="20" height="20" style="display:block;border:0;" />
          </td>
          <td style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.25em;color:rgba(0,0,0,0.55);">SENTINEL-AI</td>
        </tr></table>
        <p style="margin:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:rgba(0,0,0,0.35);">
          Didn't request this? You can safely ignore this email.<br/>
          Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color:rgba(0,0,0,0.5);">${SUPPORT_EMAIL}</a>.<br/>
          &copy; 2026 Sentinel-AI Workforce
        </p>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}

// Branded welcome email sent when an admin adds a manager or employee.
// Tells them which site they belong to and that sign-in is email-based (no password).
export function renderInviteEmail(input: {
  fullName: string
  roleLabel: string
  siteName: string
  loginUrl: string
}): string {
  const { fullName, roleLabel, siteName, loginUrl } = input
  const firstName = fullName.trim().split(/\s+/)[0] || "there"

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>Welcome to Sentinel-AI</title>
</head>
<body style="margin:0;padding:0;background:#EDECE7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDECE7;padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid rgba(0,0,0,0.07);border-radius:20px;overflow:hidden;">
    <tr>
      <td style="padding:0;">
        <img src="${BANNER_URL}" alt="Sentinel-AI" width="520" style="display:block;width:100%;height:auto;border:0;" />
      </td>
    </tr>
    <tr>
      <td style="padding:36px 40px 8px 40px;">
        <h1 style="margin:0;font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;font-weight:300;font-size:26px;line-height:1.2;color:#111;letter-spacing:-0.01em;">Welcome to Sentinel-AI, ${firstName}</h1>
        <p style="margin:14px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:rgba(0,0,0,0.5);">You've been added to the Sentinel-AI Workforce platform. Your account is ready — here are your details.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 8px 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4F0;border:1px solid rgba(0,0,0,0.08);border-radius:12px;">
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid rgba(0,0,0,0.06);font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(0,0,0,0.4);">Role</td>
            <td style="padding:16px 20px;border-bottom:1px solid rgba(0,0,0,0.06);font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#111;text-align:right;">${roleLabel}</td>
          </tr>
          <tr>
            <td style="padding:16px 20px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(0,0,0,0.4);">Site</td>
            <td style="padding:16px 20px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#111;text-align:right;">${siteName}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 40px 8px 40px;">
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:rgba(0,0,0,0.6);">To sign in, use <strong style="color:#111;">this email address</strong>. There's no password — we'll send a one-time code to your inbox each time you log in.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 8px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
          <td align="center" style="border-radius:12px;background:#111;">
            <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Sign in to Sentinel-AI</a>
          </td>
        </tr></table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 40px 0 40px;">
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:rgba(0,0,0,0.4);text-align:center;">Or go to <a href="${loginUrl}" style="color:rgba(0,0,0,0.55);">${loginUrl}</a> and enter your email.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px 36px 40px;">
        <div style="height:1px;background:rgba(0,0,0,0.07);margin-bottom:24px;"></div>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:8px;">
            <img src="${LOGO_URL}" alt="" width="20" height="20" style="display:block;border:0;" />
          </td>
          <td style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.25em;color:rgba(0,0,0,0.55);">SENTINEL-AI</td>
        </tr></table>
        <p style="margin:16px 0 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:rgba(0,0,0,0.35);">
          Weren't expecting this? You can safely ignore this email.<br/>
          Need help? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color:rgba(0,0,0,0.5);">${SUPPORT_EMAIL}</a>.<br/>
          &copy; 2026 Sentinel-AI Workforce
        </p>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}

// SHA-256 hash of the code, salted with the caller's email and a server-side
// pepper so stored hashes can't be brute-forced or replayed across addresses.
export async function hashCode(code: string, email: string, pepper: string): Promise<string> {
  const data = new TextEncoder().encode(`${code}:${email.toLowerCase()}:${pepper}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Cryptographically strong six-digit code (100000–999999).
export function generateCode(): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(100000 + (buf[0] % 900000))
}

// Constant-time string comparison to avoid timing attacks on the hash check.
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}
