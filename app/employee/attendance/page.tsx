import { ClipboardList } from "lucide-react"
import { SectionCard, EmptyState } from "@/components/app/primitives"

export default function EmployeeAttendancePage() {
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Attendance</h1>
        <p className="mt-1 text-sm text-slate-500">Your clock-in and clock-out history.</p>
      </div>

      <SectionCard title="Attendance History">
        <EmptyState
          icon={ClipboardList}
          title="No attendance records yet."
          description="Your attendance appears here once you start clocking in."
        />
      </SectionCard>
    </div>
  )
}
