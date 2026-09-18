"use client"

import { supabase } from "./client"
import { getProfile, getMyEmployee } from "./db"
import type { WorkforceData } from "../workforce"

async function allRows(query: (start: number, end: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) {
  const rows: unknown[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await query(offset, offset + 999)
    if (error) throw new Error(error.message)
    rows.push(...(data || []))
    if (!data || data.length < 1000) return rows
  }
}

export async function loadWorkforce(start: string, end: string, personal = false): Promise<WorkforceData> {
  const profile = await getProfile()
  if (!profile?.organization_id) throw new Error("No organization is linked to this account.")
  const employee = personal || profile.role === "employee" ? await getMyEmployee() : null
  if ((personal || profile.role === "employee") && !employee) throw new Error("No employee record is linked to this account.")
  const org = profile.organization_id
  const [employees, attendance, rates, assessments, sites, shifts, organization] = await Promise.all([
    allRows((from, to) => {
      let query = supabase.from("employees").select("id, full_name, site_id").eq("organization_id", org).order("id")
      if (employee) query = query.eq("id", employee.id)
      return query.range(from, to)
    }),
    allRows((from, to) => {
      let query = supabase.from("attendance_records").select("id, employee_id, site_id, shift_id, date, hours_worked, regular_hours, overtime_hours, status, is_sample")
        .eq("organization_id", org).gte("date", start).lte("date", end).order("id")
      if (employee) query = query.eq("employee_id", employee.id)
      return query.range(from, to)
    }),
    allRows((from, to) => {
      let query = supabase.from("pay_rates").select("employee_id, site_id, rate_per_hour, overtime_multiplier, effective_date, end_date, is_sample")
        .eq("organization_id", org).lte("effective_date", end).order("id")
      if (employee) query = query.or(`employee_id.is.null,employee_id.eq.${employee.id}`)
      return query.range(from, to)
    }),
    allRows((from, to) => {
      let query = supabase.from("workforce_daily_assessments").select("employee_id, assessed_at, risk_level, fatigue_score, is_sample")
        .eq("organization_id", org).gte("assessed_at", `${start}T00:00:00Z`).lte("assessed_at", `${end}T23:59:59.999999Z`).order("assessed_at").order("employee_id")
      if (employee) query = query.eq("employee_id", employee.id)
      return query.range(from, to)
    }),
    allRows((from, to) => supabase.from("sites").select("id, name").eq("organization_id", org).order("id").range(from, to)),
    allRows((from, to) => supabase.from("shifts").select("id, name").eq("organization_id", org).order("id").range(from, to)),
    supabase.from("organizations").select("currency").eq("id", org).single(),
  ])
  if (organization.error) throw new Error(organization.error.message)
  return { employees, attendance, rates, assessments, sites, shifts, currency: organization.data.currency || "ZAR" } as WorkforceData
}