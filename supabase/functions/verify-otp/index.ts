// verify-otp — public edge function (verify_jwt = false).
// Validates the six-digit code against the stored hash. On success it ensures an
// auth user exists for the (admin-registered) email and returns a one-time
// token_hash the browser exchanges for a real session via supabase.auth.verifyOtp.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0"
import { corsHeaders, json } from "../_shared/cors.ts"
import { hashCode, timingSafeEqual } from "../_shared/email.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
const OTP_PEPPER = (Deno.env.get("OTP_PEPPER") as string) ?? "sentinel-otp"

const MAX_ATTEMPTS = 5

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405)

  let email = ""
  let code = ""
  try {
    const body = await req.json()
    email = String(body.email ?? "").trim().toLowerCase()
    code = String(body.code ?? "").trim()
  } catch {
    return json({ ok: false, error: "invalid request" }, 400)
  }

  if (!/^\d{6}$/.test(code)) return json({ ok: false, error: "Enter the 6-digit code." })

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  const { data: row } = await admin
    .from("otp_codes")
    .select("id, code_hash, expires_at, consumed, attempts")
    .eq("email", email)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!row) return json({ ok: false, error: "No active code. Request a new one." })
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await admin.from("otp_codes").update({ consumed: true }).eq("id", row.id)
    return json({ ok: false, error: "This code has expired. Request a new one." })
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await admin.from("otp_codes").update({ consumed: true }).eq("id", row.id)
    return json({ ok: false, error: "Too many attempts. Request a new code." })
  }

  const candidate = await hashCode(code, email, OTP_PEPPER)
  if (!timingSafeEqual(candidate, row.code_hash)) {
    await admin.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id)
    return json({ ok: false, error: "Incorrect code. Please try again." })
  }

  // Correct — burn the code so it can't be reused.
  await admin.from("otp_codes").update({ consumed: true }).eq("id", row.id)

  // Ensure an auth user exists (invited employees may be signing in for the first
  // time). createUser fails harmlessly if the user already exists.
  const { error: createErr } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (createErr && !/already.*registered|already been registered|exists/i.test(createErr.message)) {
    console.error("createUser error", createErr.message)
    return json({ ok: false, error: "Could not complete sign-in. Try again." }, 500)
  }

  // Generate a one-time token the client exchanges for a session.
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email })
  if (linkErr || !link?.properties?.hashed_token) {
    console.error("generateLink error", linkErr?.message)
    return json({ ok: false, error: "Could not complete sign-in. Try again." }, 500)
  }

  return json({ ok: true, token_hash: link.properties.hashed_token })
})
