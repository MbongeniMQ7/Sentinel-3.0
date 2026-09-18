"use client"

import { useEffect, useState } from "react"
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
  Legend,
  CartesianGrid,
} from "recharts"
import { PageHeader, SectionCard } from "@/components/app/primitives"
import { analyticsData, subscribeTable, type AnalyticsData } from "@/lib/supabase/db"

const RISK_COLORS = ["#22c55e", "#f59e0b", "#ef4444"]
const NAVY = "#0f2a4a"

function sampleAnalytics(): AnalyticsData {
  const hours = [128, 144, 136, 160, 152, 120, 104]
  const people = [16, 18, 17, 20, 19, 15, 13]
  const days = hours.map((_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return { date: date.toISOString().slice(0, 10), label: date.toLocaleDateString(undefined, { weekday: "short" }) }
  })
  return {
    hoursTrend: days.map((day, index) => ({ ...day, hours: hours[index] })),
    activityTrend: days.map((day, index) => ({ ...day, present: people[index] })),
    riskDistribution: [{ name: "Low", value: 14 }, { name: "Moderate", value: 4 }, { name: "High", value: 2 }],
    hoursBySite: [{ site: "Main Plant", hours: 448 }, { site: "North Depot", hours: 312 }, { site: "West Yard", hours: 184 }],
  }
}

function ChartLoading() {
  return <div role="status" className="flex h-[260px] items-center justify-center text-sm text-slate-500">Loading analytics...</div>
}

export default function OwnerAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () => analyticsData().then(setData).catch(() => setData(null)).finally(() => setLoading(false))
    load()
    const a = subscribeTable("attendance_records", load)
    const b = subscribeTable("fatigue_assessments", load)
    return () => {
      a()
      b()
    }
  }, [])

  const hasHours = !!data && data.hoursTrend.some((d) => d.hours > 0)
  const hasRisk = !!data && data.riskDistribution.some((d) => d.value > 0)
  const hasSites = !!data && data.hoursBySite.some((d) => d.hours > 0)
  const hasActivity = !!data && data.activityTrend.some((d) => d.present > 0)
  const samples = sampleAnalytics()
  const charts = {
    hoursTrend: hasHours ? data!.hoursTrend : samples.hoursTrend,
    riskDistribution: hasRisk ? data!.riskDistribution : samples.riskDistribution,
    hoursBySite: hasSites ? data!.hoursBySite : samples.hoursBySite,
    activityTrend: hasActivity ? data!.activityTrend : samples.activityTrend,
  }
  const source = (hasLiveData: boolean) => loading ? "Loading" : hasLiveData ? data?.includesSamples ? "Includes sample records" : "Recorded data" : "Sample data"

  return (
    <>
      <PageHeader title="Analytics" description="Workforce trends and operational insights." />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Workforce Hours Trend" description={`Total hours worked, last 7 days. ${source(hasHours)}`}>
          {!loading ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={charts.hoursTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hoursFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area name="Hours worked" type="monotone" dataKey="hours" stroke={NAVY} strokeWidth={2} fill="url(#hoursFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ChartLoading />
          )}
        </SectionCard>

        <SectionCard title="Risk Distribution" description={`Latest employee assessments. ${source(hasRisk)}`}>
          {!loading ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={charts.riskDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {charts.riskDistribution.map((_, i) => (
                    <Cell key={i} fill={RISK_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ChartLoading />
          )}
        </SectionCard>

        <SectionCard title="Hours by Site" description={`Total hours worked per location, last 7 days. ${source(hasSites)}`}>
          {!loading ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts.hoursBySite} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar name="Hours worked" dataKey="hours" fill={NAVY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartLoading />
          )}
        </SectionCard>

        <SectionCard title="Activity Patterns" description={`People on shift per day, last 7 days. ${source(hasActivity)}`}>
          {!loading ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={charts.activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line name="People on shift" type="monotone" dataKey="present" stroke={NAVY} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartLoading />
          )}
        </SectionCard>
      </div>
    </>
  )
}
