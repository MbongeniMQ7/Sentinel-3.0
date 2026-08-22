"use client"

import { useState } from "react"
import { ClipboardCheck } from "lucide-react"
import { SectionCard, EmptyState } from "@/components/app/primitives"
import { Button, Input, Select, Textarea, Field } from "@/components/app/controls"
import { Toast } from "@/components/app/toast"

export default function EmployeeCorrectionsPage() {
  const [toast, setToast] = useState<string | null>(null)
  const [key, setKey] = useState(0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setToast("Correction request submitted.")
    setKey((k) => k + 1)
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
            <Select required defaultValue="">
              <option value="" disabled>
                Select a record
              </option>
            </Select>
          </Field>
          <Field label="Issue" required>
            <Select required defaultValue="">
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
            <Input required placeholder="e.g. Clock-out should be 17:00" />
          </Field>
          <Field label="Reason" required>
            <Textarea required rows={3} placeholder="Explain what happened" />
          </Field>
          <div className="flex justify-end">
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="My Requests">
        <EmptyState
          icon={ClipboardCheck}
          title="No correction requests yet."
          description="Submitted requests and their status will appear here."
        />
      </SectionCard>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
