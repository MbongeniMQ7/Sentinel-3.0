import { BellOff } from "lucide-react"
import { SectionCard, EmptyState } from "@/components/app/primitives"

export default function EmployeeAlertsPage() {
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Alerts</h1>
        <p className="mt-1 text-sm text-slate-500">Fatigue and attendance notifications for you.</p>
      </div>

      <SectionCard title="Alerts">
        <EmptyState icon={BellOff} title="No alerts." description="You're all caught up. Alerts about your wellbeing will appear here." />
      </SectionCard>
    </div>
  )
}
