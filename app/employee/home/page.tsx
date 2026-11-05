"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ClipboardList,
  BellOff,
  Watch,
  HeartPulse,
  Activity,
  Thermometer,
  Gauge,
  Bell,
  BadgeCheck,
  Wrench,
  UserRound,
  ArrowRight,
} from "lucide-react"
import { SectionCard, EmptyState, RiskBadge, Badge, LoadErrorState } from "@/components/app/primitives"
import { ClockInCard } from "@/components/app/clock-in-card"
import { FadeIn } from "@/components/app/motion"
import { RevealText } from "@/components/reveal-text"
import { getMyLiveWatchReading, type LiveWatchReading } from "@/lib/supabase/device-dashboard"
import {
  getMyEmployee,
  listDevices,
  listMyAlerts,
  subscribeTable,
  type DeviceRow,
  type FatigueAlertRow,
} from "@/lib/supabase/db"

function greeting(name: string | null) {
  const h = new Date().getHours()
  const salutation = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
  const firstName = name?.trim().split(/\s+/)[0]
  return firstName ? `${salutation}, ${firstName}` : salutation
}

// Employee quick links, mirroring the manager privilege pills.
const QUICK_LINKS = [
  { label: "My attendance", icon: ClipboardList, href: "/employee/attendance" },
  { label: "Past alerts", icon: Bell, href: "/employee/alerts" },
  { label: "My device", icon: Watch, href: "/employee/device" },
  { label: "Corrections", icon: Wrench, href: "/employee/corrections" },
]

export default function EmployeeHomePage() {
  const [alerts, setAlerts] = useState<FatigueAlertRow[]>([])
  const [employeeName, setEmployeeName] = useState<string | null>(null)
  const [device, setDevice] = useState<DeviceRow | null>(null)
  const [watchReading, setWatchReading] = useState<LiveWatchReading | null>(null)
  const [watchError, setWatchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(() => {
    void Promise.all([listMyAlerts(), getMyEmployee()])
      .then(async ([nextAlerts, employee]) => {
        const devices = employee ? await listDevices() : []
        const nextDevice = devices.find((d) => d.employee_id === employee?.id) ?? null
        setAlerts(nextAlerts)
        setEmployeeName(employee?.full_name ?? null)
        setDevice(nextDevice)
        if (!nextDevice) {
          setWatchReading(null)
          setWatchError(null)
        }
        setLoadError(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void load()
    const alertsSubscription = subscribeTable("fatigue_alerts", load)
    const devicesSubscription = subscribeTable("devices", load)
    return () => {
      alertsSubscription()
      devicesSubscription()
    }
  }, [load])

  const deviceId = device?.device_id

  useEffect(() => {
    if (!deviceId) return
    const assignedDeviceId = deviceId
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    async function refreshWatch() {
      try {
        const reading = await getMyLiveWatchReading(assignedDeviceId)
        if (active) {
          setWatchReading(reading)
          setWatchError(null)
        }
      } catch (error) {
        if (active) setWatchError(error instanceof Error ? error.message : "Live watch data is unavailable.")
      } finally {
        if (active) timer = setTimeout(refreshWatch, 3000)
      }
    }

    void refreshWatch()
    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [deviceId])

  const metrics = [
    { label: "Heart rate", value: watchReading?.heartRate ?? null, unit: " bpm", icon: HeartPulse },
    { label: "RMSSD (HRV)", value: watchReading?.rmssd ?? null, unit: " ms", icon: Activity },
    { label: "Temperature", value: watchReading?.temperature ?? null, unit: " °C", icon: Thermometer },
    { label: "Device score", value: watchReading?.score ?? null, unit: "", icon: Gauge },
  ]

  if (loading) return <p role="status" className="py-16 text-center text-sm text-slate-500">Loading your dashboard…</p>
  if (loadError) return <LoadErrorState message={loadError} onRetry={() => { setLoading(true); load() }} />

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl border border-sky-900/30 bg-linear-to-br from-[#0f2a4a] via-[#075985] to-[#0284c7] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-300/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-sky-50 ring-1 ring-inset ring-white/20">
                  <BadgeCheck className="h-3.5 w-3.5" /> Employee workspace
                </span>
                <RevealText as="h1" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {greeting(employeeName)}
                </RevealText>
                <p className="mt-1.5 max-w-xl text-sm text-sky-50/80">
                  Your assigned watch, wellbeing alerts, and shift activity in one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href="/employee/attendance">
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-4 text-sm font-medium text-[#075985] transition-colors hover:bg-sky-50">
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
                    className="group inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-sky-50 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20"
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
            <div className="group h-full rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{tile.label}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700 transition-colors group-hover:bg-sky-100">
                  <tile.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {tile.value == null ? "—" : `${tile.value}${tile.unit}`}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
      {watchError ? (
        <p role="status" className="mt-3 text-sm text-amber-700">Live watch data is unavailable: {watchError}</p>
      ) : !device ? (
        <p role="status" className="mt-3 text-sm text-slate-500">No watch is assigned to your account.</p>
      ) : !watchReading ? (
        <p role="status" className="mt-3 text-sm text-slate-500">Waiting for a reading from your assigned watch.</p>
      ) : watchReading.status ? (
        <p role="status" className="mt-3 text-sm text-slate-500">Watch status: {watchReading.status}</p>
      ) : null}

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Primary column */}
        <div className="grid content-start gap-4 lg:col-span-2">
          <FadeIn delay={40}>
            <ClockInCard onChange={load} />
          </FadeIn>

          <FadeIn delay={120}>
            <SectionCard
              title="Past Alerts"
              description="Recent fatigue and attendance alerts for you."
              action={
                <Link href="/employee/alerts" className="text-xs font-medium text-(--brand) hover:underline">
                  View all
                </Link>
              }
            >
              {alerts.length === 0 ? (
                <EmptyState icon={BellOff} title="No past alerts." description="Fatigue and attendance alerts will appear here when available." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {alerts.slice(0, 6).map((alert) => (
                    <li key={alert.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{alert.message || alert.alert_type}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{new Date(alert.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <RiskBadge level={alert.risk_level} />
                        <Badge tone={alert.acknowledged ? "slate" : "amber"}>
                          {alert.acknowledged ? "Acknowledged" : "Open"}
                        </Badge>
                      </div>
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
              title="Alerts"
              action={
                <Link href="/employee/alerts" className="text-xs font-medium text-(--brand) hover:underline">
                  View all
                </Link>
              }
            >
              <p className="text-sm text-slate-600">{alerts.filter((alert) => !alert.acknowledged).length} open alerts</p>
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
                    <Watch className="h-5 w-5 text-sky-700" />
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
