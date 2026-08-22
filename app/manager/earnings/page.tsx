import { Wallet, BarChart3 } from "lucide-react"
import { PageHeader, MetricCard, SectionCard, EmptyState } from "@/components/app/primitives"
import { Input, Select } from "@/components/app/controls"

export default function ManagerEarningsPage() {
  return (
    <>
      <PageHeader title="Estimated Earnings" description="Projected pay based on working hours." />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Input type="date" />
        <Select defaultValue="">
          <option value="">All employees</option>
        </Select>
        <Select defaultValue="">
          <option value="">All sites</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Regular Earnings" value="R0.00" icon={Wallet} />
        <MetricCard label="Overtime" value="R0.00" icon={Wallet} />
        <MetricCard label="Estimated Total" value="R0.00" icon={Wallet} />
      </div>

      <SectionCard title="Earnings" className="mt-6">
        <EmptyState
          icon={BarChart3}
          title="No earnings data available yet."
          description="Estimated earnings require working hours and configured pay rates."
        />
      </SectionCard>
    </>
  )
}
