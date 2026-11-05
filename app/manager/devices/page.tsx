"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
<<<<<<< HEAD
import { Watch, Plus, Search } from "lucide-react"
import { PageHeader, DataTable, EmptyState, Badge, LoadErrorState } from "@/components/app/primitives"
=======
import { Watch, Plus, Search, Activity, RefreshCw } from "lucide-react"
import { PageHeader, DataTable, EmptyState, Badge, SectionCard } from "@/components/app/primitives"
>>>>>>> c6cf32c (feat: Device connection via api endpoint)
import { Button, Input, Select, Field } from "@/components/app/controls"
import { Modal } from "@/components/app/modal"
import { Toast } from "@/components/app/toast"
import { supabase } from "@/lib/supabase/client"
import type { SentinelReadingsResponse } from "@/lib/sentinel"
import {
  createDevice,
  listDevices,
  listEmployees,
  listSites,
  subscribeTable,
  type DeviceRow,
  type EmployeeRow,
  type Site,
} from "@/lib/supabase/db"
import { useNow, timeAgo } from "@/hooks/use-live-vitals"

export default function ManagerDevicesPage() {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
<<<<<<< HEAD
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
=======
  const [sentinelReadings, setSentinelReadings] = useState<SentinelReadingsResponse["readings"]>({})
  const [sentinelError, setSentinelError] = useState<string | null>(null)
  const [sentinelLoading, setSentinelLoading] = useState(true)
>>>>>>> c6cf32c (feat: Device connection via api endpoint)
  const now = useNow(1000)

  const load = useCallback(() => {
    void Promise.all([listDevices(), listEmployees(), listSites()])
      .then(([nextDevices, nextEmployees, nextSites]) => {
        setDevices(nextDevices)
        setEmployees(nextEmployees)
        setSites(nextSites)
        setLoadError(null)
      })
      .catch(() => setLoadError("Device data could not be loaded. Check your connection and retry."))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    void load()
    return subscribeTable("devices", load)
  }, [load])

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    async function refreshSentinelReadings() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!session?.access_token) throw new Error("Please sign in again to view live device readings.")

        const response = await fetch("/api/sentinel/readings", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        })
        const result = await response.json() as SentinelReadingsResponse & { error?: string }
        if (!response.ok) throw new Error(result.error || "Could not load live device readings.")
        if (active) {
          setSentinelReadings(result.readings)
          setSentinelError(null)
        }
      } catch (err) {
        if (active) setSentinelError(err instanceof Error ? err.message : "Could not load live device readings.")
      } finally {
        if (active) {
          setSentinelLoading(false)
          timer = setTimeout(refreshSentinelReadings, 3000)
        }
      }
    }

    void refreshSentinelReadings()
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return devices.filter((d) => !q || `${d.device_id} ${d.employee?.full_name ?? ""}`.toLowerCase().includes(q))
  }, [devices, query])

  const liveReadings = useMemo(
    () => Object.entries(sentinelReadings).sort(([a], [b]) => a.localeCompare(b)),
    [sentinelReadings],
  )
  const devicesById = useMemo(
    () => new Map(devices.map((device) => [device.device_id.toLowerCase(), device])),
    [devices],
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const device_id = String(form.get("device_id") || "").trim()
    const employee_id = String(form.get("employee") || "") || null
    const site_id = String(form.get("site") || "") || null
    if (!device_id) return
    setSaving(true)
    setError(null)
    try {
      await createDevice({ device_id, employee_id, site_id })
      setOpen(false)
      setToast("Device registered.")
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add device.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <><PageHeader title="Devices" description="Wristbands and their live biometric signals." /><p role="status" className="py-16 text-center text-sm text-slate-500">Loading devices…</p></>
  if (loadError) return <><PageHeader title="Devices" description="Wristbands and their live biometric signals." /><LoadErrorState message={loadError} onRetry={() => { setLoading(true); load() }} /></>

  return (
    <>
      <PageHeader
        title="Devices"
        description="Wristbands and their live biometric signals."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add Device
          </Button>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search devices" className="pl-9" />
        </div>
      </div>

      <DataTable
        columns={["Device ID", "Employee", "Connection", "Battery", "Last Sync"]}
        empty={
          <EmptyState
            icon={Watch}
            title="No devices registered."
            description="Register a wristband to start capturing biometric signals."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Add Device
              </Button>
            }
          />
        }
        rows={
          filtered.length
            ? filtered.map((d) => (
                <tr key={d.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-700">{d.device_id}</td>
                  <td className="px-4 py-3 text-slate-600">{d.employee?.full_name || "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={d.connection_status === "connected" ? "green" : d.connection_status === "syncing" ? "amber" : "slate"}>
                      {d.connection_status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.battery_level ?? "—"}%</td>
                  <td className="px-4 py-3 text-slate-600">{timeAgo(d.last_sync_time, now)}</td>
                </tr>
              ))
            : undefined
        }
      />

      <SectionCard
        title="Live Sentinel API readings"
        description="Latest readings received by your deployed Sentinel dashboard. Refreshes every 3 seconds."
        className="mt-6"
        action={
          sentinelLoading
            ? <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
            : <Badge tone={sentinelError ? "red" : "green"}>{sentinelError ? "API issue" : "Connected"}</Badge>
        }
      >
        {sentinelError && (
          <p role="alert" className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {sentinelError}
          </p>
        )}
        {liveReadings.length ? (
          <DataTable
            columns={["Device ID", "Employee", "State", "Fatigue Score", "Heart Rate", "Temperature", "Calibration", "Last Report"]}
            empty={<EmptyState title="No live readings yet." />}
            rows={liveReadings.map(([deviceId, reading]) => {
              const device = devicesById.get(deviceId.toLowerCase())
              return (
                <tr key={deviceId} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-700">{deviceId}</td>
                  <td className="px-4 py-3 text-slate-600">{device?.employee?.full_name || "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={reading.status?.toLowerCase() === "normal" ? "green" : reading.status ? "amber" : "slate"}>
                      {reading.status || "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{reading.score ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{reading.bpm == null ? "—" : `${reading.bpm} bpm`}</td>
                  <td className="px-4 py-3 text-slate-600">{reading.temp == null ? "—" : `${reading.temp} °C`}</td>
                  <td className="px-4 py-3 text-slate-600">{reading.calibration ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {reading.updated_at == null ? "—" : new Date(reading.updated_at * 1000).toLocaleTimeString()}
                  </td>
                </tr>
              )
            })}
          />
        ) : (
          <EmptyState
            icon={Activity}
            title={sentinelLoading ? "Connecting to Sentinel API…" : "No live readings yet."}
            description="Register the device in this workspace using the same device ID it reports to the Sentinel dashboard."
          />
        )}
      </SectionCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Device"
        description="Register a new wristband."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="add-device-form" type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add Device"}
            </Button>
          </>
        }
      >
        <form id="add-device-form" onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Device ID" required>
            <Input name="device_id" required placeholder="e.g. band-0001" />
          </Field>
          <Field label="Assign to employee">
            <Select name="employee" defaultValue="">
              <option value="">Unassigned</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name || e.email}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Site">
            <Select name="site" defaultValue="">
              <option value="">Unassigned</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </form>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
