"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
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
  AlertCircle,
  ShieldAlert,
  Bell,
  ShieldCheck,
  CalendarClock,
  Watch,
  ClipboardCheck,
  Lightbulb,
  Plus,
  ArrowRight,
  BarChart3,
} from "lucide-react"
import { SectionCard, EmptyState, RiskBadge, Badge } from "@/components/app/primitives"
import { Button } from "@/components/app/controls"
import { FadeIn, CountUp } from "@/components/app/motion"
import { RevealText } from "@/components/reveal-text"
import {
  managerMetrics,
  analyticsData,
  listFatigueAlerts,
  listEmployees,
  subscribeTable,
  type AnalyticsData,
  type FatigueAlertRow,
  type EmployeeRow,
} from "@/lib/supabase/db"

const SKY = "#0284c7"
const RISK_COLORS = ["#22c55e", "#f59e0b", "#ef4444"]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

// The privileges that distinguish a manager from a regular workforce member.
const PRIVILEGES = [
  { label: "Manage team", icon: Users, href: "/manager/employees" },
  { label: "Schedule shifts", icon: CalendarClock, href: "/manager/shifts" },
  { label: "Approve attendance", icon: ClipboardCheck, href: "/manager/attendance" },
  { label: "Assign devices", icon: Watch, href: "/manager/devices" },
  { label: "Monitor fatigue", icon: ShieldAlert, href: "/manager/fatigue" },
]

export default function ManagerDashboard() {
  const [m, setM] = useState({ onShift: 0, working: 0, late: 0, hoursWorked: 0, moderate: 0, high: 0 })
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [alerts, setAlerts] = useState<FatigueAlertRow[]>([])
  const [employees, setEmployees] = useState<EmployeeRow[]>([])

  useEffect(() => {
    const load = () => {
      managerMetrics().then(setM).catch(() => {})
      analyticsData().then(setAnalytics).catch(() => setAnalytics(null))
      listFatigueAlerts().then((a) => setAlerts(a.slice(0, 5))).catch(() => setAlerts([]))
      listEmployees().then((e) => setEmployees(e.slice(0, 6))).catch(() => setEmployees([]))
    }
    load()
    const a = subscribeTable("attendance_records", load)
    const b = subscribeTable("fatigue_alerts", load)
    const c = subscribeTable("employees", load)
    return () => {
      a()
      b()
      c()
    }
  }, [])

  const hasHours = !!analytics && analytics.hoursTrend.some((d) => d.hours > 0)
  const hasActivity = !!analytics && analytics.activityTrend.some((d) => d.present > 0)
  const hasRisk = !!analytics && analytics.riskDistribution.some((d) => d.value > 0)
  const hasSites = !!analytics && analytics.hoursBySite.some((d) => d.hours > 0)

  const highRisk = alerts.filter((a) => a.risk_level === "high" && !a.acknowledged)

  const insights: string[] = []
  if (m.working > 0) insights.push(`${m.working} ${m.working === 1 ? "person is" : "people are"} actively working right now.`)
  if (m.late > 0) insights.push(`${m.late} late arrival${m.late === 1 ? "" : "s"} recorded today — review attendance.`)
  if (m.high > 0) insights.push(`${m.high} high-risk fatigue alert${m.high === 1 ? "" : "s"} need your attention.`)
  if (m.hoursWorked > 0) insights.push(`${m.hoursWorked.toFixed(1)} hours logged across your team today.`)

  const metrics = [
    { label: "On Shift", value: m.onShift, icon: Users, decimals: 0 },
    { label: "Working Now", value: m.working, icon: Activity, decimals: 0 },
    { label: "Late Arrivals", value: m.late, icon: AlertCircle, decimals: 0 },
    { label: "Hours Today", value: m.hoursWorked, icon: Clock, decimals: 1 },
    { label: "Moderate Risk", value: m.moderate, icon: ShieldAlert, decimals: 0 },
    { label: "High Risk", value: m.high, icon: ShieldAlert, decimals: 0 },
  ]

  return (
    <>
      {/* ── Privileged hero ─────────────────────────────────────────────── */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl border border-sky-900/30 bg-linear-to-br from-[#075985] via-[#0369a1] to-[#0284c7] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-300/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-blue-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-sky-50 ring-1 ring-inset ring-white/20">
                  <ShieldCheck className="h-3.5 w-3.5" /> Manager access
                </span>
                <RevealText as="h1" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {greeting()}
                </RevealText>
                <p className="mt-1.5 max-w-xl text-sm text-sky-50/80">
                  Your control center for the workforce — manage people, shifts, attendance and wellbeing across your sites.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href="/manager/employees">
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-4 text-sm font-medium text-[#075985] transition-colors hover:bg-sky-50">
                    <Plus className="h-4 w-4" /> Add Employee
                  </button>
                </Link>
                <Link href="/manager/shifts">
                  <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/10 px-4 text-sm font-medium text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/20">
                    <CalendarClock className="h-4 w-4" /> Create Shift
                  </button>
                </Link>
              </div>
            </div>

            {/* Privilege pills */}
            <div className="flex flex-wrap gap-2">
              {PRIVILEGES.map((p, i) => (
                <FadeIn key={p.label} delay={120 + i * 60} y={8}>
                  <Link
                    href={p.href}
                    className="group inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-sky-50 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20"
                  >
                    <p.icon className="h-3.5 w-3.5" />
                    {p.label}
                    <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── Metric tiles ────────────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((tile, i) => (
          <FadeIn key={tile.label} delay={i * 70} y={14}>
            <div className="group h-full rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{tile.label}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100">
                  <tile.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                <CountUp value={tile.value} decimals={tile.decimals} />
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <FadeIn delay={40}>
          <SectionCard title="Workforce Activity" description="Hours worked across your team, last 7 days">
            {hasHours ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={analytics!.hoursTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mgrHoursFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SKY} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={SKY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="hours" stroke={SKY} strokeWidth={2} fill="url(#mgrHoursFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart3} title="No hours recorded yet." description="Trends appear as your team works shifts." />
            )}
          </SectionCard>
        </FadeIn>

        <FadeIn delay={100}>
          <SectionCard title="People on Shift" description="Team members present per day">
            {hasActivity ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={analytics!.activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="present" stroke={SKY} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Activity} title="No activity data yet." description="Attendance patterns build up as shifts are worked." />
            )}
          </SectionCard>
        </FadeIn>

        <FadeIn delay={40}>
          <SectionCard title="Fatigue Risk" description="Active alerts by risk level">
            {hasRisk ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={analytics!.riskDistribution} dataKey="value" nameKey="name" innerRadius={48} outerRadius={84} paddingAngle={2}>
                    {analytics!.riskDistribution.map((_, i) => (
                      <Cell key={i} fill={RISK_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={ShieldAlert} title="No fatigue data yet." description="Risk levels appear once devices report activity." />
            )}
          </SectionCard>
        </FadeIn>

        <FadeIn delay={100}>
          <SectionCard title="Site Load" description="Hours worked per site, last 7 days">
            {hasSites ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={analytics!.hoursBySite} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                  <XAxis dataKey="site" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="hours" fill={SKY} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart3} title="No site activity yet." description="Compare locations once activity is recorded." />
            )}
          </SectionCard>
        </FadeIn>
      </div>

      {/* ── Team + alerts + insights ────────────────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <FadeIn delay={40} className="lg:col-span-1">
          <SectionCard
            title="Your Team"
            description="Recently added"
            action={
              <Link href="/manager/employees" className="text-xs font-medium text-sky-700 hover:underline">
                View all
              </Link>
            }
          >
            {employees.length ? (
              <ul className="divide-y divide-slate-100">
                {employees.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-700">
                        {(e.full_name || e.email || "?").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{e.full_name || e.email}</p>
                        <p className="truncate text-xs text-slate-400">{e.site?.name || "Unassigned"}</p>
                      </div>
                    </div>
                    <Badge tone={e.invited_role === "manager" ? "navy" : "slate"}>{e.invited_role}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Users}
                title="No team members yet."
                description="Add your first employee to start tracking attendance and fatigue."
                action={
                  <Link href="/manager/employees">
                    <Button size="sm">
                      <Plus className="h-4 w-4" /> Add Employee
                    </Button>
                  </Link>
                }
              />
            )}
          </SectionCard>
        </FadeIn>

        <FadeIn delay={100} className="lg:col-span-1">
          <SectionCard
            title="Priority Alerts"
            description="High-risk fatigue signals"
            action={
              <Link href="/manager/alerts" className="text-xs font-medium text-sky-700 hover:underline">
                View all
              </Link>
            }
          >
            {highRisk.length ? (
              <ul className="divide-y divide-slate-100">
                {highRisk.map((a) => (
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
              <EmptyState icon={Bell} title="No priority alerts." description="You're all caught up." />
            )}
          </SectionCard>
        </FadeIn>

        <FadeIn delay={160} className="lg:col-span-1">
          <SectionCard title="Manager Insights" description="Derived from today's activity">
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
              <EmptyState icon={Lightbulb} title="Not enough data yet." description="Insights surface once your team generates activity." />
            )}
          </SectionCard>
        </FadeIn>
      </div>
    </>
  )
}
