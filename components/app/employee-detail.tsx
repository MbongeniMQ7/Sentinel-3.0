"use client"

// Full employee drill-down for managers/owners: live device telemetry,
// attendance, working hours and fatigue for any employee in the org.
import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  UserRound,
  Clock,
  ClipboardList,
  ShieldAlert,
  Watch,
  Battery,
  Wifi,
  HeartPulse,
  Activity,
  Thermometer,
  Footprints,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { PageHeader, SectionCard, EmptyState, MetricCard, Badge, RiskBadge } from "@/components/app/primitives"
import { cn } from "@/lib/utils"
import { useLiveVitals, useNow, timeAgo } from "@/hooks/use-live-vitals"
import {
  getEmployee,
  getEmployeeDevice,
  listEmployeeAttendance,
  listEmployeeBiometrics,
  listEmployeeAssessments,
  listEmployeeAlerts,
  subscribeTable,
  type EmployeeRow,
  type DeviceRow,
  type BiometricRow,
  type AttendanceRow,
  type FatigueAssessmentRow,
  type FatigueAlertRow,
} from "@/lib/supabase/db"

const TABS = ["Overview", "Attendance", "Working Hours", "Fatigue", "Device"] as const
const NAVY = "#0f2a4a"

function fmtHours(h: number) {
  const totalMin = Math.round(h * 60)
  return `${Math.floor(totalMin / 60)}h ${String(totalMin % 60).padStart(2, "0")}m`
}

function LivePulse() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      LIVE
    </span>
  )
}

function VitalCard({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof HeartPulse
  label: string
  value: string | number
  unit?: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4 text-slate-400" /> {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold text-slate-900">
        {value}
        {unit ? <span className="ml-1 text-xs font-medium text-slate-400">{unit}</span> : null}
      </div>
    </div>
  )
}

function LiveVitalsGrid({ latest, device }: { latest: BiometricRow | null; device: DeviceRow | null }) {
  const live = useLiveVitals(latest)
  const now = useNow(1000)
  if (!latest) {
    return (
      <EmptyState icon={HeartPulse} title="Waiting for first reading." description="Vitals appear as soon as the wristband syncs." />
    )
  }
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">Streaming • last sync {timeAgo(latest.reading_time, now)}</span>
        {device?.connection_status === "connected" && <LivePulse />}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <VitalCard icon={HeartPulse} label="Heart Rate" value={live.heart_rate ?? latest.heart_rate ?? "—"} unit="bpm" />
        <VitalCard icon={Activity} label="HRV" value={live.hrv ?? latest.hrv ?? "—"} unit="ms" />
        <VitalCard icon={Thermometer} label="Skin Temp" value={live.skin_temperature ?? latest.skin_temperature ?? "—"} unit="°C" />
        <VitalCard icon={Footprints} label="Movement" value={latest.movement ?? "—"} />
      </div>
    </>
  )
}

export function EmployeeDetail({ employeeId, backHref }: { employeeId: string; backHref: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview")
  const [employee, setEmployee] = useState<EmployeeRow | null>(null)
  const [device, setDevice] = useState<DeviceRow | null>(null)
  const [readings, setReadings] = useState<BiometricRow[]>([])
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [assessments, setAssessments] = useState<FatigueAssessmentRow[]>([])
  const [alerts, setAlerts] = useState<FatigueAlertRow[]>([])
  const now = useNow(1000)

  const load = useCallback(() => {
    getEmployee(employeeId).then(setEmployee).catch(() => setEmployee(null))
    getEmployeeDevice(employeeId).then(setDevice).catch(() => setDevice(null))
    listEmployeeBiometrics(employeeId).then(setReadings).catch(() => setReadings([]))
    listEmployeeAttendance(employeeId).then(setAttendance).catch(() => setAttendance([]))
    listEmployeeAssessments(employeeId).then(setAssessments).catch(() => setAssessments([]))
    listEmployeeAlerts(employeeId).then(setAlerts).catch(() => setAlerts([]))
  }, [employeeId])

  useEffect(() => {
    load()
    const subs = [
      subscribeTable("devices", load),
      subscribeTable("biometric_readings", load),
      subscribeTable("attendance_records", load),
      subscribeTable("fatigue_assessments", load),
      subscribeTable("fatigue_alerts", load),
    ]
    return () => subs.forEach((u) => u())
  }, [load])

  const latest = readings[0] ?? null
  const latestAssessment = assessments[0] ?? null

  const todayStr = new Date().toISOString().slice(0, 10)
  const hoursToday = attendance
    .filter((a) => a.date === todayStr)
    .reduce((s, a) => s + Number(a.hours_worked || 0), 0)
  const weekAgo = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10)
  const hoursWeek = attendance
    .filter((a) => a.date >= weekAgo)
    .reduce((s, a) => s + Number(a.hours_worked || 0), 0)

  const hoursChart = useMemo(() => {
    const days: { date: string; label: string; hours: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000)
      const date = d.toISOString().slice(0, 10)
      days.push({
        date,
        label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        hours: attendance.filter((a) => a.date === date).reduce((s, a) => s + Number(a.hours_worked || 0), 0),
      })
    }
    return days
  }, [attendance])

  const fatigueTrend = useMemo(() => {
    const byDay = new Map<string, { sum: number; n: number }>()
    for (const a of assessments) {
      const day = a.assessed_at.slice(0, 10)
      const b = byDay.get(day) ?? { sum: 0, n: 0 }
      b.sum += Number(a.fatigue_score ?? 0)
      b.n++
      byDay.set(day, b)
    }
    return [...byDay.entries()]
      .sort(([x], [y]) => x.localeCompare(y))
      .map(([day, b]) => ({
        label: new Date(day).toLocaleDateString(undefined, { weekday: "short" }),
        score: Number((b.sum / b.n).toFixed(1)),
      }))
  }, [assessments])

  const name = employee?.full_name || employee?.email || "Employee"

  return (
    <>
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to employees
      </Link>

      <PageHeader
        title={name}
        description={
          employee
            ? `${employee.role_title || employee.invited_role} • ${employee.site?.name ?? "Unassigned"}`
            : "Loading employee…"
        }
        actions={
          employee ? <Badge tone={employee.status === "active" ? "green" : "slate"}>{employee.status}</Badge> : undefined
        }
      />

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
              tab === t ? "border-(--brand) font-medium text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard label="Hours Today" value={fmtHours(hoursToday)} icon={Clock} />
            <MetricCard label="This Week" value={fmtHours(hoursWeek)} icon={Clock} />
            <MetricCard
              label="Fatigue Risk"
              value={latestAssessment ? latestAssessment.risk_level : "—"}
              icon={ShieldAlert}
            />
            <MetricCard label="Device" value={device ? device.connection_status : "None"} icon={Watch} />
          </div>

          <SectionCard title="Live Vitals" description={device ? device.device_id : undefined}>
            {device ? (
              <LiveVitalsGrid latest={latest} device={device} />
            ) : (
              <EmptyState icon={Watch} title="No wristband assigned." description="A device will be provisioned automatically." />
            )}
          </SectionCard>

          <SectionCard title="Profile">
            {employee ? (
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Full name</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{employee.full_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
                  <dd className="mt-0.5 text-slate-700">{employee.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</dt>
                  <dd className="mt-0.5 capitalize text-slate-700">{employee.role_title || employee.invited_role}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Site</dt>
                  <dd className="mt-0.5 text-slate-700">{employee.site?.name ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Login</dt>
                  <dd className="mt-0.5">
                    <Badge tone={employee.user_id ? "navy" : "amber"}>{employee.user_id ? "Active login" : "Invited"}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Added</dt>
                  <dd className="mt-0.5 text-slate-700">{new Date(employee.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            ) : (
              <EmptyState icon={UserRound} title="Employee not found." description="This person may have been removed." />
            )}
          </SectionCard>
        </div>
      )}

      {tab === "Attendance" && (
        <SectionCard title="Attendance" description="Most recent records first.">
          {attendance.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No attendance records." description="Records appear once this employee clocks in." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Clock In</th>
                    <th className="px-3 py-2 font-medium">Clock Out</th>
                    <th className="px-3 py-2 font-medium">Hours</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a) => (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2 font-medium text-slate-700">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {a.clock_in_time ? new Date(a.clock_in_time).toLocaleTimeString() : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {a.clock_out_time ? new Date(a.clock_out_time).toLocaleTimeString() : a.clock_in_time ? "In progress" : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{a.hours_worked ? fmtHours(Number(a.hours_worked)) : "—"}</td>
                      <td className="px-3 py-2">
                        <Badge tone={a.status === "present" ? "green" : a.status === "late" ? "amber" : "slate"}>{a.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {tab === "Working Hours" && (
        <SectionCard title="Working Hours" description="Hours worked per day, last 14 days.">
          {hoursChart.some((d) => d.hours > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={hoursChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="hours" fill={NAVY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Clock} title="No working-hour data." description="Hours accumulate as shifts are worked." />
          )}
        </SectionCard>
      )}

      {tab === "Fatigue" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Latest Assessment" description={latestAssessment ? timeAgo(latestAssessment.assessed_at, now) : undefined}>
            {latestAssessment ? (
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-3xl font-semibold text-slate-900">{Math.round(Number(latestAssessment.fatigue_score ?? 0))}</div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Fatigue score</div>
                </div>
                <RiskBadge level={latestAssessment.risk_level} />
              </div>
            ) : (
              <EmptyState icon={ShieldAlert} title="No fatigue data." description="Fatigue risk requires device and activity data." />
            )}
          </SectionCard>

          <SectionCard title="Risk Trend" description="Average fatigue score per day, last 7 days.">
            {fatigueTrend.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={fatigueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke={NAVY} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Activity} title="No trend data yet." description="Trends build as readings accumulate." />
            )}
          </SectionCard>

          <SectionCard title="Alerts" className="lg:col-span-2">
            {alerts.length === 0 ? (
              <EmptyState icon={ShieldAlert} title="No alerts." description="Fatigue and safety alerts will be listed here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {alerts.slice(0, 10).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-slate-700">{a.message || a.alert_type}</p>
                      <p className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                    <RiskBadge level={a.risk_level} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      {tab === "Device" && (
        <div className="grid gap-4">
          <SectionCard title="Wristband">
            {device ? (
              <div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                    <Watch className="h-6 w-6 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{device.device_id}</p>
                    <Badge tone={device.connection_status === "connected" ? "green" : device.connection_status === "syncing" ? "amber" : "slate"}>
                      {device.connection_status}
                    </Badge>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <Battery className="h-4 w-4 text-slate-400" /> Battery
                    </div>
                    <div className="mt-1.5 text-lg font-semibold text-slate-900">{device.battery_level ?? "—"}%</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <Wifi className="h-4 w-4 text-slate-400" /> Last Sync
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-slate-700">{timeAgo(device.last_sync_time, now)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={Watch} title="No wristband assigned." description="A device will be provisioned automatically." />
            )}
          </SectionCard>

          {device && (
            <SectionCard title="Live Vitals">
              <LiveVitalsGrid latest={latest} device={device} />
            </SectionCard>
          )}

          {device && readings.length > 0 && (
            <SectionCard title="Recent Readings" description="Latest wristband syncs.">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2 font-medium">Time</th>
                      <th className="px-3 py-2 font-medium">HR</th>
                      <th className="px-3 py-2 font-medium">HRV</th>
                      <th className="px-3 py-2 font-medium">Temp</th>
                      <th className="px-3 py-2 font-medium">Movement</th>
                      <th className="px-3 py-2 font-medium">Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.slice(0, 12).map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2 text-slate-600">{new Date(r.reading_time).toLocaleTimeString()}</td>
                        <td className="px-3 py-2 font-medium text-slate-700">{r.heart_rate ?? "—"} bpm</td>
                        <td className="px-3 py-2 text-slate-600">{r.hrv ?? "—"} ms</td>
                        <td className="px-3 py-2 text-slate-600">{r.skin_temperature ?? "—"}°C</td>
                        <td className="px-3 py-2 capitalize text-slate-600">{r.movement ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-600">{r.activity_score ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </>
  )
}
