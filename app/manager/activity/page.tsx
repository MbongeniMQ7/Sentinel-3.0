import { Activity, Clock, Users, MapPin, LineChart } from "lucide-react"
import { PageHeader, SectionCard, EmptyState } from "@/components/app/primitives"

export default function ManagerActivityPage() {
  return (
    <>
      <PageHeader title="Activity Patterns" description="Behavioural and operational patterns across your workforce." />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Attendance Patterns">
          <EmptyState icon={Clock} title="No attendance patterns yet." description="Patterns emerge as attendance data accumulates." />
        </SectionCard>
        <SectionCard title="Working-Hour Patterns">
          <EmptyState icon={LineChart} title="No working-hour patterns yet." description="Trends appear once shifts are worked." />
        </SectionCard>
        <SectionCard title="Activity Patterns">
          <EmptyState icon={Activity} title="No activity patterns yet." description="Movement and activity data will populate here." />
        </SectionCard>
        <SectionCard title="Team Patterns">
          <EmptyState icon={Users} title="No team patterns yet." description="Team-level insights appear with more data." />
        </SectionCard>
        <SectionCard title="Site Patterns" className="lg:col-span-2">
          <EmptyState icon={MapPin} title="No site patterns yet." description="Compare sites once activity is recorded across locations." />
        </SectionCard>
      </div>
    </>
  )
}
