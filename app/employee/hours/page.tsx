"use client"

import { useEffect, useMemo, useState } from "react"
import { Clock, BarChart3, CalendarDays, Timer } from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"
import { PageHeader, MetricCard, SectionCard, EmptyState, DataTable, Badge } from "@/components/app/primitives"
import { FadeIn } from "@/components/app/motion"
import { myHoursSummary, listMyAttendance, subscribeTable, type AttendanceRow } from "@/lib/supabase/db"

const EMERALD = "#059669"
const AMBER = "#f59e0b"

function fmt(h: number) {
  const totalMin = Math.round(h * 60)
  return `${Math.floor(totalMin / 60)}h ${String(totalMin % 60).padStart(2, "0")}m`
}

export default function EmployeeHoursPage() {
  const [hours, setHours] = useState({ today: 0, week: 0, month: 0 })
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])

  useEffect(() => {
    const load = () => {
      myHoursSummary().then(setHours).catch(() => {})
      listMyAttendance(60).then(setAttendance).catch(() => setAttendance([]))
    }
    load()
    return subscribeTable("attendance_records", load)
  }, [])

  const overtime = useMemo(
    () => attendance.reduce((s, a) => s + Number(a.overtime_hours || 0), 0),
    [attendance],
  )

  const trend = useMemo(() => {
    const days: { label: string; hours: number; regular: number; overtime: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000)
      const date = d.toISOString().slice(0, 10)
      const recs = attendance.filter((a) => a.date === date)
      days.push({
        label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        hours: Number(recs.reduce((s, a) => s + Number(a.hours_worked || 0), 0).toFixed(2)),
        regular: Number(recs.reduce((s, a) => s + Number(a.regular_hours || 0), 0).toFixed(2)),
        overtime: Number(recs.reduce((s, a) => s + Number(a.overtime_hours || 0), 0).toFixed(2)),
      })
    }
    return days
  }, [attendance])

  const hasTrend = trend.some((d) => d.hours > 0)
  const hasSplit = trend.some((d) => d.regular > 0 || d.overtime > 0)
  const worked = attendance.filter((a) => Number(a.hours_worked || 0) > 0)

  return (
    <>
      <PageHeader title="My Hours" description="Your regular and overtime hours over time." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FadeIn delay={0} y={14}>
          <MetricCard label="Today" value={fmt(hours.today)} icon={Clock} />
        </FadeIn>
        <FadeIn delay={70} y={14}>
          <MetricCard label="This Week" value={fmt(hours.week)} icon={CalendarDays} />
        </FadeIn>
        <FadeIn delay={140} y={14}>
          <MetricCard label="This Month" value={fmt(hours.month)} icon={BarChart3} />
        </FadeIn>
        <FadeIn delay={210} y={14}>
          <MetricCard label="Overtime" value={fmt(overtime)} icon={Timer} hint="Last 60 records" />
        </FadeIn>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <FadeIn delay={40}>
          <SectionCard title="Hours Over Time" description="Hours worked per day, last 14 days">
            {hasTrend ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="empHoursFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={EMERALD} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="hours" stroke={EMERALD} strokeWidth={2} fill="url(#empHoursFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={BarChart3} title="No hours recorded yet." description="Your working hours will appear here as you work shifts." />
            )}
          </SectionCard>
        </FadeIn>

        <FadeIn delay={100}>
          <SectionCard title="Regular vs Overtime" description="Split per day, last 14 days">
            {hasSplit ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="regular" name="Regular" stackId="h" fill={EMERALD} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="overtime" name="Overtime" stackId="h" fill={AMBER} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Timer} title="No overtime data yet." description="Regular and overtime splits appear as shifts are completed." />
            )}
          </SectionCard>
        </FadeIn>
      </div>

      <div className="mt-6">
        <DataTable
          columns={["Date", "Regular", "Overtime", "Total", "Status"]}
          empty={
            <EmptyState icon={Clock} title="No completed shifts yet." description="A daily breakdown appears once you finish shifts." />
          }
          rows={
            worked.length
              ? worked.slice(0, 20).map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-700">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-600">{fmt(Number(a.regular_hours || 0))}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {Number(a.overtime_hours || 0) > 0 ? (
                        <span className="font-medium text-amber-600">{fmt(Number(a.overtime_hours || 0))}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{fmt(Number(a.hours_worked || 0))}</td>
                    <td className="px-4 py-3">
                      <Badge tone={a.status === "present" ? "green" : a.status === "late" ? "amber" : "slate"}>{a.status}</Badge>
                    </td>
                  </tr>
                ))
              : undefined
          }
        />
      </div>
    </>
  )
}
