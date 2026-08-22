"use client"

import { useEffect, useMemo, useState } from "react"
import { BellOff, Search } from "lucide-react"
import { PageHeader, SectionCard, EmptyState, RiskBadge, Badge } from "@/components/app/primitives"
import { Input, Select } from "@/components/app/controls"
import { listFatigueAlerts, subscribeTable, type FatigueAlertRow } from "@/lib/supabase/db"

export default function ManagerAlertsPage() {
  const [query, setQuery] = useState("")
  const [severity, setSeverity] = useState("")
  const [alerts, setAlerts] = useState<FatigueAlertRow[]>([])

  useEffect(() => {
    const load = () => listFatigueAlerts().then(setAlerts).catch(() => setAlerts([]))
    load()
    return subscribeTable("fatigue_alerts", load)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return alerts.filter((a) => {
      if (q && !`${a.message ?? ""} ${a.employee?.full_name ?? ""} ${a.alert_type}`.toLowerCase().includes(q)) return false
      if (severity && a.severity !== severity) return false
      return true
    })
  }, [alerts, query, severity])

  return (
    <>
      <PageHeader title="Alerts" description="Fatigue, attendance and device alerts across your workforce." />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="pl-9" />
        </div>
        <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </Select>
      </div>

      <SectionCard title="Active Alerts">
        {filtered.length === 0 ? (
          <EmptyState icon={BellOff} title="No active alerts." description="You're all caught up. New alerts will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{a.message || a.alert_type}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {a.employee?.full_name ? `${a.employee.full_name} · ` : ""}
                    {new Date(a.created_at).toLocaleString()}
                  </p>
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
