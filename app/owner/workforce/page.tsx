"use client"

import Link from "next/link"
import { Users, Building2, UserCog, Network, Plus } from "lucide-react"
import { PageHeader, MetricCard, SectionCard, EmptyState } from "@/components/app/primitives"
import { Button } from "@/components/app/controls"

export default function OwnerWorkforcePage() {
  return (
    <>
      <PageHeader title="Workforce" description="A company-wide view of your people, managers and sites." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Employees" value={0} icon={Users} />
        <MetricCard label="Managers" value={0} icon={UserCog} />
        <MetricCard label="Sites" value={0} icon={Building2} />
        <MetricCard label="Active Now" value={0} icon={Network} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Managers">
          <EmptyState
            icon={UserCog}
            title="No managers added yet."
            description="Invite managers to run day-to-day operations at your sites."
            action={
              <Link href="/owner/employees">
                <Button size="sm">
                  <Plus className="h-4 w-4" /> Add Manager
                </Button>
              </Link>
            }
          />
        </SectionCard>
        <SectionCard title="Employees">
          <EmptyState
            icon={Users}
            title="No employees yet."
            description="Your workforce will appear here once employees are added."
            action={
              <Link href="/owner/employees">
                <Button size="sm" variant="secondary">
                  View Employees
                </Button>
              </Link>
            }
          />
        </SectionCard>
      </div>
    </>
  )
}
