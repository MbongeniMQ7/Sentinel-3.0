"use client"

import { useEffect, useState } from "react"
import { Activity, Clock, ShieldAlert, Users, Wallet } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { PageHeader, MetricCard, SectionCard, DataTable, EmptyState, RiskBadge, Badge } from "./primitives"
import { Input, Select, Button } from "./controls"
import { loadWorkforce } from "@/lib/supabase/workforce"
import { subscribeTable } from "@/lib/supabase/db"
import { workforcePeriod, workforceSummary, type WorkforceData } from "@/lib/workforce"

const COLORS = { low: "#22c55e", moderate: "#f59e0b", high: "#ef4444" }
const TITLES = { hours: "Working Hours", earnings: "Estimated Earnings", activity: "Activity Patterns", fatigue: "Fatigue Monitoring" }

export function WorkforceScreen({ mode, personal = false }: { mode: keyof typeof TITLES; personal?: boolean }) {
  const [period, setPeriod] = useState(workforcePeriod)
  const [employee, setEmployee] = useState("")
  const [site, setSite] = useState("")
  const [shift, setShift] = useState("")
  const [data, setData] = useState<WorkforceData | null>(null)
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  const validPeriod = !!period.start && !!period.end && period.start <= period.end
    && new Date(period.end).getTime() - new Date(period.start).getTime() <= 366 * 86400000

  useEffect(() => {
    if (!validPeriod) return
    let active = true
    const load = async () => {
      try {
        const result = await loadWorkforce(period.start, period.end, personal)
        if (active) { setData(result); setError("") }
      } catch (error) {
        if (active) { setError(error instanceof Error ? error.message : "Could not load workforce records."); setData(null) }
      }
    }
    void load()
    const subscriptions = ["attendance_records", "pay_rates", "fatigue_assessments", "employees"].map(table => subscribeTable(table, load))
    return () => { active = false; subscriptions.forEach(unsubscribe => unsubscribe()) }
  }, [period.start, period.end, personal, validPeriod, retry])

  const summary = data && validPeriod ? workforceSummary(data, { ...period, employee, site, shift }) : null
  const money = (amount: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: data?.currency || "ZAR" }).format(amount)
  const hours = (amount: number) => `${amount.toFixed(1)}h`
  const accent = personal ? "#059669" : "#0284c7"

  return <>
    <PageHeader title={personal ? `My ${mode === "activity" ? "Activity" : mode === "fatigue" ? "Fatigue" : mode === "earnings" ? "Estimated Earnings" : "Hours"}` : TITLES[mode]} description={`${period.start} to ${period.end}. ${personal ? "Your records only." : "Workforce records."}`} />
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-xs text-slate-600">From<Input aria-label="From date" type="date" value={period.start} onChange={event => { setData(null); setPeriod({ ...period, start: event.target.value }) }} /></label>
      <label className="text-xs text-slate-600">To<Input aria-label="To date" type="date" value={period.end} onChange={event => { setData(null); setPeriod({ ...period, end: event.target.value }) }} /></label>
      {!personal && <label className="text-xs text-slate-600">Employee<Select aria-label="Employee" value={employee} onChange={event => setEmployee(event.target.value)}><option value="">All employees</option>{data?.employees.map(worker => <option key={worker.id} value={worker.id}>{worker.full_name || "Unnamed employee"}</option>)}</Select></label>}
      <label className="text-xs text-slate-600">Site<Select aria-label="Site" value={site} onChange={event => setSite(event.target.value)}><option value="">All sites</option>{data?.sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}</Select></label>
      {(mode === "hours" || mode === "earnings") && <label className="text-xs text-slate-600">Shift<Select aria-label="Shift" value={shift} onChange={event => setShift(event.target.value)}><option value="">All shifts</option>{data?.shifts.map(shift => <option key={shift.id} value={shift.id}>{shift.name}</option>)}</Select></label>}
    </div>
    {!validPeriod ? <p role="alert">Choose a valid date range of up to one year.</p> : error ? <div role="alert" className="space-y-3 text-sm text-red-700"><p>{error}</p><Button onClick={() => setRetry(retry + 1)}>Retry</Button></div> : !summary ? <p role="status">Loading workforce records...</p> : <>
      {summary.sample && <p role="status" className="mb-4 border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900">Includes sample attendance, pay rates or fatigue history. Not verified payroll or medical data.</p>}
      {mode === "earnings" && summary.totals.missingRates > 0 && <p role="status" className="mb-4 text-sm text-amber-800">{summary.totals.missingRates} attendance records have no applicable pay rate. Those earnings are excluded.</p>}
      <div className={`grid gap-3 sm:grid-cols-2 ${mode === "fatigue" ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        {mode === "fatigue" ? <>
          {summary.risk.map(risk => <MetricCard key={risk.name} label={`${risk.name} risk`} value={risk.value} icon={ShieldAlert} hint="Employees, latest assessment" />)}
          <MetricCard label="Monitored" value={summary.latest.size} icon={Users} />
        </> : mode === "earnings" ? <>
          <MetricCard label="Regular Earnings" value={money(summary.totals.regularPay)} icon={Wallet} />
          <MetricCard label="Overtime Earnings" value={money(summary.totals.overtimePay)} icon={Wallet} />
          <MetricCard label="Estimated Total" value={money(summary.totals.totalPay)} icon={Wallet} />
        </> : <>
          <MetricCard label="Regular Hours" value={hours(summary.totals.regular)} icon={Clock} />
          <MetricCard label="Overtime" value={hours(summary.totals.overtime)} icon={Clock} />
          <MetricCard label="Total Hours" value={hours(summary.totals.hours)} icon={Clock} />
        </>}
      </div>

      {mode === "fatigue" ? <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Risk Distribution" description="Latest assessment per employee in the selected period">
          <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={summary.risk.filter(risk => risk.value > 0)} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>{summary.risk.filter(risk => risk.value > 0).map(risk => <Cell key={risk.name} fill={COLORS[risk.name]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
        </SectionCard>
        <SectionCard title="Risk Trend" description="Daily mean of each employee's last assessment">
          <ResponsiveContainer width="100%" height={260}><LineChart data={summary.fatigueTrend}><CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} width={35} /><Tooltip /><Line type="monotone" dataKey="score" name="Fatigue score" stroke={accent} strokeWidth={2} connectNulls={false} /></LineChart></ResponsiveContainer>
        </SectionCard>
      </div> : <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title={mode === "earnings" ? "Estimated Earnings Over Time" : "Hours Over Time"}>
          <ResponsiveContainer width="100%" height={260}><AreaChart data={summary.daily} margin={{ left: 0, right: 12 }}><CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis width={55} /><Tooltip /><Area type="monotone" dataKey={mode === "earnings" ? "pay" : "hours"} name={mode === "earnings" ? `Estimated pay (${data?.currency})` : "Hours"} stroke={accent} fill={accent} fillOpacity={0.15} strokeWidth={2} /></AreaChart></ResponsiveContainer>
        </SectionCard>
        <SectionCard title={mode === "activity" ? "Attendance Patterns" : "Regular vs Overtime"}>
          <ResponsiveContainer width="100%" height={260}><BarChart data={summary.daily}><CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis width={35} /><Tooltip /><Legend /><Bar dataKey={mode === "activity" ? "present" : "regular"} name={mode === "activity" ? "Present (including late)" : "Regular hours"} fill={accent} /><Bar dataKey={mode === "activity" ? "late" : "overtime"} name={mode === "activity" ? "Late arrivals" : "Overtime hours"} fill="#f59e0b" /></BarChart></ResponsiveContainer>
        </SectionCard>
        {mode === "activity" && <>
          <SectionCard title="Team Patterns" description="Hours per employee"><ResponsiveContainer width="100%" height={Math.max(260, summary.workers.length * 38)}><BarChart data={summary.workers} layout="vertical"><XAxis type="number" /><YAxis type="category" dataKey="full_name" width={110} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="hours" name="Hours" fill={accent} /></BarChart></ResponsiveContainer></SectionCard>
          <SectionCard title="Site Patterns" description="Hours by work location"><ResponsiveContainer width="100%" height={260}><BarChart data={summary.sites}><XAxis dataKey="site" tick={{ fontSize: 11 }} /><YAxis width={45} /><Tooltip /><Bar dataKey="hours" name="Hours" fill="#059669" /></BarChart></ResponsiveContainer></SectionCard>
        </>}
      </div>}

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">{mode === "activity" ? "Workforce Activity" : mode === "fatigue" ? "Employee Risk Assessments" : "Employee Breakdown"}</h2>
        <DataTable columns={mode === "activity" ? ["Date", "Present", "Late", "Hours"] : mode === "fatigue" ? ["Employee", "Risk", "Score", "Assessed", "Source"] : ["Employee", "Regular", "Overtime", "Total Hours", "Estimated Pay", "Source"]}
          empty={<EmptyState icon={Activity} title="No matching records." />}
          rows={mode === "activity" ? summary.daily.map(day => <tr key={day.date} className="border-b border-slate-100"><td className="px-4 py-3">{day.label}</td><td className="px-4 py-3">{day.present}</td><td className="px-4 py-3">{day.late}</td><td className="px-4 py-3">{hours(day.hours)}</td></tr>) : summary.workers.length ? summary.workers.map(worker => {
            const assessment = summary.latest.get(worker.id)
            return <tr key={worker.id} className="border-b border-slate-100"><td className="px-4 py-3">{worker.full_name || "Unnamed employee"}</td>{mode === "fatigue" ? <>
              <td className="px-4 py-3">{assessment ? <RiskBadge level={assessment.risk_level} /> : "Not assessed"}</td><td className="px-4 py-3">{assessment?.fatigue_score ?? "-"}</td><td className="px-4 py-3">{assessment ? new Date(assessment.assessed_at).toLocaleString() : "-"}</td><td className="px-4 py-3"><Badge tone={assessment?.is_sample ? "amber" : "slate"}>{assessment ? assessment.is_sample ? "Sample" : "Recorded" : "-"}</Badge></td>
            </> : <><td className="px-4 py-3">{hours(worker.regular)}</td><td className="px-4 py-3">{hours(worker.overtime)}</td><td className="px-4 py-3">{hours(worker.hours)}</td><td className="px-4 py-3">{money(worker.totalPay)}{worker.missingRates > 0 && " (partial)"}</td><td className="px-4 py-3"><Badge tone={worker.sample ? "amber" : "slate"}>{worker.sample ? "Includes samples" : "Recorded"}</Badge></td></>}</tr>
          }) : undefined} />
      </div>
    </>}
  </>
}