"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardList, BellOff, Watch, Clock } from "lucide-react"
import { SectionCard, EmptyState, RiskBadge, Badge } from "@/components/app/primitives"
import { ClockInCard } from "@/components/app/clock-in-card"
import {
  getMyEmployee,
  listDevices,
  listMyAlerts,
  listMyAttendance,
  myHoursSummary,
  type AttendanceRow,
  type DeviceRow,
  type FatigueAlertRow,
} from "@/lib/supabase/db"

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
  const [device, setDevice] = useState<DeviceRow | null>(null)

  const load = useCallback(() => {
    myHoursSummary().then(setHours).catch(() => {})
    listMyAttendance(5).then(setAttendance).catch(() => {})
    listMyAlerts().then(setAlerts).catch(() => {})
    ;(async () => {
      const emp = await getMyEmployee()
      if (!emp) return
      const devices = await listDevices()
      setDevice(devices.find((d) => d.employee_id === emp.id) ?? null)
    })().catch(() => {})
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

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Primary column */}
        <div className="grid gap-4 lg:col-span-2">
          <ClockInCard onChange={load} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Clock className="h-4 w-4 text-slate-400" /> This Month
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{fmt(hours.month)}</div>
            </div>
          </div>

          <SectionCard title="My Attendance" action={<Link href="/employee/attendance" className="text-xs font-medium text-(--brand) hover:underline">View all</Link>}>
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
        </div>

        {/* Secondary column */}
        <div className="grid gap-4">
          <SectionCard title="My Alerts" action={<Link href="/employee/alerts" className="text-xs font-medium text-(--brand) hover:underline">View all</Link>}>
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

          <SectionCard title="My Device" action={<Link href="/employee/device" className="text-xs font-medium text-(--brand) hover:underline">Manage</Link>}>
            {device ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Watch className="h-5 w-5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{device.device_id}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <Badge tone={device.connection_status === "connected" ? "green" : device.connection_status === "syncing" ? "amber" : "slate"}>
                      {device.connection_status}
                    </Badge>
                    <span>{device.battery_level ?? "—"}% battery</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={Watch} title="No wristband connected." description="Connect a wristband to track your wellbeing." />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
