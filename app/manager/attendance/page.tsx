"use client"

import { useState } from "react"
import { ClipboardList, Search, Download } from "lucide-react"
import { PageHeader, DataTable, EmptyState } from "@/components/app/primitives"
import { Button, Input, Select } from "@/components/app/controls"

export default function ManagerAttendancePage() {
  const [query, setQuery] = useState("")

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Clock-in, clock-out and lateness across your workforce."
        actions={
          <Button variant="secondary">
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="pl-9" />
        </div>
        <Input type="date" />
        <Select defaultValue="">
          <option value="">All employees</option>
        </Select>
        <Select defaultValue="">
          <option value="">All sites</option>
        </Select>
      </div>

      <DataTable
        columns={["Employee", "Date", "Clock In", "Clock Out", "Hours", "Status", "Correction", "Actions"]}
        empty={
          <EmptyState
            icon={ClipboardList}
            title="No attendance records yet."
            description="Attendance information will appear once workforce activity is recorded."
          />
        }
      />
    </>
  )
}
