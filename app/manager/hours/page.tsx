import { Clock, BarChart3 } from "lucide-react"
import { PageHeader, MetricCard, SectionCard, EmptyState } from "@/components/app/primitives"
import { Input, Select } from "@/components/app/controls"

export default function ManagerHoursPage() {
  return (
    <>
      <PageHeader title="Working Hours" description="Regular and overtime hours across your workforce." />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input type="date" />
        <Select defaultValue="">
          <option value="">All employees</option>
        </Select>
        <Select defaultValue="">
          <option value="">All sites</option>
        </Select>
        <Select defaultValue="">
          <option value="">All shifts</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Regular Hours" value={0} icon={Clock} />
        <MetricCard label="Overtime" value={0} icon={Clock} />
        <MetricCard label="Total Hours" value={0} icon={Clock} />
      </div>

      <SectionCard title="Hours Over Time" className="mt-6">
        <EmptyState icon={BarChart3} title="No data available yet" description="Working-hour trends will appear once shifts are worked." />
      </SectionCard>
    </>
  )
}
