"use client"

import { useEffect, useMemo, useState } from "react"
import { ClipboardList, Download, CalendarCheck, AlertCircle, Clock, BarChart3, RefreshCw, X } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { PageHeader, DataTable, EmptyState, Badge, MetricCard } from "@/components/app/primitives"
import { Button, Input, Select } from "@/components/app/controls"
import { Toast } from "@/components/app/toast"
import { FadeIn } from "@/components/app/motion"
import { downloadCsv, type ReportData } from "@/lib/reports"
import { listMyAttendance, subscribeTable, type AttendanceRow } from "@/lib/supabase/db"

function time(v: string | null) {
  return v ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"
}

function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const statusColors: Record<string, string> = { present: "#059669", late: "#d97706", absent: "#e11d48" }

export default function EmployeeAttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [dateFilter, setDateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    let request = 0
    const load = async () => {
      const currentRequest = ++request
      try {
        const records = await listMyAttendance(90)
        if (active && currentRequest === request) {
          setRows(records)
          setError(false)
        }
      } catch {
        if (active && currentRequest === request) setError(true)
      } finally {
        if (active && currentRequest === request) setLoading(false)
      }
    }
    void load()
    const unsubscribe = subscribeTable("attendance_records", load)
    return () => {
      active = false
      unsubscribe()
    }
  }, [retry])

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (dateFilter && r.date !== dateFilter) return false
        if (statusFilter && r.status !== statusFilter) return false
        return true
      }),
    [rows, dateFilter, statusFilter],
  )

  const stats = useMemo(() => {
    const present = filtered.filter((r) => r.status === "present").length
    const late = filtered.filter((r) => r.status === "late").length
    const hours = filtered.reduce((s, r) => s + Number(r.hours_worked || 0), 0)
    return { present, late, hours }
  }, [filtered])

  const dailyHours = useMemo(() => {
    const days = new Map<string, number>()
    for (const record of filtered) {
      days.set(record.date, (days.get(record.date) ?? 0) + Number(record.hours_worked || 0))
    }
    return Array.from(days, ([date, hours]) => ({ date, hours: Number(hours.toFixed(2)) }))
      .sort((first, second) => first.date.localeCompare(second.date))
  }, [filtered])

  const statuses = useMemo(() => {
    const counts = new Map<string, number>()
    for (const record of filtered) counts.set(record.status, (counts.get(record.status) ?? 0) + 1)
    return Array.from(counts, ([name, value]) => ({ name, value, color: statusColors[name] ?? "#64748b" }))
      .sort((first, second) => second.value - first.value || first.name.localeCompare(second.name))
  }, [filtered])

  function handleExport() {
    if (!filtered.length) {
      setToast("There are no records to export.")
      return
    }
    const data: ReportData = {
      title: "My Attendance",
      columns: ["Date", "Clock In", "Clock Out", "Hours", "Status"],
      rows: filtered.map((r) => [
        new Date(r.date).toLocaleDateString(),
        time(r.clock_in_time),
        time(r.clock_out_time),
        Number(r.hours_worked || 0).toFixed(2),
        r.status,
      ]),
      summary: [{ label: "Records", value: String(filtered.length) }],
    }
    downloadCsv(data, { siteName: "My records", range: "all" })
    setToast(`Exported ${filtered.length} record${filtered.length === 1 ? "" : "s"}.`)
  }

  return (
    <>
      <PageHeader
        title="My Attendance"
        description="Your time at work, at a glance."
        actions={
          <Button variant="secondary" onClick={handleExport} disabled={loading || error || !filtered.length}>
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-y border-slate-200 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><BarChart3 className="h-5 w-5" /></div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Attendance overview</h2>
            <p className="text-xs text-slate-500">Latest 90 records{!loading && !error && rows.length ? ` · ${dateLabel(rows[rows.length - 1].date)} – ${dateLabel(rows[0].date)}` : ""}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
          <label className="min-w-0 flex-1 text-xs font-medium text-slate-600 sm:flex-none">
            Date
            <Input className="mt-1" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
          </label>
          <label className="min-w-0 flex-1 text-xs font-medium text-slate-600 sm:flex-none">
            Status
            <Select className="mt-1" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              {Array.from(new Set(["present", "late", "absent", ...rows.map((record) => record.status)])).map((status) => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </Select>
          </label>
          {(dateFilter || statusFilter) && <Button variant="ghost" className="w-9 px-0" title="Clear filters" aria-label="Clear filters" onClick={() => { setDateFilter(""); setStatusFilter("") }}><X className="h-4 w-4" /></Button>}
        </div>
      </div>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Attendance could not be loaded.
          <Button variant="secondary" onClick={() => { setLoading(true); setError(false); setRetry((value) => value + 1) }}><RefreshCw className="h-4 w-4" /> Retry</Button>
        </div>
      ) : loading ? (
        <div role="status" className="flex h-72 items-center justify-center gap-2 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Loading attendance...</div>
      ) : <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FadeIn delay={0} y={14}>
          <MetricCard label="Present" value={stats.present} icon={CalendarCheck} hint="Records marked present" />
        </FadeIn>
        <FadeIn delay={70} y={14}>
          <MetricCard label="Late Arrivals" value={stats.late} icon={AlertCircle} hint="Records marked late" />
        </FadeIn>
        <FadeIn delay={140} y={14}>
          <MetricCard label="Total Hours" value={stats.hours.toFixed(1)} icon={Clock} hint="Recorded hours worked" />
        </FadeIn>
        <FadeIn delay={210} y={14}>
          <MetricCard label="Records" value={filtered.length} icon={ClipboardList} hint="Matching current filters" />
        </FadeIn>
      </div>

      {filtered.length > 0 && (
        <div className="my-7 grid min-w-0 gap-6 border-y border-slate-200 py-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section aria-label="Daily recorded hours" className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Hours by day</h2>
              <span className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-sm bg-sky-600" /> Recorded hours</span>
            </div>
            <div className="h-64 w-full" role="img" aria-label={`${stats.hours.toFixed(2)} recorded hours across ${dailyHours.length} dates. Details in the attendance history table.`}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={dailyHours} margin={{ top: 12, right: 8, left: -22, bottom: 0 }} accessibilityLayer>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={dateLabel} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} minTickGap={28} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} unit="h" />
                  <Tooltip cursor={{ fill: "#f0f9ff" }} labelFormatter={(value) => dateLabel(String(value))} formatter={(value: number) => [`${value.toFixed(2)} h`, "Recorded hours"]} contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="hours" fill="#0284c7" radius={[3, 3, 0, 0]} maxBarSize={32} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section aria-label="Attendance status breakdown" className="min-w-0 border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <h2 className="text-sm font-semibold text-slate-900">Attendance mix</h2>
            <div className="relative mx-auto h-44 w-full max-w-64" role="img" aria-label={statuses.map((status) => `${status.name}: ${status.value}`).join(", ")}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={statuses} dataKey="value" nameKey="name" innerRadius={55} outerRadius={74} paddingAngle={statuses.length > 1 ? 3 : 0} stroke="none" isAnimationActive={false}>
                    {statuses.map((status) => <Cell key={status.name} fill={status.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold tabular-nums text-slate-900">{filtered.length}</span><span className="text-xs text-slate-500">records</span></div>
            </div>
            <ul className="space-y-2">
              {statuses.map((status) => (
                <li key={status.name} className="flex items-center gap-2 text-xs"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: status.color }} /><span className="capitalize text-slate-600">{status.name}</span><span className="ml-auto font-medium tabular-nums text-slate-900">{status.value}</span><span className="w-12 text-right tabular-nums text-slate-500">{Math.round(status.value / filtered.length * 100)}%</span></li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <div className="mb-3 mt-6 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Attendance history</h2>
        <span className="text-xs text-slate-500">{filtered.length} records</span>
      </div>

      <DataTable
        columns={["Date", "Clock In", "Clock Out", "Hours", "Status", "Correction"]}
        empty={
          <EmptyState
            icon={ClipboardList}
            title={rows.length ? "No matching records." : "No attendance records yet."}
            description={rows.length ? "No records for the selected date and status." : "Your attendance appears here once you start clocking in."}
          />
        }
        rows={
          filtered.length
            ? filtered.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-700">{new Date(`${a.date}T12:00:00`).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{time(a.clock_in_time)}</td>
                  <td className="px-4 py-3 text-slate-600">{time(a.clock_out_time)}</td>
                  <td className="px-4 py-3 text-slate-600">{Number(a.hours_worked || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={a.status === "present" ? "green" : a.status === "late" ? "amber" : a.status === "absent" ? "red" : "slate"}>{a.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {a.correction_requested ? <Badge tone="amber">Requested</Badge> : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))
            : undefined
        }
      />
      </>}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
