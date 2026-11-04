import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } })
}

export async function GET(request: Request) {
  const apiUrl = process.env.DEVICE_DASHBOARD_API_URL
  const apiKey = process.env.DEVICE_DASHBOARD_API_KEY
  const allowedOrganizationId = process.env.DEVICE_DASHBOARD_ORGANIZATION_ID
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!apiUrl || !apiKey || !allowedOrganizationId) return errorResponse("Device dashboard API is not fully configured.", 503)
  if (!supabaseUrl || !supabaseAnonKey) return errorResponse("Authentication service is not configured.", 503)

  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return errorResponse("Sign in is required.", 401)

  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseAnonKey, Authorization: authorization },
      cache: "no-store",
    })
    if (!userResponse.ok) return errorResponse("Sign in is required.", 401)

    const user = (await userResponse.json()) as { id?: string }
    if (!user.id) return errorResponse("Sign in is required.", 401)

    const profileUrl = new URL("/rest/v1/profiles", supabaseUrl)
    profileUrl.searchParams.set("select", "role,organization_id")
    profileUrl.searchParams.set("id", `eq.${user.id}`)
    profileUrl.searchParams.set("limit", "1")
    const profileResponse = await fetch(profileUrl, {
      headers: { apikey: supabaseAnonKey, Authorization: authorization },
      cache: "no-store",
    })
    if (!profileResponse.ok) return errorResponse("Could not verify workspace access.", 403)

    const profiles = (await profileResponse.json()) as { role?: string; organization_id?: string }[]
    if (!profiles.some((profile) =>
      profile.organization_id === allowedOrganizationId && (profile.role === "owner" || profile.role === "manager")
    )) {
      return errorResponse("Only owners and managers can access device dashboard data.", 403)
    }

    const endpoint = new URL(apiUrl)
    if (endpoint.protocol !== "https:") return errorResponse("Device dashboard URL must use HTTPS.", 500)

    const upstream = await fetch(endpoint, {
      headers: { "x-api-key": apiKey, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })
    if (!upstream.ok) return errorResponse(`Device dashboard returned ${upstream.status}.`, 502)

    const data: unknown = await upstream.json()
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return errorResponse("Device dashboard could not be reached.", 502)
  }
}