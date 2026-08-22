import { Watch } from "lucide-react"
import { SectionCard, EmptyState } from "@/components/app/primitives"
import { Button } from "@/components/app/controls"

export default function EmployeeDevicePage() {
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Device</h1>
        <p className="mt-1 text-sm text-slate-500">Your wristband and its connection status.</p>
      </div>

      <SectionCard title="Wristband">
        <EmptyState
          icon={Watch}
          title="No wristband connected."
          description="Connect a wristband to track your heart rate, movement and fatigue signals."
          action={
            <Button size="sm" variant="secondary">
              Connect Device
            </Button>
          }
        />
      </SectionCard>
    </div>
  )
}
