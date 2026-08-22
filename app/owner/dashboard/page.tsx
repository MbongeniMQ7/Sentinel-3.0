"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import {
  Users,
  Activity,
  Clock,
  ShieldAlert,
  Plus,
  Building2,
  BarChart3,
  Bell,
  Lightbulb,
  Network,
} from "lucide-react"
import { PageHeader, MetricCard, SectionCard, EmptyState, RiskBadge, Badge } from "@/components/app/primitives"
import { Button } from "@/components/app/controls"
import {
  ownerMetrics,
  analyticsData,
  listFatigueAlerts,
  listEmployees,
  subscribeTable,
  type AnalyticsData,
  type FatigueAlertRow,
  type EmployeeRow,
} from "@/lib/supabase/db"

const RISK_COLORS = ["#22c55e", "#f59e0b", "#ef4444"]
const NAVY = "#0f2a4a"

export default function OwnerDashboard() {
  const [m, setM] = useState({ employees: 0, managers: 0, sites: 0, activeNow: 0, hoursWorked: 0, fatigueAlerts: 0 })
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [alerts, setAlerts] = useState<FatigueAlertRow[]>([])
  const [employees, setEmployees] = useState<EmployeeRow[]>([])

  useEffect(() => {
    const load = () => {
      ownerMetrics().then(setM).catch(() => {})
      analyticsData().then(setAnalytics).catch(() => setAnalytics(null))
      listFatigueAlerts().then((a) => setAlerts(a.slice(0, 5))).catch(() => setAlerts([]))
      listEmployees().then((e) => setEmployees(e.slice(0, 5))).catch(() => setEmployees([]))
    }
    load()
    const a = subscribeTable("attendance_records", load)
    const b = subscribeTable("employees", load)
    const c = subscribeTable("fatigue_alerts", load)
    return () => {
      a()
      b()
      c()
    }
  }, [])

  const hasHours = !!analytics && analytics.hoursTrend.some((d) => d.hours > 0)
  const hasSites = !!analytics && analytics.hoursBySite.some((d) => d.hours > 0)
  const hasRisk = !!analytics && analytics.riskDistribution.some((d) => d.value > 0)
  const hasActivity = !!analytics && analytics.activityTrend.some((d) => d.present > 0)

  const insights: string[] = []
  if (m.activeNow > 0) insights.push(`${m.activeNow} ${m.activeNow === 1 ? "person is" : "people are"} on shift right now.`)
  if (m.hoursWorked > 0) insights.push(`${m.hoursWorked.toFixed(1)} hours worked across your workforce today.`)
  if (m.fatigueAlerts > 0) insights.push(`${m.fatigueAlerts} unacknowledged fatigue alert${m.fatigueAlerts === 1 ? "" : "s"} need attention.`)
  if (m.sites > 0) insights.push(`Operating across ${m.sites} site${m.sites === 1 ? "" : "s"}.`)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your workforce overview at a glance."
        actions={
          <Link href="/owner/employees">
            <Button>
              <Plus className="h-4 w-4" /> Add Employee
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Employees" value={m.employees} icon={Users} />
        <MetricCard label="Active Now" value={m.activeNow} icon={Activity} />
        <MetricCard label="Hours Worked" value={m.hoursWorked.toFixed(1)} icon={Clock} hint="Today" />
        <MetricCard label="Sites" value={m.sites} icon={Building2} />
        <MetricCard label="Fatigue Alerts" value={m.fatigueAlerts} icon={ShieldAlert} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Workforce Overview" description="Most recently added">
          {employees.length ? (
            <ul className="divide-y divide-slate-100">
              {employees.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{e.full_name || e.email}</p>
                    <p className="truncate text-xs text-slate-400">{e.site?.name || "Unassigned"}</p>
                  </div>
                  <Badge tone={e.invited_role === "manager" ? "navy" : "slate"}>{e.invited_role}</Badge>
                </li>
              ))}
            </ul>
          ) : (
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
          )}
        </SectionCard>

        <SectionCard title="Site Comparison" description="Hours worked per site, last 7 days">
          {hasSites ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics!.hoursBySite} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="hours" fill={NAVY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={Building2}
              title="No site activity yet."
              description="Create a site and record activity to compare locations."
              action={
                <Link href="/owner/sites">
                  <Button size="sm" variant="secondary">
                    Create Site
                  </Button>
                </Link>
              }
            />
          )}
        </SectionCard>

        <SectionCard title="Fatigue Overview" description="Alerts by risk level">
          {hasRisk ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={analytics!.riskDistribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {analytics!.riskDistribution.map((_, i) => (
                    <Cell key={i} fill={RISK_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={ShieldAlert}
              title="No fatigue data available yet."
              description="Fatigue risk will appear once devices are connected and activity is recorded."
            />
          )}
        </SectionCard>

        <SectionCard title="Activity Patterns" description="People on shift per day">
          {hasActivity ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics!.activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke={NAVY} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={Activity}
              title="No activity data available yet."
              description="Operational patterns will appear as workforce activity is captured."
            />
          )}
        </SectionCard>

        <SectionCard title="Recent Alerts" description="Latest fatigue alerts">
          {alerts.length ? (
            <ul className="divide-y divide-slate-100">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{a.employee?.full_name || a.alert_type}</p>
                    <p className="truncate text-xs text-slate-400">{a.message || a.alert_type}</p>
                  </div>
                  <RiskBadge level={a.risk_level} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Bell} title="No active alerts." description="You're all caught up." />
          )}
        </SectionCard>

        <SectionCard title="Management Insights" description="Derived from today's activity">
          {insights.length ? (
            <ul className="space-y-2.5">
              {insights.map((t, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  {t}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Lightbulb}
              title="Not enough data yet."
              description="Insights will surface once your workforce generates activity."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Analytics" className="mt-4" description="Workforce hours over the last 7 days">
        {hasHours ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analytics!.hoursTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dashHoursFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={NAVY} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="hours" stroke={NAVY} strokeWidth={2} fill="url(#dashHoursFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No data available yet"
            description="Workforce activity will appear here once information is available."
          />
        )}
      </SectionCard>
    </>
  )
}
