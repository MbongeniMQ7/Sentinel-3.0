import { Clock, BarChart3 } from "lucide-react"
import { MetricCard, SectionCard, EmptyState } from "@/components/app/primitives"

export default function EmployeeHoursPage() {
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Hours</h1>
        <p className="mt-1 text-sm text-slate-500">Your working hours over time.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Today" value="0h" icon={Clock} />
        <MetricCard label="This Week" value="0h" icon={Clock} />
        <MetricCard label="This Month" value="0h" icon={Clock} />
      </div>

      <SectionCard title="Hours Over Time">
        <EmptyState icon={BarChart3} title="No hours recorded yet." description="Your working hours will appear here as you work shifts." />
      </SectionCard>
    </div>
  )
}
