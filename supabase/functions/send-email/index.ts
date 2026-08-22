// Supabase "Send Email" auth hook.
// Renders the branded Sentinel-AI OTP email and delivers it through Resend.
// Configured as the project's hook_send_email_uri; called by GoTrue on every
// email that would otherwise be sent by the built-in mailer.
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string
const HOOK_SECRET = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string).replace("v1,whsec_", "")

const FROM = "Sentinel-AI <no-reply@sentinelai-software.co.za>"
const BANNER_URL = "https://sentinel-30.vercel.app/images/banners/welcome.png"
const SUPPORT_EMAIL = "support@sentinelai-software.co.za"

type EmailData = {
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: string
  site_url: string
  token_new: string
  token_hash_new: string
}

const ACTION_COPY: Record<string, { subject: (t: string) => string; heading: string; intro: string }> = {
  signup: {
    subject: (t) => `${t} is your Sentinel-AI verification code`,
    heading: "Confirm your email",
    intro: "Welcome to Sentinel-AI. Use the code below to confirm your email address and activate your workspace.",
  },
  magiclink: {
    subject: (t) => `${t} is your Sentinel-AI sign-in code`,
    heading: "Sign in to Sentinel-AI",
    intro: "Use the one-time code below to securely sign in to your workforce operations dashboard.",
  },
  email: {
    subject: (t) => `${t} is your Sentinel-AI sign-in code`,
    heading: "Sign in to Sentinel-AI",
    intro: "Use the one-time code below to securely sign in to your workforce operations dashboard.",
  },
  recovery: {
    subject: (t) => `${t} is your Sentinel-AI password reset code`,
    heading: "Reset your password",
    intro: "We received a request to reset your password. Use the code below to continue. If this wasn't you, you can safely ignore this email.",
  },
  reauthentication: {
    subject: (t) => `${t} is your Sentinel-AI verification code`,
    heading: "Verify it's you",
    intro: "Use the code below to confirm your identity and continue.",
  },
}

function copyFor(action: string) {
  return ACTION_COPY[action] ?? ACTION_COPY.magiclink
}

function renderHtml(token: string, heading: string, intro: string): string {
  const digits = token
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
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:rgba(0,0,0,0.4);text-align:center;">This code expires in 60 minutes and can only be used once.<br/>For your security, never share it with anyone.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px 36px 40px;">
        <div style="height:1px;background:rgba(0,0,0,0.07);margin-bottom:24px;"></div>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:8px;">
            <img src="https://sentinel-30.vercel.app/images/logo.png" alt="" width="20" height="20" style="display:block;border:0;" />
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

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(HOOK_SECRET)

  let user: { email: string }
  let email_data: EmailData
  try {
    const verified = wh.verify(payload, headers) as { user: { email: string }; email_data: EmailData }
    user = verified.user
    email_data = verified.email_data
  } catch (_err) {
    return new Response(JSON.stringify({ error: { http_code: 401, message: "invalid signature" } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { subject, heading, intro } = copyFor(email_data.email_action_type)
  const html = renderHtml(email_data.token, heading, intro)

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: [user.email],
      subject: subject(email_data.token),
      html,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    return new Response(JSON.stringify({ error: { http_code: res.status, message: detail } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})
