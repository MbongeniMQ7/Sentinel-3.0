"use client"

import { useCallback, useEffect, useState } from "react"
import { Watch, Battery, Wifi, HeartPulse, Activity, Thermometer, Footprints } from "lucide-react"
import { SectionCard, EmptyState, Badge } from "@/components/app/primitives"
import {
  getMyEmployee,
  listDevices,
  listMyBiometrics,
  subscribeTable,
  type BiometricRow,
  type DeviceRow,
} from "@/lib/supabase/db"

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

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Device</h1>
        <p className="mt-1 text-sm text-slate-500">Your wristband and its live biometric signals.</p>
      </div>

      <SectionCard title="Wristband">
        {device ? (
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <Watch className="h-6 w-6 text-slate-500" />
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
                <div className="mt-1.5 text-sm font-medium text-slate-700">
                  {device.last_sync_time ? new Date(device.last_sync_time).toLocaleString() : "Never"}
                </div>
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

      {device && (
        <SectionCard
          title="Live Vitals"
          description={latest ? `Last reading ${new Date(latest.reading_time).toLocaleTimeString()}` : undefined}
        >
          {latest ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <VitalCard icon={HeartPulse} label="Heart Rate" value={latest.heart_rate ?? "—"} unit="bpm" />
              <VitalCard icon={Activity} label="HRV" value={latest.hrv ?? "—"} unit="ms" />
              <VitalCard icon={Thermometer} label="Skin Temp" value={latest.skin_temperature ?? "—"} unit="°C" />
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
      )}

      {device && readings.length > 1 && (
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
      )}
    </div>
  )
}
