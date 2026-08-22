"use client"

import Link from "next/link"
import {
  Users,
  Activity,
  Clock,
  Wallet,
  ShieldAlert,
  Plus,
  Building2,
  BarChart3,
  Bell,
  Lightbulb,
  Network,
} from "lucide-react"
import { PageHeader, MetricCard, SectionCard, EmptyState } from "@/components/app/primitives"
import { Button } from "@/components/app/controls"

export default function OwnerDashboard() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your workforce overview will appear here once you configure your workforce."
        actions={
          <Link href="/owner/employees">
            <Button>
              <Plus className="h-4 w-4" /> Add Employee
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Employees" value={0} icon={Users} />
        <MetricCard label="Active Now" value={0} icon={Activity} />
        <MetricCard label="Hours Worked" value={0} icon={Clock} />
        <MetricCard label="Estimated Earnings" value="R0.00" icon={Wallet} />
        <MetricCard label="Fatigue Alerts" value={0} icon={ShieldAlert} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Workforce Overview">
          <EmptyState
            icon={Network}
            title="No workforce information available yet."
            description="Add your first employee to start tracking attendance, hours and fatigue."
            action={
              <Link href="/owner/employees">
                <Button size="sm">
                  <Plus className="h-4 w-4" /> Add Employee
                </Button>
              </Link>
            }
          />
        </SectionCard>

        <SectionCard title="Site Comparison">
          <EmptyState
            icon={Building2}
            title="No sites created."
            description="Create a site to compare workforce activity across locations."
            action={
              <Link href="/owner/sites">
                <Button size="sm" variant="secondary">
                  Create Site
                </Button>
              </Link>
            }
          />
        </SectionCard>

        <SectionCard title="Fatigue Overview">
          <EmptyState
            icon={ShieldAlert}
            title="No fatigue data available yet."
            description="Fatigue risk will appear once devices are connected and activity is recorded."
          />
        </SectionCard>

        <SectionCard title="Activity Patterns">
          <EmptyState
            icon={Activity}
            title="No activity data available yet."
            description="Operational patterns will appear as workforce activity is captured."
          />
        </SectionCard>

        <SectionCard title="Recent Alerts">
          <EmptyState icon={Bell} title="No active alerts." description="You're all caught up." />
        </SectionCard>

        <SectionCard title="Management Insights">
          <EmptyState
            icon={Lightbulb}
            title="Not enough data yet."
            description="Insights will surface once your workforce generates activity."
          />
        </SectionCard>
      </div>

      <SectionCard title="Analytics" className="mt-4" description="Workforce trends over time">
        <EmptyState
          icon={BarChart3}
          title="No data available yet"
          description="Workforce activity will appear here once information is available."
        />
      </SectionCard>
    </>
  )
}
