"use client"

import Link from "next/link"
import { Users, Activity, Clock, AlertCircle, ShieldAlert, Bell, ClipboardList, Radio } from "lucide-react"
import { PageHeader, MetricCard, SectionCard, EmptyState } from "@/components/app/primitives"
import { Button } from "@/components/app/controls"

export default function ManagerDashboard() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live operational view of your workforce."
        actions={
          <Link href="/manager/employees">
            <Button variant="secondary">View Employees</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="On Shift" value={0} icon={Users} />
        <MetricCard label="Working" value={0} icon={Activity} />
        <MetricCard label="Late Arrivals" value={0} icon={AlertCircle} />
        <MetricCard label="Hours Worked" value={0} icon={Clock} />
        <MetricCard label="Moderate Risk" value={0} icon={ShieldAlert} />
        <MetricCard label="High Risk" value={0} icon={ShieldAlert} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Live Workforce" className="lg:col-span-2">
          <EmptyState
            icon={Radio}
            title="No employees currently available."
            description="Live status will appear here once employees clock in for their shift."
          />
        </SectionCard>

        <SectionCard title="Fatigue Alerts">
          <EmptyState icon={Bell} title="No active fatigue alerts." description="You're all caught up." />
        </SectionCard>

        <SectionCard title="Attendance">
          <EmptyState
            icon={ClipboardList}
            title="No attendance records yet."
            description="Attendance information will appear once workforce activity is recorded."
          />
        </SectionCard>
      </div>
    </>
  )
}
