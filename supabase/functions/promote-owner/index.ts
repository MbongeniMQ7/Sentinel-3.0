// promote-owner — upgrades a manager to owner. Requires a valid JWT: only an
// authenticated owner of the same organization as the target employee may do
// this. Updates the employee + linked profile role and sends a branded email.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0"
import { corsHeaders, json } from "../_shared/cors.ts"
import { renderPromotionEmail } from "../_shared/email.ts"

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

  // Caller must be an owner; capture their organization.
  const { data: caller, error: callerErr } = await admin
    .from("profiles")
    .select("organization_id, role")
    .eq("id", userData.user.id)
    .single()
  if (callerErr || !caller?.organization_id) return json({ ok: false, error: "unauthorized" }, 403)
  if (caller.role !== "owner") return json({ ok: false, error: "Only owners can promote to owner." }, 403)

  // Load the target employee and make sure they belong to the caller's organization.
  const { data: employee, error: empErr } = await admin
    .from("employees")
    .select("id, full_name, email, invited_role, organization_id, user_id")
    .eq("id", employeeId)
    .single()
  if (empErr || !employee) return json({ ok: false, error: "employee not found" }, 404)
  if (employee.organization_id !== caller.organization_id) {
    return json({ ok: false, error: "unauthorized" }, 403)
  }
  if (!employee.email) return json({ ok: false, error: "employee has no email" }, 400)
  if (employee.invited_role === "owner") {
    return json({ ok: false, error: "This person is already an owner." }, 409)
  }

  // Promote on the employees row.
  const { error: updEmpErr } = await admin
    .from("employees")
    .update({ invited_role: "owner", role_title: "Owner" })
    .eq("id", employee.id)
  if (updEmpErr) return json({ ok: false, error: "Could not update the employee." }, 500)

  // If they already have a linked login, sync their profile role immediately so
  // privileges take effect on their next request. (Otherwise claim_invite will
  // pick up the owner role when they first sign in.)
  if (employee.user_id) {
    const { error: updProfErr } = await admin
      .from("profiles")
      .update({ role: "owner" })
      .eq("id", employee.user_id)
    if (updProfErr) return json({ ok: false, error: "Could not update the profile role." }, 500)
  }

  // Organization name for the email.
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", employee.organization_id)
    .single()
  const organizationName = org?.name ?? "your organization"
  const loginUrl = `${SITE_URL.replace(/\/$/, "")}/login`

  const html = renderPromotionEmail({
    fullName: employee.full_name ?? "",
    organizationName,
    loginUrl,
  })

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: FROM,
      to: [employee.email],
      subject: "You're now an Owner on Sentinel-AI",
      html,
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    console.error("resend error", detail)
    // The promotion succeeded; report email failure separately so the UI can note it.
    return json({ ok: true, emailed: false })
  }

  return json({ ok: true, emailed: true })
})
