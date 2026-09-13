// device-simulator — emulates a fleet of Sentinel wristbands while real
// hardware is not yet purchased. Invoked on a schedule (pg_cron → pg_net):
//   1. Auto-provisions a wristband for every active employee without one.
//   2. Ticks each device: battery drain/recharge, connection status, last sync.
//   3. Emits realistic biometric readings (HR, HRV, skin temp, movement)
//      following a circadian curve with per-device variation.
//   4. Derives fatigue assessments from the readings + hours worked today,
//      raising throttled fatigue alerts when risk climbs.
//   5. Logs device_sync activity events and prunes old simulated rows.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0"
import { corsHeaders, json } from "../_shared/cors.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// Deterministic per-device randomness so each band has its own "personality".
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

function rand(): number {
  return Math.random()
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

// Circadian intensity 0..1 — low overnight, ramps through a work day.
function circadian(hour: number): number {
  if (hour < 5) return 0.12
  if (hour < 8) return 0.35
  if (hour < 12) return 0.85
  if (hour < 14) return 0.65 // lunch dip
  if (hour < 17) return 0.9
  if (hour < 21) return 0.5
  return 0.2
}

type Device = {
  id: string
  organization_id: string
  device_id: string
  site_id: string | null
  employee_id: string | null
  battery_level: number | null
  connection_status: string | null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405)

  const now = new Date()
  // Africa/Johannesburg is UTC+2 (no DST) — matches the app default timezone.
  const localHour = (now.getUTCHours() + 2) % 24 + now.getUTCMinutes() / 60

  // ── 1. Auto-provision wristbands for active employees without one ─────────
  const { data: employees } = await admin
    .from("employees")
    .select("id, organization_id, site_id, status")
    .eq("status", "active")

  const { data: existing } = await admin
    .from("devices")
    .select("id, organization_id, device_id, site_id, employee_id, battery_level, connection_status")

  const devices: Device[] = (existing as Device[]) ?? []
  const assigned = new Set(devices.map((d) => d.employee_id).filter(Boolean))
  let maxSerial = devices.reduce((m, d) => {
    const n = Number(d.device_id.replace(/\D/g, ""))
    return Number.isFinite(n) ? Math.max(m, n) : m
  }, 0)

  const provision = (employees ?? [])
    .filter((e) => !assigned.has(e.id))
    .map((e) => ({
      organization_id: e.organization_id,
      device_id: `SNTL-${String(++maxSerial).padStart(4, "0")}`,
      employee_id: e.id,
      site_id: e.site_id,
      connection_status: "connected",
      battery_level: 60 + Math.floor(rand() * 40),
      last_sync_time: now.toISOString(),
    }))

  if (provision.length) {
    const { data: created } = await admin.from("devices").insert(provision).select(
      "id, organization_id, device_id, site_id, employee_id, battery_level, connection_status",
    )
    devices.push(...((created as Device[]) ?? []))
  }

  // Hours worked today per employee (feeds the fatigue model).
  const today = now.toISOString().slice(0, 10)
  const { data: attendance } = await admin
    .from("attendance_records")
    .select("employee_id, clock_in_time, clock_out_time, hours_worked")
    .eq("date", today)
  const hoursByEmployee = new Map<string, number>()
  for (const a of attendance ?? []) {
    let h = Number(a.hours_worked || 0)
    if (a.clock_in_time && !a.clock_out_time) {
      h = Math.max(h, (now.getTime() - new Date(a.clock_in_time).getTime()) / 3_600_000)
    }
    hoursByEmployee.set(a.employee_id, h)
  }

  // Recent unacknowledged alerts — used to throttle new ones (max 1 / 2h / employee).
  const twoHoursAgo = new Date(now.getTime() - 2 * 3_600_000).toISOString()
  const { data: recentAlerts } = await admin
    .from("fatigue_alerts")
    .select("employee_id")
    .eq("acknowledged", false)
    .gte("created_at", twoHoursAgo)
  const recentlyAlerted = new Set((recentAlerts ?? []).map((a) => a.employee_id))

  const readings: Record<string, unknown>[] = []
  const assessments: Record<string, unknown>[] = []
  const alerts: Record<string, unknown>[] = []
  const activity: Record<string, unknown>[] = []
  let updated = 0

  for (const d of devices) {
    const persona = hash(d.device_id) // 0..1, stable per device

    // ── 2. Device tick: battery, connection, sync ────────────────────────────
    let battery = d.battery_level ?? 80
    battery = battery <= 5 ? 95 + Math.floor(rand() * 6) : clamp(battery - (rand() < 0.6 ? 1 : 0), 0, 100)

    const roll = rand()
    const connection = roll < 0.04 ? "disconnected" : roll < 0.12 ? "syncing" : "connected"

    await admin
      .from("devices")
      .update({
        battery_level: battery,
        connection_status: connection,
        last_sync_time: connection === "disconnected" ? undefined : now.toISOString(),
      })
      .eq("id", d.id)
    updated++

    if (connection === "disconnected" || !d.employee_id) continue

    // ── 3. Biometrics: circadian base + workload + persona + noise ───────────
    const intensity = circadian(localHour)
    const worked = hoursByEmployee.get(d.employee_id) ?? 0
    const strain = clamp(worked / 10, 0, 1) // long day → higher strain

    const heartRate = Math.round(
      58 + persona * 10 + intensity * 38 + strain * 12 + (rand() - 0.5) * 8,
    )
    const hrv = Math.round(clamp(72 - intensity * 22 - strain * 20 + persona * 12 + (rand() - 0.5) * 10, 18, 95))
    const skinTemp = Number((36.1 + intensity * 0.7 + strain * 0.4 + (rand() - 0.5) * 0.3).toFixed(1))
    const movement = intensity > 0.7 ? "high" : intensity > 0.3 ? "moderate" : "low"
    const activityScore = Math.round(clamp(intensity * 80 + (rand() - 0.5) * 20, 0, 100))

    readings.push({
      organization_id: d.organization_id,
      device_id: d.id,
      employee_id: d.employee_id,
      site_id: d.site_id,
      reading_time: now.toISOString(),
      heart_rate: heartRate,
      hrv,
      skin_temperature: skinTemp,
      movement,
      activity_score: activityScore,
    })

    // ── 4. Fatigue model: strain + poor recovery signals ─────────────────────
    const fatigueScore = Number(
      clamp(
        strain * 55 + (heartRate > 100 ? 15 : heartRate > 88 ? 8 : 0) + (hrv < 35 ? 18 : hrv < 50 ? 9 : 0) +
          (skinTemp > 37.2 ? 8 : 0) + rand() * 6,
        2,
        98,
      ).toFixed(2),
    )
    const risk = fatigueScore >= 70 ? "high" : fatigueScore >= 40 ? "moderate" : "low"

    assessments.push({
      organization_id: d.organization_id,
      employee_id: d.employee_id,
      site_id: d.site_id,
      assessed_at: now.toISOString(),
      risk_level: risk,
      fatigue_score: fatigueScore,
      heart_rate_avg: heartRate,
      hrv_avg: hrv,
      temperature_avg: skinTemp,
      movement_pattern: movement,
      factors: [
        worked > 8 ? "extended_shift" : null,
        hrv < 40 ? "low_hrv" : null,
        heartRate > 95 ? "elevated_heart_rate" : null,
        skinTemp > 37.2 ? "heat_exposure" : null,
      ].filter(Boolean),
    })

    if (risk !== "low" && !recentlyAlerted.has(d.employee_id) && rand() < (risk === "high" ? 0.9 : 0.25)) {
      const heat = skinTemp > 37.2
      alerts.push({
        organization_id: d.organization_id,
        employee_id: d.employee_id,
        site_id: d.site_id,
        alert_type: heat ? "heat_stress" : worked > 9.5 ? "overtime_threshold" : "fatigue_risk",
        risk_level: risk,
        severity: risk === "high" ? "critical" : "warning",
        message: heat
          ? `Skin temperature at ${skinTemp}°C with HR ${heartRate} bpm — possible heat stress.`
          : worked > 9.5
            ? `${worked.toFixed(1)}h on shift — overtime fatigue threshold reached (score ${Math.round(fatigueScore)}).`
            : `Fatigue score ${Math.round(fatigueScore)} — HR ${heartRate} bpm with HRV ${hrv} ms trending ${risk === "high" ? "critically" : "moderately"} high.`,
      })
      recentlyAlerted.add(d.employee_id)
    }

    // Occasional visible sync event in the activity feed.
    if (rand() < 0.15) {
      activity.push({
        organization_id: d.organization_id,
        employee_id: d.employee_id,
        site_id: d.site_id,
        event_type: "device_sync",
        event_time: now.toISOString(),
        metadata: { device_id: d.device_id, battery_level: battery },
      })
    }
  }

  if (readings.length) await admin.from("biometric_readings").insert(readings)
  if (assessments.length) await admin.from("fatigue_assessments").insert(assessments)
  if (alerts.length) await admin.from("fatigue_alerts").insert(alerts)
  if (activity.length) await admin.from("activity_logs").insert(activity)

  // ── 5. Prune simulated history so tables stay lean ─────────────────────────
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString()
  await admin.from("biometric_readings").delete().lt("reading_time", weekAgo)
  await admin.from("fatigue_assessments").delete().lt("assessed_at", monthAgo)

  return json({
    ok: true,
    devices: updated,
    provisioned: provision.length,
    readings: readings.length,
    assessments: assessments.length,
    alerts: alerts.length,
  })
})
