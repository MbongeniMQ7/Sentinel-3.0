// Report generation — builds datasets from live Supabase data and turns them
// into downloadable files: a branded, print-ready PDF (per requested site) and
// a raw CSV export. Runs entirely client-side.
import {
  listEmployees,
  listOrgAttendance,
  listDevices,
  listFatigueAlerts,
  ownerMetrics,
} from "./supabase/db"

export type ReportRange = "today" | "7d" | "30d" | "month" | "all"
export type ReportFormat = "pdf" | "csv"

export type ReportData = {
  title: string
  columns: string[]
  rows: (string | number)[][]
  summary: { label: string; value: string }[]
}

export const RANGE_LABEL: Record<ReportRange, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  all: "All time",
}

function rangeStart(range: ReportRange): Date | null {
  const now = new Date()
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case "7d":
      return new Date(now.getTime() - 7 * 86_400_000)
    case "30d":
      return new Date(now.getTime() - 30 * 86_400_000)
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1)
    default:
      return null
  }
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

type BuildOpts = { siteId: string; siteName: string; range: ReportRange }

export async function buildReport(type: string, opts: BuildOpts): Promise<ReportData> {
  const { siteId, range } = opts
  const start = rangeStart(range)

  switch (type) {
    case "Workforce": {
      const all = await listEmployees()
      const rows = siteId ? all.filter((e) => e.site_id === siteId) : all
      const managers = rows.filter((e) => e.invited_role === "manager").length
      const active = rows.filter((e) => e.status === "active").length
      return {
        title: "Workforce",
        columns: ["Name", "Email", "Role", "Site", "Status"],
        rows: rows.map((e) => [
          e.full_name ?? "—",
          e.email ?? "—",
          e.role_title ?? (e.invited_role === "manager" ? "Manager" : "Employee"),
          e.site?.name ?? "Unassigned",
          e.status,
        ]),
        summary: [
          { label: "Total", value: String(rows.length) },
          { label: "Managers", value: String(managers) },
          { label: "Active", value: String(active) },
        ],
      }
    }

    case "Attendance": {
      const all = await listOrgAttendance(1000)
      const rows = all.filter((r) => {
        if (siteId && (r as unknown as { site_id?: string }).site_id !== siteId) return false
        if (start && new Date(r.date) < start) return false
        return true
      })
      return {
        title: "Attendance",
        columns: ["Date", "Employee", "Clock In", "Clock Out", "Status", "Hours", "Late (min)"],
        rows: rows.map((r) => [
          r.date,
          r.employee?.full_name ?? "—",
          fmtTime(r.clock_in_time),
          fmtTime(r.clock_out_time),
          r.status,
          Number(r.hours_worked || 0).toFixed(2),
          r.late_minutes || 0,
        ]),
        summary: [
          { label: "Records", value: String(rows.length) },
          { label: "Late", value: String(rows.filter((r) => (r.late_minutes || 0) > 0).length) },
        ],
      }
    }

    case "Working Hours":
    case "Estimated Earnings": {
      const all = await listOrgAttendance(2000)
      const filtered = all.filter((r) => {
        if (siteId && (r as unknown as { site_id?: string }).site_id !== siteId) return false
        if (start && new Date(r.date) < start) return false
        return true
      })
      const byEmp = new Map<string, { name: string; reg: number; ot: number; days: number }>()
      for (const r of filtered) {
        const key = r.employee_id
        const name = r.employee?.full_name ?? "—"
        const cur = byEmp.get(key) ?? { name, reg: 0, ot: 0, days: 0 }
        cur.reg += Number(r.regular_hours || 0)
        cur.ot += Number(r.overtime_hours || 0)
        cur.days += 1
        byEmp.set(key, cur)
      }
      const list = [...byEmp.values()]
      const totalHrs = list.reduce((s, e) => s + e.reg + e.ot, 0)
      const totalOt = list.reduce((s, e) => s + e.ot, 0)
      return {
        title: type,
        columns: ["Employee", "Days", "Regular Hrs", "Overtime Hrs", "Total Hrs"],
        rows: list.map((e) => [e.name, e.days, e.reg.toFixed(2), e.ot.toFixed(2), (e.reg + e.ot).toFixed(2)]),
        summary: [
          { label: "People", value: String(list.length) },
          { label: "Total Hrs", value: totalHrs.toFixed(2) },
          { label: "Overtime Hrs", value: totalOt.toFixed(2) },
        ],
      }
    }

    case "Fatigue": {
      const all = await listFatigueAlerts()
      const rows = all.filter((a) => !start || new Date(a.created_at) >= start)
      return {
        title: "Fatigue",
        columns: ["Date", "Employee", "Type", "Risk", "Severity", "Acknowledged", "Message"],
        rows: rows.map((a) => [
          new Date(a.created_at).toLocaleDateString(),
          a.employee?.full_name ?? "—",
          a.alert_type,
          a.risk_level,
          a.severity,
          a.acknowledged ? "Yes" : "No",
          a.message ?? "—",
        ]),
        summary: [
          { label: "Alerts", value: String(rows.length) },
          { label: "High Risk", value: String(rows.filter((a) => a.risk_level === "high").length) },
        ],
      }
    }

    case "Activity Patterns": {
      const all = await listOrgAttendance(2000)
      const filtered = all.filter((r) => {
        if (siteId && (r as unknown as { site_id?: string }).site_id !== siteId) return false
        if (start && new Date(r.date) < start) return false
        return true
      })
      const byDate = new Map<string, { onShift: number; completed: number; hours: number }>()
      for (const r of filtered) {
        const cur = byDate.get(r.date) ?? { onShift: 0, completed: 0, hours: 0 }
        if (r.clock_in_time) cur.onShift += 1
        if (r.clock_out_time) cur.completed += 1
        cur.hours += Number(r.hours_worked || 0)
        byDate.set(r.date, cur)
      }
      const dates = [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
      return {
        title: "Activity Patterns",
        columns: ["Date", "On Shift", "Completed", "Total Hours", "Avg Hours"],
        rows: dates.map(([date, d]) => [
          date,
          d.onShift,
          d.completed,
          d.hours.toFixed(2),
          (d.hours / (d.onShift || 1)).toFixed(2),
        ]),
        summary: [{ label: "Days", value: String(dates.length) }],
      }
    }

    case "Devices": {
      const all = await listDevices()
      const rows = siteId ? all.filter((d) => d.site_id === siteId) : all
      return {
        title: "Devices",
        columns: ["Device ID", "Employee", "Status", "Battery %", "Last Sync"],
        rows: rows.map((d) => [
          d.device_id,
          d.employee?.full_name ?? "—",
          d.connection_status,
          d.battery_level ?? "—",
          d.last_sync_time ? new Date(d.last_sync_time).toLocaleString() : "—",
        ]),
        summary: [
          { label: "Devices", value: String(rows.length) },
          { label: "Connected", value: String(rows.filter((d) => d.connection_status === "connected").length) },
        ],
      }
    }

    case "Management Summary":
    default: {
      const m = await ownerMetrics()
      return {
        title: "Management Summary",
        columns: ["Metric", "Value"],
        rows: [
          ["Employees", m.employees],
          ["Managers", m.managers],
          ["Sites", m.sites],
          ["Active Now", m.activeNow],
          ["Hours Worked Today", m.hoursWorked.toFixed(2)],
          ["Unacknowledged Fatigue Alerts", m.fatigueAlerts],
        ],
        summary: [
          { label: "Employees", value: String(m.employees) },
          { label: "Sites", value: String(m.sites) },
          { label: "Active Now", value: String(m.activeNow) },
        ],
      }
    }
  }
}

// ─── Output ───────────────────────────────────────────────────────────────
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function fileStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCsv(data: ReportData, meta: { siteName: string; range: ReportRange }) {
  const esc = (v: string | number) => {
    const s = String(v ?? "")
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = [
    `Sentinel-AI ${data.title} Report`,
    `Site,${esc(meta.siteName)}`,
    `Range,${esc(RANGE_LABEL[meta.range])}`,
    `Generated,${esc(new Date().toLocaleString())}`,
    "",
  ]
  const table = [data.columns.map(esc).join(","), ...data.rows.map((r) => r.map(esc).join(","))]
  const csv = [...header, ...table].join("\r\n")
  triggerDownload(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    `sentinel-${slug(data.title)}-${fileStamp()}.csv`,
  )
}

function escHtml(v: string | number): string {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string)
}

// Opens a branded, print-ready document in a new window and triggers the print
// dialog so the user can save a polished PDF for the requested site.
export function printPdf(data: ReportData, meta: { siteName: string; range: ReportRange }) {
  const win = window.open("", "_blank", "width=900,height=1000")
  if (!win) throw new Error("Pop-up blocked. Allow pop-ups to download the PDF.")

  const generatedAt = new Date().toLocaleString()
  const summaryCards = data.summary
    .map(
      (s) =>
        `<div class="stat"><div class="stat-val">${escHtml(s.value)}</div><div class="stat-label">${escHtml(s.label)}</div></div>`,
    )
    .join("")

  const head = data.columns.map((c) => `<th>${escHtml(c)}</th>`).join("")
  const body = data.rows.length
    ? data.rows
        .map((r) => `<tr>${r.map((c) => `<td>${escHtml(c)}</td>`).join("")}</tr>`)
        .join("")
    : `<tr><td class="empty" colspan="${data.columns.length}">No data for the selected filters.</td></tr>`

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Sentinel-AI ${escHtml(data.title)} Report</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #111; }
  .head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 2px solid #111; }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand img { width: 26px; height: 26px; }
  .brand .name { font-size: 12px; letter-spacing: 0.25em; font-family: "Courier New", monospace; color: rgba(0,0,0,0.6); }
  .head .meta { text-align: right; font-size: 11px; color: rgba(0,0,0,0.5); line-height: 1.6; }
  h1 { font-size: 24px; font-weight: 300; letter-spacing: -0.01em; margin: 24px 0 4px; }
  .sub { font-size: 12px; color: rgba(0,0,0,0.5); margin: 0 0 20px; }
  .stats { display: flex; gap: 12px; margin: 0 0 24px; }
  .stat { flex: 1; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; padding: 14px 16px; background: #F7F6F2; }
  .stat-val { font-size: 22px; font-weight: 600; }
  .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(0,0,0,0.45); margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { text-align: left; text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px; color: rgba(0,0,0,0.5); border-bottom: 1.5px solid rgba(0,0,0,0.15); padding: 10px 8px; }
  tbody td { padding: 9px 8px; border-bottom: 1px solid rgba(0,0,0,0.07); }
  tbody tr:nth-child(even) td { background: #FAF9F6; }
  td.empty { text-align: center; color: rgba(0,0,0,0.4); padding: 32px; }
  .foot { margin-top: 28px; padding-top: 14px; border-top: 1px solid rgba(0,0,0,0.1); font-size: 10px; color: rgba(0,0,0,0.4); display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="head">
    <div class="brand">
      <img src="/images/logo.png" alt="" />
      <span class="name">SENTINEL-AI</span>
    </div>
    <div class="meta">
      Site: <strong>${escHtml(meta.siteName)}</strong><br/>
      Range: ${escHtml(RANGE_LABEL[meta.range])}<br/>
      Generated: ${escHtml(generatedAt)}
    </div>
  </div>
  <h1>${escHtml(data.title)} Report</h1>
  <p class="sub">Sentinel-AI Workforce — operational report</p>
  <div class="stats">${summaryCards}</div>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
  <div class="foot">
    <span>&copy; 2026 Sentinel-AI Workforce</span>
    <span>${escHtml(data.rows.length)} row(s)</span>
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () { window.focus(); window.print(); }, 300);
    };
  </script>
</body>
</html>`)
  win.document.close()
}
