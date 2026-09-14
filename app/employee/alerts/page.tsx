"use client"

import { useEffect, useMemo, useState } from "react"
import { BellOff, Search, Bell, ShieldAlert, CheckCircle2 } from "lucide-react"
import { PageHeader, SectionCard, EmptyState, RiskBadge, Badge, MetricCard } from "@/components/app/primitives"
import { Input, Select } from "@/components/app/controls"
import { FadeIn } from "@/components/app/motion"
import { listMyAlerts, subscribeTable, type FatigueAlertRow } from "@/lib/supabase/db"

export default function EmployeeAlertsPage() {
  const [alerts, setAlerts] = useState<FatigueAlertRow[]>([])
  const [query, setQuery] = useState("")
  const [risk, setRisk] = useState("")

  useEffect(() => {
    const load = () => listMyAlerts().then(setAlerts).catch(() => setAlerts([]))
    load()
    return subscribeTable("fatigue_alerts", load)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return alerts.filter((a) => {
      if (q && !`${a.message ?? ""} ${a.alert_type}`.toLowerCase().includes(q)) return false
      if (risk && a.risk_level !== risk) return false
      return true
    })
  }, [alerts, query, risk])

  const counts = useMemo(
    () => ({
      total: alerts.length,
      high: alerts.filter((a) => a.risk_level === "high" && !a.acknowledged).length,
      open: alerts.filter((a) => !a.acknowledged).length,
      resolved: alerts.filter((a) => a.acknowledged).length,
    }),
    [alerts],
  )

  return (
    <>
      <PageHeader title="My Alerts" description="Fatigue and attendance notifications for you." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FadeIn delay={0} y={14}>
          <MetricCard label="Total" value={counts.total} icon={Bell} />
        </FadeIn>
        <FadeIn delay={70} y={14}>
          <MetricCard label="Open" value={counts.open} icon={Bell} />
        </FadeIn>
        <FadeIn delay={140} y={14}>
          <MetricCard label="High Risk" value={counts.high} icon={ShieldAlert} />
        </FadeIn>
        <FadeIn delay={210} y={14}>
          <MetricCard label="Acknowledged" value={counts.resolved} icon={CheckCircle2} />
        </FadeIn>
      </div>

      <div className="mb-4 mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="pl-9" />
        </div>
        <Select value={risk} onChange={(e) => setRisk(e.target.value)}>
          <option value="">All risk levels</option>
          <option value="low">Low</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
        </Select>
      </div>

      <SectionCard title="Alerts">
        {filtered.length === 0 ? (
          <EmptyState icon={BellOff} title="No alerts." description="You're all caught up. Alerts about your wellbeing will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{a.message || a.alert_type}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <RiskBadge level={a.risk_level} />
                  {a.acknowledged && <Badge tone="slate">Acknowledged</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </>
  )
}
