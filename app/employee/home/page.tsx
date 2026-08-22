"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardList, BellOff, Watch, Clock } from "lucide-react"
import { SectionCard, EmptyState, RiskBadge } from "@/components/app/primitives"
import { ClockInCard } from "@/components/app/clock-in-card"
import { listMyAlerts, listMyAttendance, myHoursSummary, type AttendanceRow, type FatigueAlertRow } from "@/lib/supabase/db"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

function fmt(h: number) {
  const totalMin = Math.round(h * 60)
  return `${Math.floor(totalMin / 60)}h ${String(totalMin % 60).padStart(2, "0")}m`
}

export default function EmployeeHomePage() {
  const [hours, setHours] = useState({ today: 0, week: 0, month: 0 })
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [alerts, setAlerts] = useState<FatigueAlertRow[]>([])

  const load = useCallback(() => {
    myHoursSummary().then(setHours).catch(() => {})
    listMyAttendance(5).then(setAttendance).catch(() => {})
    listMyAlerts().then(setAlerts).catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{greeting()}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's your shift at a glance.</p>
      </div>

      <ClockInCard onChange={load} />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Clock className="h-4 w-4 text-slate-400" /> Today
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{fmt(hours.today)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Clock className="h-4 w-4 text-slate-400" /> This Week
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{fmt(hours.week)}</div>
        </div>
      </div>

      <SectionCard title="My Attendance" action={<Link href="/employee/attendance" className="text-xs font-medium text-[#0f2a4a] hover:underline">View all</Link>}>
        {attendance.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No attendance records yet." description="Your clock-in history will appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {attendance.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-slate-700">{new Date(a.date).toLocaleDateString()}</span>
                <span className="text-slate-500">{a.hours_worked ? fmt(Number(a.hours_worked)) : a.clock_in_time ? "In progress" : "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="My Alerts" action={<Link href="/employee/alerts" className="text-xs font-medium text-[#0f2a4a] hover:underline">View all</Link>}>
        {alerts.length === 0 ? (
          <EmptyState icon={BellOff} title="No alerts." description="You have no fatigue or attendance alerts." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.slice(0, 5).map((al) => (
              <li key={al.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate text-slate-700">{al.message || al.alert_type}</span>
                <RiskBadge level={al.risk_level} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="My Device" action={<Link href="/employee/device" className="text-xs font-medium text-[#0f2a4a] hover:underline">Manage</Link>}>
        <EmptyState icon={Watch} title="No wristband connected." description="Connect a wristband to track your wellbeing." />
      </SectionCard>
    </div>
  )
}
