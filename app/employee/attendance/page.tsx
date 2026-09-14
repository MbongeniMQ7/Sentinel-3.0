"use client"

import { useEffect, useMemo, useState } from "react"
import { ClipboardList, Download, CalendarCheck, AlertCircle, Clock } from "lucide-react"
import { PageHeader, DataTable, EmptyState, Badge, MetricCard } from "@/components/app/primitives"
import { Button, Input, Select } from "@/components/app/controls"
import { Toast } from "@/components/app/toast"
import { FadeIn } from "@/components/app/motion"
import { downloadCsv, type ReportData } from "@/lib/reports"
import { listMyAttendance, subscribeTable, type AttendanceRow } from "@/lib/supabase/db"

function time(v: string | null) {
  return v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"
}

export default function EmployeeAttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [dateFilter, setDateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const load = () => listMyAttendance(90).then(setRows).catch(() => setRows([]))
    load()
    return subscribeTable("attendance_records", load)
  }, [])

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (dateFilter && r.date !== dateFilter) return false
        if (statusFilter && r.status !== statusFilter) return false
        return true
      }),
    [rows, dateFilter, statusFilter],
  )

  const stats = useMemo(() => {
    const present = filtered.filter((r) => r.status === "present").length
    const late = filtered.filter((r) => r.status === "late").length
    const hours = filtered.reduce((s, r) => s + Number(r.hours_worked || 0), 0)
    return { present, late, hours }
  }, [filtered])

  function handleExport() {
    if (!filtered.length) {
      setToast("There are no records to export.")
      return
    }
    const data: ReportData = {
      title: "My Attendance",
      columns: ["Date", "Clock In", "Clock Out", "Hours", "Status"],
      rows: filtered.map((r) => [
        new Date(r.date).toLocaleDateString(),
        time(r.clock_in_time),
        time(r.clock_out_time),
        Number(r.hours_worked || 0).toFixed(2),
        r.status,
      ]),
      summary: [{ label: "Records", value: String(filtered.length) }],
    }
    downloadCsv(data, { siteName: "My records", range: "all" })
    setToast(`Exported ${filtered.length} record${filtered.length === 1 ? "" : "s"}.`)
  }

  return (
    <>
      <PageHeader
        title="My Attendance"
        description="Your clock-in and clock-out history."
        actions={
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FadeIn delay={0} y={14}>
          <MetricCard label="Days Present" value={stats.present} icon={CalendarCheck} />
        </FadeIn>
        <FadeIn delay={70} y={14}>
          <MetricCard label="Late Arrivals" value={stats.late} icon={AlertCircle} />
        </FadeIn>
        <FadeIn delay={140} y={14}>
          <MetricCard label="Total Hours" value={stats.hours.toFixed(1)} icon={Clock} />
        </FadeIn>
      </div>

      <div className="mb-4 mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </Select>
      </div>

      <DataTable
        columns={["Date", "Clock In", "Clock Out", "Hours", "Status", "Correction"]}
        empty={
          <EmptyState
            icon={ClipboardList}
            title="No attendance records yet."
            description="Your attendance appears here once you start clocking in."
          />
        }
        rows={
          filtered.length
            ? filtered.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-700">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{time(a.clock_in_time)}</td>
                  <td className="px-4 py-3 text-slate-600">{time(a.clock_out_time)}</td>
                  <td className="px-4 py-3 text-slate-600">{Number(a.hours_worked || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={a.status === "present" ? "green" : a.status === "late" ? "amber" : "slate"}>{a.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {a.correction_requested ? <Badge tone="amber">Requested</Badge> : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))
            : undefined
        }
      />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
