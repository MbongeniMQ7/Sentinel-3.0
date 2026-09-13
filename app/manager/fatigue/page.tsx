"use client"

import { useEffect, useMemo, useState } from "react"
import { ShieldAlert, Activity, TrendingUp, Users, Repeat } from "lucide-react"
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { PageHeader, MetricCard, SectionCard, EmptyState, RiskBadge } from "@/components/app/primitives"
import {
  listFatigueAlerts,
  listFatigueAssessments,
  subscribeTable,
  type FatigueAlertRow,
  type FatigueAssessmentRow,
} from "@/lib/supabase/db"

const RISK_COLORS = { low: "#22c55e", moderate: "#f59e0b", high: "#ef4444" }
const NAVY = "#0f2a4a"

export default function ManagerFatiguePage() {
  const [alerts, setAlerts] = useState<FatigueAlertRow[]>([])
  const [assessments, setAssessments] = useState<FatigueAssessmentRow[]>([])

  useEffect(() => {
    const load = () => {
      listFatigueAlerts().then(setAlerts).catch(() => setAlerts([]))
      listFatigueAssessments(7).then(setAssessments).catch(() => setAssessments([]))
    }
    load()
    const a = subscribeTable("fatigue_alerts", load)
    const b = subscribeTable("fatigue_assessments", load)
    return () => {
      a()
      b()
    }
  }, [])

  const counts = useMemo(() => {
    const active = alerts.filter((a) => !a.acknowledged)
    return {
      low: active.filter((a) => a.risk_level === "low").length,
      moderate: active.filter((a) => a.risk_level === "moderate").length,
      high: active.filter((a) => a.risk_level === "high").length,
      monitored: new Set(active.map((a) => a.employee?.full_name)).size,
    }
  }, [alerts])

  const highRisk = alerts.filter((a) => a.risk_level === "high" && !a.acknowledged)

  // Distribution = latest assessment per employee; trend = daily average score.
  const distribution = useMemo(() => {
    const latest = new Map<string, FatigueAssessmentRow>()
    for (const a of assessments) if (!latest.has(a.employee_id)) latest.set(a.employee_id, a)
    const buckets = { low: 0, moderate: 0, high: 0 }
    for (const a of latest.values()) buckets[a.risk_level]++
    return (Object.keys(buckets) as (keyof typeof buckets)[])
      .map((k) => ({ name: k, value: buckets[k] }))
      .filter((d) => d.value > 0)
  }, [assessments])

  const trend = useMemo(() => {
    const byDay = new Map<string, { sum: number; n: number }>()
    for (const a of assessments) {
      const day = a.assessed_at.slice(0, 10)
      const b = byDay.get(day) ?? { sum: 0, n: 0 }
      b.sum += Number(a.fatigue_score ?? 0)
      b.n++
      byDay.set(day, b)
    }
    return [...byDay.entries()]
      .sort(([x], [y]) => x.localeCompare(y))
      .map(([day, b]) => ({
        label: new Date(day).toLocaleDateString(undefined, { weekday: "short" }),
        score: Number((b.sum / b.n).toFixed(1)),
      }))
  }, [assessments])

  return (
    <>
      <PageHeader title="Fatigue" description="Fatigue risk signals across your workforce." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Low Risk" value={counts.low} icon={Activity} />
        <MetricCard label="Moderate Risk" value={counts.moderate} icon={ShieldAlert} />
        <MetricCard label="High Risk" value={counts.high} icon={ShieldAlert} />
        <MetricCard label="Monitored" value={counts.monitored} icon={Users} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Risk Distribution" description="Latest assessment per employee">
          {distribution.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {distribution.map((d) => (
                    <Cell key={d.name} fill={RISK_COLORS[d.name as keyof typeof RISK_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={ShieldAlert} title="No risk data yet." description="Risk levels appear once devices report activity." />
          )}
        </SectionCard>
        <SectionCard title="Risk Trend" description="Average fatigue score per day, last 7 days">
          {trend.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke={NAVY} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={TrendingUp} title="No trend data yet." description="Trends build up over time as data is collected." />
          )}
        </SectionCard>
        <SectionCard title="High Risk Employees">
          {highRisk.length === 0 ? (
            <EmptyState icon={Users} title="No high-risk employees." description="Employees flagged as high risk will be listed here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {highRisk.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate text-slate-700">{a.employee?.full_name || a.message || a.alert_type}</span>
                  <RiskBadge level={a.risk_level} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
        <SectionCard title="Persistent Patterns">
          <EmptyState icon={Repeat} title="No persistent patterns detected." description="Recurring fatigue patterns will surface here." />
        </SectionCard>
      </div>
    </>
  )
}
