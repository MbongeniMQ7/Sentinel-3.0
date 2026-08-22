"use client"

import { useEffect, useMemo, useState } from "react"
import { ClipboardList, Search, Download } from "lucide-react"
import { PageHeader, DataTable, EmptyState, Badge } from "@/components/app/primitives"
import { Button, Input, Select } from "@/components/app/controls"
import { listOrgAttendance, subscribeTable, type AttendanceRow } from "@/lib/supabase/db"

function time(v: string | null) {
  return v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"
}

export default function ManagerAttendancePage() {
  const [query, setQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [rows, setRows] = useState<AttendanceRow[]>([])

  function load() {
    listOrgAttendance(200).then(setRows).catch(() => setRows([]))
  }

  useEffect(() => {
    load()
    return subscribeTable("attendance_records", load)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (q && !`${r.employee?.full_name ?? ""} ${r.employee?.email ?? ""}`.toLowerCase().includes(q)) return false
      if (dateFilter && r.date !== dateFilter) return false
      return true
    })
  }, [rows, query, dateFilter])

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
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </div>

      <DataTable
        columns={["Employee", "Date", "Clock In", "Clock Out", "Hours", "Status", "Correction"]}
        empty={
          <EmptyState
            icon={ClipboardList}
            title="No attendance records yet."
            description="Attendance information will appear once workforce activity is recorded."
          />
        }
        rows={
          filtered.length
            ? filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.employee?.full_name || "—"}</div>
                    <div className="text-xs text-slate-400">{r.employee?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{time(r.clock_in_time)}</td>
                  <td className="px-4 py-3 text-slate-600">{time(r.clock_out_time)}</td>
                  <td className="px-4 py-3 text-slate-600">{Number(r.hours_worked || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.status === "present" ? "green" : r.status === "late" ? "amber" : "slate"}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {r.correction_requested ? <Badge tone="amber">Requested</Badge> : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))
            : undefined
        }
      />
    </>
  )
}
