"use client"

import { useState } from "react"
import { BellOff, Search } from "lucide-react"
import { PageHeader, SectionCard, EmptyState } from "@/components/app/primitives"
import { Input, Select } from "@/components/app/controls"

export default function ManagerAlertsPage() {
  const [query, setQuery] = useState("")

  return (
    <>
      <PageHeader title="Alerts" description="Fatigue, attendance and device alerts across your workforce." />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="pl-9" />
        </div>
        <Select defaultValue="">
          <option value="">All types</option>
        </Select>
        <Select defaultValue="">
          <option value="">All severities</option>
        </Select>
        <Select defaultValue="">
          <option value="">All sites</option>
        </Select>
      </div>

      <SectionCard title="Active Alerts">
        <EmptyState icon={BellOff} title="No active alerts." description="You're all caught up. New alerts will appear here." />
      </SectionCard>
    </>
  )
}
