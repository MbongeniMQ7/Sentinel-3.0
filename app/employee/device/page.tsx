"use client"

import { useEffect, useState } from "react"
import { Watch, Battery, Wifi } from "lucide-react"
import { SectionCard, EmptyState, Badge } from "@/components/app/primitives"
import { Button } from "@/components/app/controls"
import { getMyEmployee, listDevices, type DeviceRow } from "@/lib/supabase/db"

export default function EmployeeDevicePage() {
  const [device, setDevice] = useState<DeviceRow | null>(null)

  useEffect(() => {
    ;(async () => {
      const emp = await getMyEmployee()
      if (!emp) return
      const devices = await listDevices()
      setDevice(devices.find((d) => d.employee_id === emp.id) ?? null)
    })().catch(() => {})
  }, [])

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Device</h1>
        <p className="mt-1 text-sm text-slate-500">Your wristband and its connection status.</p>
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
            description="Connect a wristband to track your heart rate, movement and fatigue signals."
            action={
              <Button size="sm" variant="secondary">
                Connect Device
              </Button>
            }
          />
        )}
      </SectionCard>
    </div>
  )
}
