"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Watch, Battery, Wifi, HeartPulse, Activity, Thermometer, Footprints } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { PageHeader, SectionCard, EmptyState, Badge } from "@/components/app/primitives"
import { FadeIn } from "@/components/app/motion"
import {
  getMyEmployee,
  listDevices,
  listMyBiometrics,
  subscribeTable,
  type BiometricRow,
  type DeviceRow,
} from "@/lib/supabase/db"
import { useLiveVitals, useNow, timeAgo } from "@/hooks/use-live-vitals"

const EMERALD = "#059669"

function LivePulse() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      LIVE
    </span>
  )
}

function VitalCard({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof HeartPulse
  label: string
  value: string | number
  unit?: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4 text-slate-400" /> {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold text-slate-900">
        {value}
        {unit ? <span className="ml-1 text-xs font-medium text-slate-400">{unit}</span> : null}
      </div>
    </div>
  )
}

export default function EmployeeDevicePage() {
  const [device, setDevice] = useState<DeviceRow | null>(null)
  const [readings, setReadings] = useState<BiometricRow[]>([])

  const load = useCallback(() => {
    ;(async () => {
      const emp = await getMyEmployee()
      if (!emp) return
      const devices = await listDevices()
      setDevice(devices.find((d) => d.employee_id === emp.id) ?? null)
      setReadings(await listMyBiometrics(24))
    })().catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const a = subscribeTable("devices", load)
    const b = subscribeTable("biometric_readings", load)
    return () => {
      a()
      b()
    }
  }, [load])

  const latest = readings[0] ?? null
  const live = useLiveVitals(latest)
  const now = useNow(1000)
  const streaming = device?.connection_status === "connected"

  const hrTrend = useMemo(
    () =>
      [...readings]
        .reverse()
        .map((r) => ({
          label: new Date(r.reading_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          hr: r.heart_rate,
          hrv: r.hrv,
        })),
    [readings],
  )

  return (
    <>
      <PageHeader title="My Device" description="Your wristband and its live biometric signals." />

      <div className="grid gap-4">
      <FadeIn>
      <SectionCard title="Wristband">
        {device ? (
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                <Watch className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{device.device_id}</p>
                <Badge tone={device.connection_status === "connected" ? "green" : device.connection_status === "syncing" ? "amber" : "slate"}>
                  {device.connection_status}
                </Badge>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <Battery className="h-4 w-4 text-slate-400" /> Battery
                </div>
                <div className="mt-1.5 text-lg font-semibold text-slate-900">{device.battery_level ?? "—"}%</div>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <Wifi className="h-4 w-4 text-slate-400" /> Last Sync
                </div>
                <div className="mt-1.5 text-sm font-medium text-slate-700">{timeAgo(device.last_sync_time, now)}</div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Watch}
            title="No wristband connected."
            description="A wristband will be assigned to you automatically once provisioning completes."
          />
        )}
      </SectionCard>
      </FadeIn>

      {device && (
        <FadeIn delay={60}>
        <SectionCard
          title="Live Vitals"
          description={latest ? `Streaming • last sync ${timeAgo(latest.reading_time, now)}` : undefined}
          action={streaming && latest ? <LivePulse /> : undefined}
        >
          {latest ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <VitalCard icon={HeartPulse} label="Heart Rate" value={live.heart_rate ?? latest.heart_rate ?? "—"} unit="bpm" />
              <VitalCard icon={Activity} label="HRV" value={live.hrv ?? latest.hrv ?? "—"} unit="ms" />
              <VitalCard icon={Thermometer} label="Skin Temp" value={live.skin_temperature ?? latest.skin_temperature ?? "—"} unit="°C" />
              <VitalCard icon={Footprints} label="Movement" value={latest.movement ?? "—"} />
            </div>
          ) : (
            <EmptyState
              icon={HeartPulse}
              title="Waiting for first reading."
              description="Vitals appear here as soon as your wristband syncs."
            />
          )}
        </SectionCard>
        </FadeIn>
      )}

      {device && readings.length > 1 && (
        <FadeIn delay={100}>
        <SectionCard title="Heart Rate Trend" description="Recent readings from your wristband">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hrTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="hr" name="HR (bpm)" stroke={EMERALD} strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="hrv" name="HRV (ms)" stroke="#94a3b8" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
        </FadeIn>
      )}

      {device && readings.length > 1 && (
        <FadeIn delay={140}>
        <SectionCard title="Recent Readings" description="Your latest wristband syncs.">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">HR</th>
                  <th className="px-3 py-2 font-medium">HRV</th>
                  <th className="px-3 py-2 font-medium">Temp</th>
                  <th className="px-3 py-2 font-medium">Movement</th>
                  <th className="px-3 py-2 font-medium">Activity</th>
                </tr>
              </thead>
              <tbody>
                {readings.slice(0, 10).map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-3 py-2 text-slate-600">{new Date(r.reading_time).toLocaleTimeString()}</td>
                    <td className="px-3 py-2 font-medium text-slate-700">{r.heart_rate ?? "—"} bpm</td>
                    <td className="px-3 py-2 text-slate-600">{r.hrv ?? "—"} ms</td>
                    <td className="px-3 py-2 text-slate-600">{r.skin_temperature ?? "—"}°C</td>
                    <td className="px-3 py-2 text-slate-600 capitalize">{r.movement ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{r.activity_score ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
        </FadeIn>
      )}
      </div>
    </>
  )
}
