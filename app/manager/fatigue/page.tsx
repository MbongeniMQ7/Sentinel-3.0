import { ShieldAlert, Activity, TrendingUp, Users, Repeat } from "lucide-react"
import { PageHeader, MetricCard, SectionCard, EmptyState } from "@/components/app/primitives"

export default function ManagerFatiguePage() {
  return (
    <>
      <PageHeader title="Fatigue" description="Fatigue risk signals across your workforce." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Low Risk" value={0} icon={Activity} />
        <MetricCard label="Moderate Risk" value={0} icon={ShieldAlert} />
        <MetricCard label="High Risk" value={0} icon={ShieldAlert} />
        <MetricCard label="Monitored" value={0} icon={Users} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Risk Distribution">
          <EmptyState icon={ShieldAlert} title="No risk data yet." description="Risk levels appear once devices report activity." />
        </SectionCard>
        <SectionCard title="Risk Trend">
          <EmptyState icon={TrendingUp} title="No trend data yet." description="Trends build up over time as data is collected." />
        </SectionCard>
        <SectionCard title="High Risk Employees">
          <EmptyState icon={Users} title="No high-risk employees." description="Employees flagged as high risk will be listed here." />
        </SectionCard>
        <SectionCard title="Persistent Patterns">
          <EmptyState icon={Repeat} title="No persistent patterns detected." description="Recurring fatigue patterns will surface here." />
        </SectionCard>
      </div>
    </>
  )
}
