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
  CartesianGrid,
} from "recharts"
import { BarChart3, PieChart as PieIcon, TrendingUp, Activity } from "lucide-react"
import { PageHeader, SectionCard, EmptyState } from "@/components/app/primitives"
import { analyticsData, subscribeTable, type AnalyticsData } from "@/lib/supabase/db"

const RISK_COLORS = ["#22c55e", "#f59e0b", "#ef4444"]
const NAVY = "#0f2a4a"

export default function OwnerAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    const load = () => analyticsData().then(setData).catch(() => setData(null))
    load()
    const a = subscribeTable("attendance_records", load)
    const b = subscribeTable("fatigue_alerts", load)
    return () => {
      a()
      b()
    }
  }, [])

  const hasHours = !!data && data.hoursTrend.some((d) => d.hours > 0)
  const hasRisk = !!data && data.riskDistribution.some((d) => d.value > 0)
  const hasSites = !!data && data.hoursBySite.some((d) => d.hours > 0)
  const hasActivity = !!data && data.activityTrend.some((d) => d.present > 0)

  return (
    <>
      <PageHeader title="Analytics" description="Workforce trends and operational insights." />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Workforce Hours Trend" description="Total hours worked, last 7 days">
          {hasHours ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data!.hoursTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Area type="monotone" dataKey="hours" stroke={NAVY} strokeWidth={2} fill="url(#hoursFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={TrendingUp} title="No data available yet" description="Trends will appear once activity is recorded." />
          )}
        </SectionCard>

        <SectionCard title="Risk Distribution" description="Fatigue alerts by risk level">
          {hasRisk ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data!.riskDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {data!.riskDistribution.map((_, i) => (
                    <Cell key={i} fill={RISK_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={PieIcon} title="No fatigue data available" description="Risk distribution needs device and activity data." />
          )}
        </SectionCard>

        <SectionCard title="Hours by Site" description="Total hours worked per location, last 7 days">
          {hasSites ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data!.hoursBySite} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                <XAxis dataKey="site" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="hours" fill={NAVY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={BarChart3} title="No data available yet" description="Working-hour comparisons appear once sites are active." />
          )}
        </SectionCard>

        <SectionCard title="Activity Patterns" description="People on shift per day, last 7 days">
          {hasActivity ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data!.activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke={NAVY} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Activity} title="No activity data available yet" description="Patterns build up as your workforce operates." />
          )}
        </SectionCard>
      </div>
    </>
  )
}
