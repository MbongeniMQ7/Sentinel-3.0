import { BarChart3, PieChart, TrendingUp, Activity } from "lucide-react"
import { PageHeader, SectionCard, EmptyState } from "@/components/app/primitives"

export default function OwnerAnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" description="Workforce trends and operational insights." />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Workforce Trend">
          <EmptyState icon={TrendingUp} title="No data available yet" description="Trends will appear once activity is recorded." />
        </SectionCard>
        <SectionCard title="Risk Distribution">
          <EmptyState icon={PieChart} title="No fatigue data available" description="Risk distribution needs device and activity data." />
        </SectionCard>
        <SectionCard title="Hours by Site">
          <EmptyState icon={BarChart3} title="No data available yet" description="Working-hour comparisons appear once sites are active." />
        </SectionCard>
        <SectionCard title="Activity Patterns">
          <EmptyState icon={Activity} title="No activity data available yet" description="Patterns build up as your workforce operates." />
        </SectionCard>
      </div>
    </>
  )
}
