"use client"

import { useState } from "react"
import { CalendarClock, Plus } from "lucide-react"
import { PageHeader, SectionCard, EmptyState } from "@/components/app/primitives"
import { Button, Input, Select, Field } from "@/components/app/controls"
import { Modal } from "@/components/app/modal"
import { Toast } from "@/components/app/toast"

export default function ManagerShiftsPage() {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setOpen(false)
    setToast("Shift created for this session.")
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

      <SectionCard title="Shifts">
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
            <Button form="create-shift-form" type="submit">
              Create Shift
            </Button>
          </>
        }
      >
        <form id="create-shift-form" onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Shift name" required>
            <Input required placeholder="e.g. Morning Shift" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time" required>
              <Input type="time" required />
            </Field>
            <Field label="End time" required>
              <Input type="time" required />
            </Field>
          </div>
          <Field label="Site">
            <Select defaultValue="">
              <option value="">Select a site</option>
            </Select>
          </Field>
          <Field label="Break (minutes)" hint="Unpaid break duration.">
            <Input type="number" min={0} placeholder="0" />
          </Field>
        </form>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
