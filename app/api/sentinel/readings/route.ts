import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { SentinelReading } from "@/lib/sentinel"

export const dynamic = "force-dynamic"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

export async function GET(request: Request) {
  const accessToken = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase authentication is not configured." }, { status: 503 })
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser(accessToken)
  if (authError || !user) {
    return NextResponse.json({ error: "Your session is invalid or expired." }, { status: 401 })
  }

  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .maybeSingle()
  if (profileError) {
    console.error("Could not verify Sentinel dashboard access:", profileError.message)
    return NextResponse.json({ error: "Could not verify your account permissions." }, { status: 502 })
  }
  if (!profile || !["manager", "owner", "employee"].includes(profile.role ?? "")) {
    return NextResponse.json({ error: "Workspace access is required." }, { status: 403 })
  }

  let devicesQuery = userClient
    .from("devices")
    .select("device_id")
    .eq("organization_id", profile.organization_id)

  if (profile.role === "employee") {
    const { data: employee, error: employeeError } = await userClient
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", profile.organization_id)
      .maybeSingle()
    if (employeeError) {
      console.error("Could not verify the employee's registered watch:", employeeError.message)
      return NextResponse.json({ error: "Could not verify your assigned watch." }, { status: 502 })
    }
    if (!employee) return NextResponse.json({ readings: {} }, { headers: { "Cache-Control": "no-store, max-age=0" } })
    devicesQuery = devicesQuery.eq("employee_id", employee.id)
  }

  const { data: devices, error: devicesError } = await devicesQuery
  if (devicesError) {
    console.error("Could not load organization devices for Sentinel readings:", devicesError.message)
    return NextResponse.json({ error: "Could not load your registered devices." }, { status: 502 })
  }

  const allowedDeviceIds = new Set((devices ?? []).map((device) => device.device_id.toLowerCase()))
  const dashboardUrl = process.env.SENTINEL_DASHBOARD_API_URL ?? process.env.DEVICE_DASHBOARD_API_URL
  const dashboardApiKey = process.env.SENTINEL_DASHBOARD_API_KEY ?? process.env.DEVICE_DASHBOARD_API_KEY
  if (!dashboardUrl || !dashboardApiKey) {
    return NextResponse.json({ error: "Sentinel dashboard API is not configured on the server." }, { status: 503 })
  }

  let upstreamResponse: Response
  try {
    upstreamResponse = await fetch(dashboardUrl, {
      headers: { "X-API-Key": dashboardApiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    console.error("Could not reach the Sentinel dashboard API:", error)
    return NextResponse.json({ error: "Could not reach the Sentinel dashboard API." }, { status: 502 })
  }

  if (!upstreamResponse.ok) {
    console.error(`Sentinel dashboard API returned HTTP ${upstreamResponse.status}.`)
    return NextResponse.json({ error: "Sentinel dashboard API request failed." }, { status: 502 })
  }

  let upstreamData: unknown
  try {
    upstreamData = await upstreamResponse.json()
  } catch (error) {
    console.error("Sentinel dashboard API returned invalid JSON:", error)
    return NextResponse.json({ error: "Sentinel dashboard API returned invalid data." }, { status: 502 })
  }
  if (!isRecord(upstreamData)) {
    return NextResponse.json({ error: "Sentinel dashboard API returned an unexpected response." }, { status: 502 })
  }

  const readings: Record<string, SentinelReading> = {}
  for (const [deviceId, value] of Object.entries(upstreamData)) {
    if (!allowedDeviceIds.has(deviceId.toLowerCase()) || !isRecord(value)) continue
    const rawData = isRecord(value.raw_data) ? value.raw_data : null
    readings[deviceId] = {
      status: optionalString(value.status),
      score: optionalNumber(value.score),
      bpm: optionalNumber(value.bpm),
      temp: optionalNumber(value.temp),
      rmssd: optionalNumber(rawData?.rmssd ?? value.rmssd),
      base_rmssd: optionalNumber(rawData?.base_rmssd ?? value.base_rmssd),
      calibration: optionalNumber(value.calibration),
      updated_at: optionalNumber(value.updated_at),
    }
  }

  return NextResponse.json(
    { readings },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  )
}
