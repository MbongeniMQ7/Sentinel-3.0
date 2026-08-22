"use client"

import { useState } from "react"
import { Watch, Plus, Search } from "lucide-react"
import { PageHeader, DataTable, EmptyState } from "@/components/app/primitives"
import { Button, Input, Select, Field } from "@/components/app/controls"
import { Modal } from "@/components/app/modal"
import { Toast } from "@/components/app/toast"

export default function ManagerDevicesPage() {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setOpen(false)
    setToast("Device registered for this session.")
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
        <Select defaultValue="">
          <option value="">All connections</option>
        </Select>
        <Select defaultValue="">
          <option value="">All statuses</option>
        </Select>
      </div>

      <DataTable
        columns={[
          "Device ID",
          "Employee",
          "Connection",
          "Battery",
          "Last Sync",
          "Heart Rate",
          "HRV",
          "Temperature",
          "Movement",
          "Status",
        ]}
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
            <Button form="add-device-form" type="submit">
              Add Device
            </Button>
          </>
        }
      >
        <form id="add-device-form" onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Device ID" required>
            <Input required placeholder="e.g. band-0001" />
          </Field>
          <Field label="Assign to employee">
            <Select defaultValue="">
              <option value="">Unassigned</option>
            </Select>
          </Field>
          <Field label="Site">
            <Select defaultValue="">
              <option value="">Select a site</option>
            </Select>
          </Field>
        </form>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
