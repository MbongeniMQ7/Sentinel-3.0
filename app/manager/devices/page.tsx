"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Watch, Plus, Search } from "lucide-react"
import { PageHeader, DataTable, EmptyState, Badge } from "@/components/app/primitives"
import { Button, Input, Select, Field } from "@/components/app/controls"
import { Modal } from "@/components/app/modal"
import { Toast } from "@/components/app/toast"
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

export default function ManagerDevicesPage() {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    listDevices().then(setDevices).catch(() => setDevices([]))
  }, [])

  useEffect(() => {
    load()
    listEmployees().then(setEmployees).catch(() => setEmployees([]))
    listSites().then(setSites).catch(() => setSites([]))
    return subscribeTable("devices", load)
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return devices.filter((d) => !q || `${d.device_id} ${d.employee?.full_name ?? ""}`.toLowerCase().includes(q))
  }, [devices, query])

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
                  <td className="px-4 py-3 text-slate-600">
                    {d.last_sync_time ? new Date(d.last_sync_time).toLocaleString() : "Never"}
                  </td>
                </tr>
              ))
            : undefined
        }
      />

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
