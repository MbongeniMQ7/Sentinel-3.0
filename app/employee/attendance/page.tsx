"use client"

import { useEffect, useState } from "react"
import { ClipboardList } from "lucide-react"
import { SectionCard, EmptyState, DataTable, Badge } from "@/components/app/primitives"
import { listMyAttendance, type AttendanceRow } from "@/lib/supabase/db"

function time(v: string | null) {
  return v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"
}

export default function EmployeeAttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([])

  useEffect(() => {
    listMyAttendance(60).then(setRows).catch(() => setRows([]))
  }, [])

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">Your clock-in and clock-out history.</p>
      </div>

      <SectionCard title="Attendance History" bodyClassName="p-0">
        <DataTable
          columns={["Date", "Clock In", "Clock Out", "Hours", "Status"]}
          empty={
            <EmptyState
              icon={ClipboardList}
              title="No attendance records yet."
              description="Your attendance appears here once you start clocking in."
            />
          }
          rows={
            rows.length
              ? rows.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-700">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-600">{time(a.clock_in_time)}</td>
                    <td className="px-4 py-3 text-slate-600">{time(a.clock_out_time)}</td>
                    <td className="px-4 py-3 text-slate-600">{Number(a.hours_worked || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={a.status === "present" ? "green" : a.status === "late" ? "amber" : "slate"}>{a.status}</Badge>
                    </td>
                  </tr>
                ))
              : undefined
          }
        />
      </SectionCard>
    </div>
  )
}
