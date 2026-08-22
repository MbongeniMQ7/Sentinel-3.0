// request-otp — public edge function (verify_jwt = false).
// 1. Confirms the email was provisioned by an admin (profile or invited employee).
// 2. Generates a single-use six-digit code, stores its hash, and emails it via Resend.
// Unknown emails are rejected so unregistered people can't sign in or self-provision.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0"
import { corsHeaders, json } from "../_shared/cors.ts"
import { generateCode, hashCode, renderOtpEmail } from "../_shared/email.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string
const OTP_PEPPER = (Deno.env.get("OTP_PEPPER") as string) ?? "sentinel-otp"

const FROM = "Sentinel-AI <no-reply@sentinelai-software.co.za>"
const EXPIRY_MINUTES = 10

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405)

  let email = ""
  try {
    const body = await req.json()
    email = String(body.email ?? "").trim().toLowerCase()
  } catch {
    return json({ ok: false, error: "invalid request" }, 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Enter a valid email address." })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  // Only admin-provisioned emails may receive a code.
  const { data: registered, error: regErr } = await admin.rpc("is_registered_email", { p_email: email })
  if (regErr) return json({ ok: false, error: "Could not verify your account. Try again." }, 500)
  if (!registered) {
    return json({ ok: false, error: "This email isn't registered. Please ask your administrator to add you first." })
  }

  // Invalidate any outstanding codes for this address, then store the new one.
  await admin.from("otp_codes").update({ consumed: true }).eq("email", email).eq("consumed", false)

  const code = generateCode()
  const code_hash = await hashCode(code, email, OTP_PEPPER)
  const expires_at = new Date(Date.now() + EXPIRY_MINUTES * 60_000).toISOString()

  const { error: insertErr } = await admin.from("otp_codes").insert({ email, code_hash, expires_at })
  if (insertErr) return json({ ok: false, error: "Could not generate a code. Try again." }, 500)

  const html = renderOtpEmail(
    code,
    "Sign in to Sentinel-AI",
    "Use the one-time code below to securely sign in to your workforce operations dashboard.",
    EXPIRY_MINUTES,
  )

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: `${code} is your Sentinel-AI sign-in code`,
      html,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    console.error("resend error", detail)
    return json({ ok: false, error: "Could not send the email. Try again." }, 502)
  }

  return json({ ok: true })
})
