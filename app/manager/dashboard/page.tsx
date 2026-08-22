"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, Activity, Clock, AlertCircle, ShieldAlert, Bell, ClipboardList, Radio } from "lucide-react"
import { PageHeader, MetricCard, SectionCard, EmptyState } from "@/components/app/primitives"
import { Button } from "@/components/app/controls"
import { managerMetrics, subscribeTable } from "@/lib/supabase/db"

export default function ManagerDashboard() {
  const [m, setM] = useState({ onShift: 0, working: 0, late: 0, hoursWorked: 0, moderate: 0, high: 0 })

  useEffect(() => {
    const load = () => managerMetrics().then(setM).catch(() => {})
    load()
    const a = subscribeTable("attendance_records", load)
    const b = subscribeTable("fatigue_alerts", load)
    return () => {
      a()
      b()
    }
  }, [])

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
        <MetricCard label="On Shift" value={m.onShift} icon={Users} />
        <MetricCard label="Working" value={m.working} icon={Activity} />
        <MetricCard label="Late Arrivals" value={m.late} icon={AlertCircle} />
        <MetricCard label="Hours Worked" value={m.hoursWorked.toFixed(1)} icon={Clock} />
        <MetricCard label="Moderate Risk" value={m.moderate} icon={ShieldAlert} />
        <MetricCard label="High Risk" value={m.high} icon={ShieldAlert} />
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
