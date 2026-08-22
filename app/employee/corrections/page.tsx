"use client"

import { useCallback, useEffect, useState } from "react"
import { ClipboardCheck } from "lucide-react"
import { SectionCard, EmptyState, Badge } from "@/components/app/primitives"
import { Button, Input, Select, Textarea, Field } from "@/components/app/controls"
import { Toast } from "@/components/app/toast"
import { listMyAttendance, listMyCorrections, submitCorrection, type AttendanceRow } from "@/lib/supabase/db"

type CorrectionRow = {
  id: string
  issue_type: string
  requested_change: string
  reason: string
  status: string
  created_at: string
}

export default function EmployeeCorrectionsPage() {
  const [toast, setToast] = useState<string | null>(null)
  const [key, setKey] = useState(0)
  const [records, setRecords] = useState<AttendanceRow[]>([])
  const [requests, setRequests] = useState<CorrectionRow[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    listMyAttendance(60).then(setRecords).catch(() => setRecords([]))
    listMyCorrections().then((r) => setRequests(r as CorrectionRow[])).catch(() => setRequests([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const attendance_id = String(form.get("record") || "")
    const issue_type = String(form.get("issue") || "")
    const requested_change = String(form.get("requested_change") || "")
    const reason = String(form.get("reason") || "")
    if (!attendance_id || !issue_type) return
    setSaving(true)
    setError(null)
    try {
      await submitCorrection({ attendance_id, issue_type, requested_change, reason })
      setToast("Correction request submitted.")
      setKey((k) => k + 1)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit request.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Corrections</h1>
        <p className="mt-1 text-sm text-slate-500">Request a change to an attendance record.</p>
      </div>

      <SectionCard title="New Correction Request">
        <form key={key} onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Record" required hint="The attendance record you'd like corrected.">
            <Select name="record" required defaultValue="">
              <option value="" disabled>
                Select a record
              </option>
              {records.map((r) => (
                <option key={r.id} value={r.id}>
                  {new Date(r.date).toLocaleDateString()} — {Number(r.hours_worked || 0).toFixed(2)}h
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Issue" required>
            <Select name="issue" required defaultValue="">
              <option value="" disabled>
                Select an issue
              </option>
              <option value="missed_clock_in">Missed clock in</option>
              <option value="missed_clock_out">Missed clock out</option>
              <option value="wrong_time">Incorrect time</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Requested correction" required>
            <Input name="requested_change" required placeholder="e.g. Clock-out should be 17:00" />
          </Field>
          <Field label="Reason" required>
            <Textarea name="reason" required rows={3} placeholder="Explain what happened" />
          </Field>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="My Requests">
        {requests.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No correction requests yet."
            description="Submitted requests and their status will appear here."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {requests.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{r.requested_change}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{r.reason}</p>
                </div>
                <Badge tone={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "amber"}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
