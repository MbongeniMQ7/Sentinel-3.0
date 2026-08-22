"use client"

import { useCallback, useEffect, useState } from "react"
import { CalendarClock, Plus } from "lucide-react"
import { PageHeader, SectionCard, EmptyState, DataTable } from "@/components/app/primitives"
import { Button, Input, Select, Field } from "@/components/app/controls"
import { Modal } from "@/components/app/modal"
import { Toast } from "@/components/app/toast"
import { createShift, listShifts, listSites, type ShiftRow, type Site } from "@/lib/supabase/db"

export default function ManagerShiftsPage() {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [shifts, setShifts] = useState<ShiftRow[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    listShifts().then(setShifts).catch(() => setShifts([]))
  }, [])

  useEffect(() => {
    load()
    listSites().then(setSites).catch(() => setSites([]))
  }, [load])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get("name") || "").trim()
    const start_time = String(form.get("start") || "")
    const end_time = String(form.get("end") || "")
    const site_id = String(form.get("site") || "") || null
    const break_duration = Number(form.get("break") || 0)
    if (!name || !start_time || !end_time) return
    setSaving(true)
    setError(null)
    try {
      await createShift({ name, start_time, end_time, site_id, break_duration })
      setOpen(false)
      setToast("Shift created.")
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create shift.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Shifts"
        description="Define working patterns for your workforce."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Create Shift
          </Button>
        }
      />

      <SectionCard title="Shifts" bodyClassName="p-0">
        <DataTable
          columns={["Shift", "Start", "End", "Break", "Site"]}
          empty={
            <EmptyState
              icon={CalendarClock}
              title="No shifts created."
              description="Create a shift to define start times, end times and break rules."
              action={
                <Button size="sm" onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" /> Create Shift
                </Button>
              }
            />
          }
          rows={
            shifts.length
              ? shifts.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-700">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.start_time?.slice(0, 5)}</td>
                    <td className="px-4 py-3 text-slate-600">{s.end_time?.slice(0, 5)}</td>
                    <td className="px-4 py-3 text-slate-600">{s.break_duration ?? 0} min</td>
                    <td className="px-4 py-3 text-slate-600">{s.site?.name || "All sites"}</td>
                  </tr>
                ))
              : undefined
          }
        />
      </SectionCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Shift"
        description="Define a working pattern."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="create-shift-form" type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create Shift"}
            </Button>
          </>
        }
      >
        <form id="create-shift-form" onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Shift name" required>
            <Input name="name" required placeholder="e.g. Morning Shift" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time" required>
              <Input name="start" type="time" required />
            </Field>
            <Field label="End time" required>
              <Input name="end" type="time" required />
            </Field>
          </div>
          <Field label="Site">
            <Select name="site" defaultValue="">
              <option value="">All sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Break (minutes)" hint="Unpaid break duration.">
            <Input name="break" type="number" min={0} placeholder="0" />
          </Field>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </form>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
