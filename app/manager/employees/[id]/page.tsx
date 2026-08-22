"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, UserRound, Clock, ClipboardList, ShieldAlert, Watch } from "lucide-react"
import { PageHeader, SectionCard, EmptyState, MetricCard } from "@/components/app/primitives"
import { Button } from "@/components/app/controls"
import { cn } from "@/lib/utils"

const TABS = ["Overview", "Attendance", "Working Hours", "Fatigue", "Device"] as const

export default function ManagerEmployeeDetailPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview")

  return (
    <>
      <Link
        href="/manager/employees"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to employees
      </Link>

      <PageHeader title="Employee" description="This employee has not been added in the current session." />

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
              tab === t ? "border-[#0f2a4a] font-medium text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Hours Today" value="0h 00m" icon={Clock} />
            <MetricCard label="This Week" value="0h 00m" icon={Clock} />
            <MetricCard label="Fatigue Risk" value="—" icon={ShieldAlert} />
            <MetricCard label="Device" value="—" icon={Watch} />
          </div>
          <SectionCard title="Profile">
            <EmptyState icon={UserRound} title="No profile information." description="Employee details will appear here once added." />
          </SectionCard>
        </div>
      )}

      {tab === "Attendance" && (
        <SectionCard title="Attendance">
          <EmptyState icon={ClipboardList} title="No attendance records." description="Records appear once this employee clocks in." />
        </SectionCard>
      )}

      {tab === "Working Hours" && (
        <SectionCard title="Working Hours">
          <EmptyState icon={Clock} title="No working-hour data." description="Hours accumulate as shifts are worked." />
        </SectionCard>
      )}

      {tab === "Fatigue" && (
        <SectionCard title="Fatigue">
          <EmptyState icon={ShieldAlert} title="No fatigue data." description="Fatigue risk requires device and activity data." />
        </SectionCard>
      )}

      {tab === "Device" && (
        <SectionCard title="Device">
          <EmptyState
            icon={Watch}
            title="No wristband assigned."
            description="Assign a device to capture biometric signals."
            action={
              <Link href="/manager/devices">
                <Button size="sm" variant="secondary">
                  Manage Devices
                </Button>
              </Link>
            }
          />
        </SectionCard>
      )}
    </>
  )
}
