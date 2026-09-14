"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import {
  ClipboardList,
  BellOff,
  Watch,
  Clock,
  Bell,
  BadgeCheck,
  Wrench,
  UserRound,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ShieldAlert,
} from "lucide-react"
import { SectionCard, EmptyState, RiskBadge, Badge } from "@/components/app/primitives"
import { ClockInCard } from "@/components/app/clock-in-card"
import { FadeIn, CountUp } from "@/components/app/motion"
import { RevealText } from "@/components/reveal-text"
import {
  getMyEmployee,
  listDevices,
  listMyAlerts,
  listMyAttendance,
  myHoursSummary,
  subscribeTable,
  type AttendanceRow,
  type DeviceRow,
  type FatigueAlertRow,
} from "@/lib/supabase/db"

const EMERALD = "#059669"

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

// Employee quick links, mirroring the manager privilege pills.
const QUICK_LINKS = [
  { label: "My attendance", icon: ClipboardList, href: "/employee/attendance" },
  { label: "My hours", icon: Clock, href: "/employee/hours" },
  { label: "My alerts", icon: Bell, href: "/employee/alerts" },
  { label: "My device", icon: Watch, href: "/employee/device" },
  { label: "Corrections", icon: Wrench, href: "/employee/corrections" },
]

export default function EmployeeHomePage() {
  const [hours, setHours] = useState({ today: 0, week: 0, month: 0 })
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [alerts, setAlerts] = useState<FatigueAlertRow[]>([])
  const [device, setDevice] = useState<DeviceRow | null>(null)

  const load = useCallback(() => {
    myHoursSummary().then(setHours).catch(() => {})
    listMyAttendance(30).then(setAttendance).catch(() => {})
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
    const a = subscribeTable("attendance_records", load)
    const b = subscribeTable("fatigue_alerts", load)
    return () => {
      a()
      b()
    }
  }, [load])

  const openAlerts = alerts.filter((a) => !a.acknowledged)

  const hoursChart = useMemo(() => {
    const days: { label: string; hours: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000)
      const date = d.toISOString().slice(0, 10)
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        hours: Number(
          attendance
            .filter((a) => a.date === date)
            .reduce((s, a) => s + Number(a.hours_worked || 0), 0)
            .toFixed(2),
        ),
      })
    }
    return days
  }, [attendance])

  const hasHours = hoursChart.some((d) => d.hours > 0)

  const metrics = [
    { label: "Hours Today", value: hours.today, icon: Clock, decimals: 1, suffix: "h" },
    { label: "This Week", value: hours.week, icon: CalendarDays, decimals: 1, suffix: "h" },
    { label: "This Month", value: hours.month, icon: BarChart3, decimals: 1, suffix: "h" },
    { label: "Open Alerts", value: openAlerts.length, icon: ShieldAlert, decimals: 0, suffix: "" },
  ]

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-900/30 bg-linear-to-br from-[#065f46] via-[#047857] to-[#059669] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-teal-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-50 ring-1 ring-inset ring-white/20">
                  <BadgeCheck className="h-3.5 w-3.5" /> Employee workspace
                </span>
                <RevealText as="h1" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {greeting()}
                </RevealText>
                <p className="mt-1.5 max-w-xl text-sm text-emerald-50/80">
                  Your shift at a glance — track your hours, attendance, wellbeing alerts and wristband from one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href="/employee/attendance">
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-4 text-sm font-medium text-[#065f46] transition-colors hover:bg-emerald-50">
                    <ClipboardList className="h-4 w-4" /> My Attendance
                  </button>
                </Link>
                <Link href="/employee/profile">
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-4 text-sm font-medium text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/20">
                    <UserRound className="h-4 w-4" /> My Profile
                  </button>
                </Link>
              </div>
            </div>

            {/* Quick-link pills */}
            <div className="flex flex-wrap gap-2">
              {QUICK_LINKS.map((p, i) => (
                <FadeIn key={p.label} delay={120 + i * 60} y={8}>
                  <Link
                    href={p.href}
                    className="group inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20"
                  >
                    <p.icon className="h-3.5 w-3.5" />
                    {p.label}
                    <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── Metric tiles ────────────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((tile, i) => (
          <FadeIn key={tile.label} delay={i * 70} y={14}>
            <div className="group h-full rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{tile.label}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <tile.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                <CountUp value={tile.value} decimals={tile.decimals} suffix={tile.suffix} />
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Primary column */}
        <div className="grid content-start gap-4 lg:col-span-2">
          <FadeIn delay={40}>
            <ClockInCard onChange={load} />
          </FadeIn>

          <FadeIn delay={80}>
            <SectionCard title="My Hours" description="Hours you worked over the last 7 days">
              {hasHours ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={hoursChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="empHomeHoursFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={EMERALD} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="hours" stroke={EMERALD} strokeWidth={2} fill="url(#empHomeHoursFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={BarChart3} title="No hours recorded yet." description="Your trend appears once you work shifts." />
              )}
            </SectionCard>
          </FadeIn>

          <FadeIn delay={120}>
            <SectionCard
              title="Recent Attendance"
              action={
                <Link href="/employee/attendance" className="text-xs font-medium text-(--brand) hover:underline">
                  View all
                </Link>
              }
            >
              {attendance.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No attendance records yet." description="Your clock-in history will appear here." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {attendance.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="font-medium text-slate-700">{new Date(a.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-2">
                        <Badge tone={a.status === "present" ? "green" : a.status === "late" ? "amber" : "slate"}>{a.status}</Badge>
                        <span className="text-slate-500">
                          {a.hours_worked ? fmt(Number(a.hours_worked)) : a.clock_in_time ? "In progress" : "—"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </FadeIn>
        </div>

        {/* Secondary column */}
        <div className="grid content-start gap-4">
          <FadeIn delay={60}>
            <SectionCard
              title="My Alerts"
              action={
                <Link href="/employee/alerts" className="text-xs font-medium text-(--brand) hover:underline">
                  View all
                </Link>
              }
            >
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
          </FadeIn>

          <FadeIn delay={100}>
            <SectionCard
              title="My Device"
              action={
                <Link href="/employee/device" className="text-xs font-medium text-(--brand) hover:underline">
                  Manage
                </Link>
              }
            >
              {device ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                    <Watch className="h-5 w-5 text-emerald-600" />
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
          </FadeIn>
        </div>
      </div>
    </>
  )
}
