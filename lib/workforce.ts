export type WorkforceEmployee = { id: string; full_name: string | null; site_id: string | null }
export type WorkforceAttendance = {
  id: string; employee_id: string; site_id: string | null; shift_id: string | null; date: string
  hours_worked: number; regular_hours: number; overtime_hours: number; status: string; is_sample: boolean
}
export type WorkforceRate = {
  employee_id: string | null; site_id: string | null; rate_per_hour: number; overtime_multiplier: number
  effective_date: string; end_date: string | null; is_sample: boolean
}
export type WorkforceAssessment = {
  employee_id: string; assessed_at: string; risk_level: "low" | "moderate" | "high"; fatigue_score: number | null; is_sample: boolean
}
export type WorkforceData = {
  employees: WorkforceEmployee[]; attendance: WorkforceAttendance[]; rates: WorkforceRate[]
  assessments: WorkforceAssessment[]; sites: { id: string; name: string }[]; shifts: { id: string; name: string }[]
  currency: string
}

export function workforcePeriod() {
  const end = new Date()
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 13)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export function workforceSummary(data: WorkforceData, filters: { start: string; end: string; employee?: string; site?: string; shift?: string }) {
  const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
  const attendance = data.attendance.filter(record => record.date >= filters.start && record.date <= filters.end
    && (!filters.employee || record.employee_id === filters.employee)
    && (!filters.site || record.site_id === filters.site)
    && (!filters.shift || record.shift_id === filters.shift))
  const workers = data.employees.filter(employee => (!filters.employee || employee.id === filters.employee)
    && (!filters.site || employee.site_id === filters.site || attendance.some(record => record.employee_id === employee.id)))
    .map(employee => ({ ...employee, regular: 0, overtime: 0, hours: 0, regularPay: 0, overtimePay: 0, totalPay: 0, missingRates: 0, sample: false }))
  const byEmployee = new Map(workers.map(worker => [worker.id, worker]))
  const daily = new Map<string, { date: string; label: string; regular: number; overtime: number; hours: number; present: number; late: number; pay: number }>()
  for (const day = new Date(`${filters.start}T00:00:00Z`); day.toISOString().slice(0, 10) <= filters.end; day.setUTCDate(day.getUTCDate() + 1)) {
    const date = day.toISOString().slice(0, 10)
    daily.set(date, { date, label: day.toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" }), regular: 0, overtime: 0, hours: 0, present: 0, late: 0, pay: 0 })
  }
  const siteHours = new Map<string, number>()
  for (const record of attendance) {
    const worker = byEmployee.get(record.employee_id)
    if (!worker) continue
    const specificity = (rate: WorkforceRate) => rate.employee_id ? 2 : rate.site_id ? 1 : 0
    const rate = data.rates.filter(rate => rate.effective_date <= record.date && (!rate.end_date || rate.end_date >= record.date)
      && (rate.employee_id === record.employee_id || (!rate.employee_id && (!rate.site_id || rate.site_id === record.site_id))))
      .sort((left, right) => Number(left.is_sample) - Number(right.is_sample) || specificity(right) - specificity(left) || right.effective_date.localeCompare(left.effective_date))[0]
    const regular = Number(record.regular_hours)
    const overtime = Number(record.overtime_hours)
    const hours = Number(record.hours_worked)
    const regularPay = rate ? round(regular * Number(rate.rate_per_hour)) : 0
    const overtimePay = rate ? round(overtime * Number(rate.rate_per_hour) * Number(rate.overtime_multiplier ?? 1.5)) : 0
    worker.regular += regular
    worker.overtime += overtime
    worker.hours += hours
    worker.regularPay = round(worker.regularPay + regularPay)
    worker.overtimePay = round(worker.overtimePay + overtimePay)
    worker.totalPay = round(worker.regularPay + worker.overtimePay)
    worker.missingRates += !rate && hours > 0 ? 1 : 0
    worker.sample ||= record.is_sample || !!rate?.is_sample
    const day = daily.get(record.date)!
    day.regular += regular
    day.overtime += overtime
    day.hours += hours
    day.present += ["present", "late", "early_departure"].includes(record.status) ? 1 : 0
    day.late += record.status === "late" ? 1 : 0
    day.pay = round(day.pay + regularPay + overtimePay)
    const site = data.sites.find(site => site.id === record.site_id)?.name || "Unassigned"
    siteHours.set(site, (siteHours.get(site) || 0) + hours)
  }
  const totals = workers.reduce((total, worker) => ({
    regular: total.regular + worker.regular, overtime: total.overtime + worker.overtime, hours: total.hours + worker.hours,
    regularPay: round(total.regularPay + worker.regularPay), overtimePay: round(total.overtimePay + worker.overtimePay),
    totalPay: round(total.totalPay + worker.totalPay), missingRates: total.missingRates + worker.missingRates,
  }), { regular: 0, overtime: 0, hours: 0, regularPay: 0, overtimePay: 0, totalPay: 0, missingRates: 0 })
  const assessments = data.assessments.filter(record => byEmployee.has(record.employee_id))
  const latest = new Map<string, WorkforceAssessment>()
  for (const record of assessments) {
    if (!latest.has(record.employee_id) || record.assessed_at > latest.get(record.employee_id)!.assessed_at) latest.set(record.employee_id, record)
  }
  const risk = (["low", "moderate", "high"] as const).map(name => ({ name, value: [...latest.values()].filter(record => record.risk_level === name).length }))
  const fatigueTrend = [...daily.values()].map(day => {
    const readings = assessments.filter(record => record.assessed_at.slice(0, 10) === day.date && record.fatigue_score !== null)
    return { ...day, score: readings.length ? round(readings.reduce((sum, record) => sum + Number(record.fatigue_score), 0) / readings.length) : null }
  })
  return { workers, totals, daily: [...daily.values()], sites: [...siteHours].map(([site, hours]) => ({ site, hours })), latest, risk, fatigueTrend,
    sample: workers.some(worker => worker.sample) || assessments.some(record => record.is_sample) }
}