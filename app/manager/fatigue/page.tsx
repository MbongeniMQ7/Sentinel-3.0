"use client"

import { useEffect, useMemo, useState } from "react"
import { ShieldAlert, Activity, TrendingUp, Users, Repeat } from "lucide-react"
import { PageHeader, MetricCard, SectionCard, EmptyState, RiskBadge } from "@/components/app/primitives"
import { listFatigueAlerts, subscribeTable, type FatigueAlertRow } from "@/lib/supabase/db"

export default function ManagerFatiguePage() {
  const [alerts, setAlerts] = useState<FatigueAlertRow[]>([])

  useEffect(() => {
    const load = () => listFatigueAlerts().then(setAlerts).catch(() => setAlerts([]))
    load()
    return subscribeTable("fatigue_alerts", load)
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
        <SectionCard title="Risk Distribution">
          <EmptyState icon={ShieldAlert} title="No risk data yet." description="Risk levels appear once devices report activity." />
        </SectionCard>
        <SectionCard title="Risk Trend">
          <EmptyState icon={TrendingUp} title="No trend data yet." description="Trends build up over time as data is collected." />
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
