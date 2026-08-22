"use client"

import { useEffect, useState } from "react"
import {
  Users,
  ClipboardList,
  Clock,
  Wallet,
  ShieldAlert,
  Activity,
  Watch,
  FileBarChart,
  FileText,
  Download,
  type LucideIcon,
} from "lucide-react"
import { PageHeader, SectionCard, EmptyState } from "./primitives"
import { Button, Field, Select } from "./controls"
import { Modal } from "./modal"
import { Toast } from "./toast"
import { listSites, type Site } from "@/lib/supabase/db"
import { buildReport, downloadCsv, printPdf, RANGE_LABEL, type ReportFormat, type ReportRange } from "@/lib/reports"

const REPORT_TYPES: { label: string; icon: LucideIcon; desc: string }[] = [
  { label: "Workforce", icon: Users, desc: "Headcount, roles and status" },
  { label: "Attendance", icon: ClipboardList, desc: "Clock-in, clock-out and lateness" },
  { label: "Working Hours", icon: Clock, desc: "Regular and overtime hours" },
  { label: "Estimated Earnings", icon: Wallet, desc: "Projected pay by period" },
  { label: "Fatigue", icon: ShieldAlert, desc: "Risk distribution and trends" },
  { label: "Activity Patterns", icon: Activity, desc: "Operational patterns over time" },
  { label: "Devices", icon: Watch, desc: "Connection, battery and sync" },
  { label: "Management Summary", icon: FileBarChart, desc: "High-level overview" },
]

type Generated = { id: string; title: string; format: ReportFormat; site: string; range: string; at: string }

export function ReportsScreen() {
  const [configuring, setConfiguring] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [range, setRange] = useState<ReportRange>("7d")
  const [siteId, setSiteId] = useState("")
  const [format, setFormat] = useState<ReportFormat>("pdf")
  const [generating, setGenerating] = useState(false)
  const [history, setHistory] = useState<Generated[]>([])

  useEffect(() => {
    listSites().then(setSites).catch(() => setSites([]))
  }, [])

  function openConfig(type: string) {
    setRange("7d")
    setSiteId("")
    setFormat("pdf")
    setConfiguring(type)
  }

  async function generate() {
    if (!configuring) return
    setGenerating(true)
    try {
      const siteName = siteId ? sites.find((s) => s.id === siteId)?.name ?? "Selected site" : "All sites"
      const data = await buildReport(configuring, { siteId, siteName, range })
      if (format === "csv") downloadCsv(data, { siteName, range })
      else printPdf(data, { siteName, range })
      setHistory((h) =>
        [
          {
            id: crypto.randomUUID(),
            title: data.title,
            format,
            site: siteName,
            range: RANGE_LABEL[range],
            at: new Date().toLocaleString(),
          },
          ...h,
        ].slice(0, 10),
      )
      setConfiguring(null)
      setToast(`${data.title} report generated (${format.toUpperCase()}) — ${data.rows.length} row(s).`)
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not generate the report.")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <PageHeader title="Reports" description="Generate operational reports across your workforce." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REPORT_TYPES.map((r) => (
          <div key={r.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
              <r.icon className="h-4.5 w-4.5 text-slate-500" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-800">{r.label}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{r.desc}</p>
            <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => openConfig(r.label)}>
              Configure
            </Button>
          </div>
        ))}
      </div>

      <SectionCard title="Generated Reports" className="mt-6">
        {history.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports generated."
            description="Configure a report above to download a branded PDF or CSV export."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <Download className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {h.title}{" "}
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                        {h.format}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {h.site} · {h.range} · {h.at}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Modal
        open={!!configuring}
        onClose={() => setConfiguring(null)}
        title={`Configure ${configuring ?? ""} report`}
        description="Choose parameters, then download a branded PDF or a CSV export."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfiguring(null)} disabled={generating}>
              Cancel
            </Button>
            <Button onClick={generate} disabled={generating}>
              {generating ? "Generating…" : "Generate"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Date range">
            <Select value={range} onChange={(e) => setRange(e.target.value as ReportRange)}>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="month">This month</option>
              <option value="all">All time</option>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site" hint={sites.length ? undefined : "No sites created yet"}>
              <Select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="">All sites</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Format">
              <Select value={format} onChange={(e) => setFormat(e.target.value as ReportFormat)}>
                <option value="pdf">PDF (branded)</option>
                <option value="csv">CSV</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
