"use client"

import Link from "next/link"
import { ClipboardList, BellOff, Watch, Clock } from "lucide-react"
import { SectionCard, EmptyState } from "@/components/app/primitives"
import { ClockInCard } from "@/components/app/clock-in-card"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export default function EmployeeHomePage() {
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{greeting()}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's your shift at a glance.</p>
      </div>

      <ClockInCard />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Clock className="h-4 w-4 text-slate-400" /> Today
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">0h 00m</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Clock className="h-4 w-4 text-slate-400" /> This Week
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">0h 00m</div>
        </div>
      </div>

      <SectionCard title="My Attendance" action={<Link href="/employee/attendance" className="text-xs font-medium text-[#0f2a4a] hover:underline">View all</Link>}>
        <EmptyState icon={ClipboardList} title="No attendance records yet." description="Your clock-in history will appear here." />
      </SectionCard>

      <SectionCard title="My Alerts" action={<Link href="/employee/alerts" className="text-xs font-medium text-[#0f2a4a] hover:underline">View all</Link>}>
        <EmptyState icon={BellOff} title="No alerts." description="You have no fatigue or attendance alerts." />
      </SectionCard>

      <SectionCard title="My Device" action={<Link href="/employee/device" className="text-xs font-medium text-[#0f2a4a] hover:underline">Manage</Link>}>
        <EmptyState icon={Watch} title="No wristband connected." description="Connect a wristband to track your wellbeing." />
      </SectionCard>
    </div>
  )
}
