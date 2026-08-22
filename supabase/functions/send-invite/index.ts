// send-invite — sends the branded welcome email when an admin adds a manager
// or employee. Requires a valid JWT: only an authenticated owner/manager of the
// same organization as the invited employee may trigger a send.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0"
import { corsHeaders, json } from "../_shared/cors.ts"
import { renderInviteEmail } from "../_shared/email.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") as string
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string
const SITE_URL = (Deno.env.get("SITE_URL") as string) ?? "https://sentinel-30.vercel.app"

const FROM = "Sentinel-AI <no-reply@sentinelai-software.co.za>"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405)

  const authHeader = req.headers.get("Authorization") ?? ""
  if (!authHeader.startsWith("Bearer ")) return json({ ok: false, error: "unauthorized" }, 401)

  // Resolve the caller from their JWT.
  const authed = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })
  const { data: userData, error: userErr } = await authed.auth.getUser()
  if (userErr || !userData.user) return json({ ok: false, error: "unauthorized" }, 401)

  let employeeId = ""
  try {
    const body = await req.json()
    employeeId = String(body.employee_id ?? "").trim()
  } catch {
    return json({ ok: false, error: "invalid request" }, 400)
  }
  if (!employeeId) return json({ ok: false, error: "employee_id is required" }, 400)

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  // Caller must be an owner/manager; confirm and capture their organization.
  const { data: caller, error: callerErr } = await admin
    .from("profiles")
    .select("organization_id, role")
    .eq("id", userData.user.id)
    .single()
  if (callerErr || !caller?.organization_id) return json({ ok: false, error: "unauthorized" }, 403)
  if (caller.role !== "owner" && caller.role !== "manager") {
    return json({ ok: false, error: "unauthorized" }, 403)
  }

  // Load the employee and make sure they belong to the caller's organization.
  const { data: employee, error: empErr } = await admin
    .from("employees")
    .select("full_name, email, invited_role, organization_id, site:sites(name)")
    .eq("id", employeeId)
    .single()
  if (empErr || !employee) return json({ ok: false, error: "employee not found" }, 404)
  if (employee.organization_id !== caller.organization_id) {
    return json({ ok: false, error: "unauthorized" }, 403)
  }
  if (!employee.email) return json({ ok: false, error: "employee has no email" }, 400)

  const roleLabel = employee.invited_role === "manager" ? "Manager" : "Employee"
  const siteRel = employee.site as { name: string | null } | { name: string | null }[] | null
  const siteName = (Array.isArray(siteRel) ? siteRel[0]?.name : siteRel?.name) ?? "Unassigned"
  const loginUrl = `${SITE_URL.replace(/\/$/, "")}/login`

  const html = renderInviteEmail({
    fullName: employee.full_name ?? "",
    roleLabel,
    siteName,
    loginUrl,
  })

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: FROM,
      to: [employee.email],
      subject: `You've been added to Sentinel-AI — ${siteName}`,
      html,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    console.error("resend error", detail)
    return json({ ok: false, error: "Could not send the invite email." }, 502)
  }

  return json({ ok: true })
})
