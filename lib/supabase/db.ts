"use client"

import { supabase } from "./client"
import type { Role } from "@/components/app/nav-config"

// ─── Types ──────────────────────────────────────────────────────────────────
export type Profile = {
  id: string
  organization_id: string | null
  email: string
  role: Role
  first_name: string | null
  last_name: string | null
  phone: string | null
  language: string | null
}

export type Site = {
  id: string
  name: string
  location: string | null
  timezone: string | null
  created_at: string
}

export type EmployeeRow = {
  id: string
  full_name: string | null
  email: string | null
  invited_role: Role
  status: "active" | "inactive"
  role_title: string | null
  site_id: string | null
  user_id: string | null
  created_at: string
  site?: { name: string | null } | null
}

export type ShiftRow = {
  id: string
  name: string
  start_time: string
  end_time: string
  break_duration: number | null
  site_id: string | null
  site?: { name: string | null } | null
}

export type DeviceRow = {
  id: string
  device_id: string
  connection_status: "connected" | "disconnected" | "syncing"
  battery_level: number | null
  last_sync_time: string | null
  employee_id: string | null
  site_id: string | null
  employee?: { full_name: string | null } | null
}

export type AttendanceRow = {
  id: string
  employee_id: string
  date: string
  clock_in_time: string | null
  clock_out_time: string | null
  status: string
  hours_worked: number
  regular_hours: number
  overtime_hours: number
  late_minutes: number
  correction_requested: boolean
  employee?: { full_name: string | null; email: string | null } | null
}

export type FatigueAlertRow = {
  id: string
  alert_type: string
  risk_level: "low" | "moderate" | "high"
  message: string | null
  severity: "info" | "warning" | "critical"
  acknowledged: boolean
  created_at: string
  employee?: { full_name: string | null } | null
}

export type AuditRow = {
  id: string
  action: string
  target_type: string | null
  target_name: string | null
  created_at: string
  actor?: { first_name: string | null; last_name: string | null; email: string | null } | null
}

// ─── Auth / profile ─────────────────────────────────────────────────────────
export async function getProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("profiles")
    .select("id, organization_id, email, role, first_name, last_name, phone, language")
    .eq("id", user.id)
    .single()
  return (data as Profile) ?? null
}

// Resolve any pending employee invite for this user, then return the profile.
export async function bootstrapSession(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  await supabase.rpc("claim_invite")
  return getProfile()
}

export async function signOut() {
  await supabase.auth.signOut()
}

async function requireOrg(): Promise<string> {
  const profile = await getProfile()
  if (!profile?.organization_id) throw new Error("No organization is linked to this account yet.")
  return profile.organization_id
}

// ─── Organization ─────────────────────────────────────────────────────────
export type Organization = {
  id: string
  name: string
  industry: string | null
  currency: string | null
  country: string | null
  timezone: string | null
}

export async function getOrganization(): Promise<Organization | null> {
  const orgId = await requireOrg().catch(() => null)
  if (!orgId) return null
  const { data } = await supabase
    .from("organizations")
    .select("id, name, industry, currency, country, timezone")
    .eq("id", orgId)
    .single()
  return (data as Organization) ?? null
}

export async function updateOrganization(input: { name?: string; currency?: string; country?: string }) {
  const orgId = await requireOrg()
  const patch: Record<string, string> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.currency !== undefined) patch.currency = input.currency
  if (input.country !== undefined) patch.country = input.country
  const { error } = await supabase.from("organizations").update(patch).eq("id", orgId)
  if (error) throw error
}

// ─── Sites ──────────────────────────────────────────────────────────────────
export async function listSites(): Promise<Site[]> {
  const { data } = await supabase.from("sites").select("id, name, location, timezone, created_at").order("name")
  return (data as Site[]) ?? []
}

export async function createSite(input: { name: string; location?: string; timezone?: string }) {
  const organization_id = await requireOrg()
  const { data, error } = await supabase
    .from("sites")
    .insert({ organization_id, name: input.name, location: input.location || null, timezone: input.timezone || "Africa/Johannesburg" })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Employees ──────────────────────────────────────────────────────────────
export async function listEmployees(): Promise<EmployeeRow[]> {
  const { data } = await supabase
    .from("employees")
    .select("id, full_name, email, invited_role, status, role_title, site_id, user_id, created_at, site:sites(name)")
    .order("created_at", { ascending: false })
  return (data as unknown as EmployeeRow[]) ?? []
}

export async function createEmployee(input: {
  full_name: string
  email: string
  invited_role: Role
  site_id?: string | null
}) {
  const organization_id = await requireOrg()
  const { data, error } = await supabase
    .from("employees")
    .insert({
      organization_id,
      full_name: input.full_name,
      email: input.email,
      invited_role: input.invited_role,
      role_title: input.invited_role === "manager" ? "Manager" : "Employee",
      site_id: input.site_id || null,
    })
    .select()
    .single()
  if (error) throw error
  // Send the branded welcome email; don't fail the whole operation if delivery hiccups.
  try {
    await supabase.functions.invoke("send-invite", { body: { employee_id: data.id } })
  } catch {
    /* email is best-effort */
  }
  return data
}

export async function resendInvite(employeeId: string) {
  const { data, error } = await supabase.functions.invoke("send-invite", { body: { employee_id: employeeId } })
  if (error) throw new Error(error.message || "Could not send the invite email.")
  return data
}

export async function deleteEmployee(employeeId: string) {
  const { error } = await supabase.from("employees").delete().eq("id", employeeId)
  if (error) throw error
}

// ─── Shifts ─────────────────────────────────────────────────────────────────
export async function listShifts(): Promise<ShiftRow[]> {
  const { data } = await supabase
    .from("shifts")
    .select("id, name, start_time, end_time, break_duration, site_id, site:sites(name)")
    .order("start_time")
  return (data as unknown as ShiftRow[]) ?? []
}

export async function createShift(input: {
  name: string
  start_time: string
  end_time: string
  site_id?: string | null
  break_duration?: number
}) {
  const organization_id = await requireOrg()
  const { data, error } = await supabase
    .from("shifts")
    .insert({
      organization_id,
      name: input.name,
      start_time: input.start_time,
      end_time: input.end_time,
      site_id: input.site_id || null,
      break_duration: input.break_duration ?? 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Devices ────────────────────────────────────────────────────────────────
export async function listDevices(): Promise<DeviceRow[]> {
  const { data } = await supabase
    .from("devices")
    .select("id, device_id, connection_status, battery_level, last_sync_time, employee_id, site_id, employee:employees(full_name)")
    .order("created_at", { ascending: false })
  return (data as unknown as DeviceRow[]) ?? []
}

export async function createDevice(input: { device_id: string; employee_id?: string | null; site_id?: string | null }) {
  const organization_id = await requireOrg()
  const { data, error } = await supabase
    .from("devices")
    .insert({
      organization_id,
      device_id: input.device_id,
      employee_id: input.employee_id || null,
      site_id: input.site_id || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Employee self record ───────────────────────────────────────────────────
export async function getMyEmployee(): Promise<EmployeeRow | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("employees")
    .select("id, full_name, email, invited_role, status, role_title, site_id, user_id, organization_id, created_at")
    .eq("user_id", user.id)
    .maybeSingle()
  return (data as unknown as EmployeeRow) ?? null
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function getTodayAttendance(): Promise<AttendanceRow | null> {
  const emp = await getMyEmployee()
  if (!emp) return null
  const { data } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", emp.id)
    .eq("date", today())
    .maybeSingle()
  return (data as AttendanceRow) ?? null
}

export async function clockIn(): Promise<AttendanceRow> {
  const emp = (await getMyEmployee()) as (EmployeeRow & { organization_id: string; site_id: string | null }) | null
  if (!emp) throw new Error("No employee record is linked to this account yet.")
  const { data, error } = await supabase
    .from("attendance_records")
    .upsert(
      {
        organization_id: (emp as unknown as { organization_id: string }).organization_id,
        employee_id: emp.id,
        site_id: emp.site_id || null,
        date: today(),
        clock_in_time: new Date().toISOString(),
        status: "present",
      },
      { onConflict: "employee_id,date" },
    )
    .select()
    .single()
  if (error) throw error
  return data as AttendanceRow
}

export async function clockOut(): Promise<AttendanceRow> {
  const rec = await getTodayAttendance()
  if (!rec || !rec.clock_in_time) throw new Error("You need to clock in first.")
  const out = new Date()
  const inn = new Date(rec.clock_in_time)
  const hours = Math.max(0, (out.getTime() - inn.getTime()) / 3_600_000)
  const regular = Math.min(hours, 8)
  const overtime = Math.max(0, hours - 8)
  const { data, error } = await supabase
    .from("attendance_records")
    .update({
      clock_out_time: out.toISOString(),
      hours_worked: Number(hours.toFixed(2)),
      regular_hours: Number(regular.toFixed(2)),
      overtime_hours: Number(overtime.toFixed(2)),
    })
    .eq("id", rec.id)
    .select()
    .single()
  if (error) throw error
  return data as AttendanceRow
}

export async function listMyAttendance(limit = 30): Promise<AttendanceRow[]> {
  const emp = await getMyEmployee()
  if (!emp) return []
  const { data } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", emp.id)
    .order("date", { ascending: false })
    .limit(limit)
  return (data as AttendanceRow[]) ?? []
}

export async function listOrgAttendance(limit = 100): Promise<AttendanceRow[]> {
  const { data } = await supabase
    .from("attendance_records")
    .select("*, employee:employees(full_name,email)")
    .order("date", { ascending: false })
    .limit(limit)
  return (data as unknown as AttendanceRow[]) ?? []
}

// ─── Corrections ────────────────────────────────────────────────────────────
export async function listMyCorrections() {
  const emp = await getMyEmployee()
  if (!emp) return []
  const { data } = await supabase
    .from("correction_requests")
    .select("id, issue_type, requested_change, reason, status, created_at")
    .eq("employee_id", emp.id)
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function submitCorrection(input: {
  attendance_id: string
  issue_type: string
  requested_change: string
  reason: string
}) {
  const emp = (await getMyEmployee()) as (EmployeeRow & { organization_id: string }) | null
  if (!emp) throw new Error("No employee record is linked to this account yet.")
  const { error } = await supabase.from("correction_requests").insert({
    organization_id: (emp as unknown as { organization_id: string }).organization_id,
    attendance_id: input.attendance_id,
    employee_id: emp.id,
    issue_type: input.issue_type,
    requested_change: input.requested_change,
    reason: input.reason,
  })
  if (error) throw error
  await supabase.from("attendance_records").update({ correction_requested: true }).eq("id", input.attendance_id)
}

// ─── Profile update ─────────────────────────────────────────────────────────
export async function updateMyProfile(input: { first_name?: string; last_name?: string; phone?: string; language?: string }) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not signed in.")
  const { error } = await supabase.from("profiles").update(input).eq("id", user.id)
  if (error) throw error
}

// ─── Alerts ─────────────────────────────────────────────────────────────────
export async function listFatigueAlerts(): Promise<FatigueAlertRow[]> {
  const { data } = await supabase
    .from("fatigue_alerts")
    .select("id, alert_type, risk_level, message, severity, acknowledged, created_at, employee:employees(full_name)")
    .order("created_at", { ascending: false })
    .limit(100)
  return (data as unknown as FatigueAlertRow[]) ?? []
}

export async function listMyAlerts(): Promise<FatigueAlertRow[]> {
  const emp = await getMyEmployee()
  if (!emp) return []
  const { data } = await supabase
    .from("fatigue_alerts")
    .select("id, alert_type, risk_level, message, severity, acknowledged, created_at")
    .eq("employee_id", emp.id)
    .order("created_at", { ascending: false })
  return (data as unknown as FatigueAlertRow[]) ?? []
}

// ─── Audit logs ─────────────────────────────────────────────────────────────
export async function listAuditLogs(): Promise<AuditRow[]> {
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, target_type, target_name, created_at, actor:profiles(first_name,last_name,email)")
    .order("created_at", { ascending: false })
    .limit(100)
  return (data as unknown as AuditRow[]) ?? []
}

// ─── Aggregate helpers ──────────────────────────────────────────────────────
async function count(table: string, build?: (q: any) => any): Promise<number> {
  let q = supabase.from(table).select("*", { count: "exact", head: true })
  if (build) q = build(q)
  const { count: c } = await q
  return c ?? 0
}

export async function ownerMetrics() {
  const [employees, managers, sites] = await Promise.all([
    count("employees"),
    count("employees", (q) => q.eq("invited_role", "manager")),
    count("sites"),
  ])
  const { data: todays } = await supabase
    .from("attendance_records")
    .select("hours_worked, clock_in_time, clock_out_time")
    .eq("date", today())
  const rows = todays ?? []
  const activeNow = rows.filter((r: any) => r.clock_in_time && !r.clock_out_time).length
  const hoursWorked = rows.reduce((s: number, r: any) => s + Number(r.hours_worked || 0), 0)
  const fatigueAlerts = await count("fatigue_alerts", (q) => q.eq("acknowledged", false))
  return { employees, managers, sites, activeNow, hoursWorked, fatigueAlerts }
}

export type AnalyticsData = {
  hoursTrend: { date: string; label: string; hours: number }[]
  activityTrend: { date: string; label: string; present: number }[]
  riskDistribution: { name: string; value: number }[]
  hoursBySite: { site: string; hours: number }[]
}

// Aggregates the last 7 days of attendance plus fatigue risk for the analytics
// dashboard and the dashboard trend chart.
export async function analyticsData(): Promise<AnalyticsData> {
  const days: { date: string; label: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000)
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString([], { weekday: "short" }),
    })
  }
  const since = days[0].date

  const [attRes, alertRes, sites] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("date, hours_worked, clock_in_time, site_id")
      .gte("date", since),
    supabase.from("fatigue_alerts").select("risk_level"),
    listSites(),
  ])

  const att = (attRes.data ?? []) as { date: string; hours_worked: number | null; clock_in_time: string | null; site_id: string | null }[]
  const alerts = (alertRes.data ?? []) as { risk_level: string }[]

  const hoursByDate = new Map<string, number>()
  const presentByDate = new Map<string, number>()
  const hoursBySiteId = new Map<string, number>()
  for (const r of att) {
    hoursByDate.set(r.date, (hoursByDate.get(r.date) ?? 0) + Number(r.hours_worked || 0))
    if (r.clock_in_time) presentByDate.set(r.date, (presentByDate.get(r.date) ?? 0) + 1)
    if (r.site_id) hoursBySiteId.set(r.site_id, (hoursBySiteId.get(r.site_id) ?? 0) + Number(r.hours_worked || 0))
  }

  const riskCounts = { low: 0, moderate: 0, high: 0 } as Record<string, number>
  for (const a of alerts) if (a.risk_level in riskCounts) riskCounts[a.risk_level] += 1

  return {
    hoursTrend: days.map((d) => ({ ...d, hours: Number((hoursByDate.get(d.date) ?? 0).toFixed(1)) })),
    activityTrend: days.map((d) => ({ ...d, present: presentByDate.get(d.date) ?? 0 })),
    riskDistribution: [
      { name: "Low", value: riskCounts.low },
      { name: "Moderate", value: riskCounts.moderate },
      { name: "High", value: riskCounts.high },
    ],
    hoursBySite: sites.map((s) => ({ site: s.name, hours: Number((hoursBySiteId.get(s.id) ?? 0).toFixed(1)) })),
  }
}

export async function managerMetrics() {
  const { data: todays } = await supabase
    .from("attendance_records")
    .select("hours_worked, clock_in_time, clock_out_time, late_minutes, status")
    .eq("date", today())
  const rows = todays ?? []
  const onShift = rows.filter((r: any) => r.clock_in_time).length
  const working = rows.filter((r: any) => r.clock_in_time && !r.clock_out_time).length
  const late = rows.filter((r: any) => (r.late_minutes || 0) > 0 || r.status === "late").length
  const hoursWorked = rows.reduce((s: number, r: any) => s + Number(r.hours_worked || 0), 0)
  const [moderate, high] = await Promise.all([
    count("fatigue_alerts", (q) => q.eq("acknowledged", false).eq("risk_level", "moderate")),
    count("fatigue_alerts", (q) => q.eq("acknowledged", false).eq("risk_level", "high")),
  ])
  return { onShift, working, late, hoursWorked, moderate, high }
}

// Sum hours over a date range for the current employee.
export async function myHoursSummary() {
  const emp = await getMyEmployee()
  if (!emp) return { today: 0, week: 0, month: 0 }
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const { data } = await supabase
    .from("attendance_records")
    .select("date, hours_worked")
    .eq("employee_id", emp.id)
    .gte("date", startOfMonth.toISOString().slice(0, 10))
  const rows = data ?? []
  const t = today()
  const wk = startOfWeek.toISOString().slice(0, 10)
  const sum = (pred: (d: string) => boolean) =>
    rows.filter((r: any) => pred(r.date)).reduce((s: number, r: any) => s + Number(r.hours_worked || 0), 0)
  return {
    today: sum((d) => d === t),
    week: sum((d) => d >= wk),
    month: rows.reduce((s: number, r: any) => s + Number(r.hours_worked || 0), 0),
  }
}

// ─── Onboarding ─────────────────────────────────────────────────────────────
export type OnboardingPayload = {
  company: { name: string; industry?: string; country?: string }
  site: { name: string; location?: string; timezone?: string }
  managers: { name: string; email: string }[]
  employees: { name: string; role_title?: string; email?: string }[]
  shifts: { name: string; start_time: string; end_time: string }[]
  device?: { device_id: string }
}

export async function saveOnboarding(payload: OnboardingPayload) {
  const profile = await getProfile()
  if (!profile) throw new Error("Not signed in.")

  // Create or update the organization, then link it to the owner profile.
  let organization_id = profile.organization_id
  if (organization_id) {
    await supabase
      .from("organizations")
      .update({
        name: payload.company.name,
        industry: payload.company.industry || null,
        country: payload.company.country || "South Africa",
      })
      .eq("id", organization_id)
  } else {
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: payload.company.name,
        industry: payload.company.industry || null,
        country: payload.company.country || "South Africa",
      })
      .select("id")
      .single()
    if (error) throw error
    organization_id = data.id
    await supabase.from("profiles").update({ organization_id, role: "owner" }).eq("id", profile.id)
  }

  // Site
  let site_id: string | null = null
  if (payload.site.name.trim()) {
    const { data } = await supabase
      .from("sites")
      .insert({
        organization_id,
        name: payload.site.name,
        location: payload.site.location || null,
        timezone: payload.site.timezone || "Africa/Johannesburg",
      })
      .select("id")
      .single()
    site_id = data?.id ?? null
  }

  // Managers + employees as invite rows
  const people = [
    ...payload.managers.filter((m) => m.email?.trim()).map((m) => ({ full_name: m.name, email: m.email, invited_role: "manager" as Role, role_title: "Manager" })),
    ...payload.employees.filter((e) => e.email?.trim()).map((e) => ({ full_name: e.name, email: e.email as string, invited_role: "employee" as Role, role_title: e.role_title || "Employee" })),
  ]
  if (people.length) {
    await supabase.from("employees").insert(people.map((p) => ({ ...p, organization_id, site_id })))
  }

  // Shifts
  const shifts = payload.shifts.filter((s) => s.name.trim() && s.start_time && s.end_time)
  if (shifts.length) {
    await supabase.from("shifts").insert(shifts.map((s) => ({ organization_id, site_id, name: s.name, start_time: s.start_time, end_time: s.end_time })))
  }

  // Device
  if (payload.device?.device_id?.trim()) {
    await supabase.from("devices").insert({ organization_id, site_id, device_id: payload.device.device_id })
  }

  return { organization_id }
}

// ─── Company applications (public intake) ────────────────────────────────────
export type ApplicationType = "join" | "acquire"
export type ApplicationStatus = "new" | "reviewing" | "contacted" | "approved" | "rejected"

export type ApplicationRow = {
  id: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  industry: string | null
  country: string | null
  company_size: string | null
  website: string | null
  application_type: ApplicationType
  message: string | null
  status: ApplicationStatus
  created_at: string
}

export type ApplicationInput = {
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone?: string
  industry?: string
  country?: string
  company_size?: string
  website?: string
  application_type: ApplicationType
  message?: string
}

export async function submitApplication(input: ApplicationInput) {
  const { error } = await supabase.from("company_applications").insert({
    company_name: input.company_name.trim(),
    contact_name: input.contact_name.trim(),
    contact_email: input.contact_email.trim().toLowerCase(),
    contact_phone: input.contact_phone?.trim() || null,
    industry: input.industry?.trim() || null,
    country: input.country?.trim() || null,
    company_size: input.company_size?.trim() || null,
    website: input.website?.trim() || null,
    application_type: input.application_type,
    message: input.message?.trim() || null,
  })
  if (error) throw error
}

export async function listApplications(): Promise<ApplicationRow[]> {
  const { data } = await supabase
    .from("company_applications")
    .select("*")
    .order("created_at", { ascending: false })
  return (data as unknown as ApplicationRow[]) ?? []
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  const { error } = await supabase.from("company_applications").update({ status }).eq("id", id)
  if (error) throw error
}

// ─── Realtime ───────────────────────────────────────────────────────────────
export function subscribeTable(table: string, onChange: () => void) {
  const channel = supabase
    .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table }, () => onChange())
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
