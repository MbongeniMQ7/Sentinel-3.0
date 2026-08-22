"use client"

import { useEffect, useState } from "react"
import { BellOff } from "lucide-react"
import { SectionCard, EmptyState, RiskBadge } from "@/components/app/primitives"
import { listMyAlerts, type FatigueAlertRow } from "@/lib/supabase/db"

export default function EmployeeAlertsPage() {
  const [alerts, setAlerts] = useState<FatigueAlertRow[]>([])

  useEffect(() => {
    listMyAlerts().then(setAlerts).catch(() => setAlerts([]))
  }, [])

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Alerts</h1>
        <p className="mt-1 text-sm text-slate-500">Fatigue and attendance notifications for you.</p>
      </div>

      <SectionCard title="Alerts">
        {alerts.length === 0 ? (
          <EmptyState icon={BellOff} title="No alerts." description="You're all caught up. Alerts about your wellbeing will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{a.message || a.alert_type}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                <RiskBadge level={a.risk_level} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  )
}
