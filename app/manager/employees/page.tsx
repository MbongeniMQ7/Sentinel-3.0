"use client"

import { useState } from "react"
import { Users, Plus, Search, Download } from "lucide-react"
import { PageHeader, DataTable, EmptyState } from "@/components/app/primitives"
import { Button, Input, Select } from "@/components/app/controls"
import { AddEmployeeModal } from "@/components/app/add-employee-modal"
import { Toast } from "@/components/app/toast"

export default function ManagerEmployeesPage() {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  return (
    <>
      <PageHeader
        title="Employees"
        description="The people you manage across your sites."
        actions={
          <>
            <Button variant="secondary">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add Employee
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employees" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select className="w-36" defaultValue="">
            <option value="">All sites</option>
          </Select>
          <Select className="w-36" defaultValue="">
            <option value="">All shifts</option>
          </Select>
        </div>
      </div>

      <DataTable
        columns={["Employee", "Site", "Status", "Shift", "Fatigue", "Actions"]}
        empty={
          <EmptyState
            icon={Users}
            title="No employees found."
            description="Add your first employee to begin tracking attendance and fatigue."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Add Employee
              </Button>
            }
          />
        }
      />

      <AddEmployeeModal open={open} onClose={() => setOpen(false)} onSubmitted={() => setToast("Employee added to this session.")} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
