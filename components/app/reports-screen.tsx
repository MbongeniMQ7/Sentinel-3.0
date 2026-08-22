"use client"

import { useState } from "react"
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
  type LucideIcon,
} from "lucide-react"
import { PageHeader, SectionCard, EmptyState } from "./primitives"
import { Button, Field, Select } from "./controls"
import { Modal } from "./modal"
import { Toast } from "./toast"

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

export function ReportsScreen() {
  const [configuring, setConfiguring] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

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
            <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => setConfiguring(r.label)}>
              Configure
            </Button>
          </div>
        ))}
      </div>

      <SectionCard title="Generated Reports" className="mt-6">
        <EmptyState
          icon={FileText}
          title="No reports generated."
          description="Configure a report above to get started. Reports are prepared on demand."
        />
      </SectionCard>

      <Modal
        open={!!configuring}
        onClose={() => setConfiguring(null)}
        title={`Configure ${configuring ?? ""} report`}
        description="Choose parameters for this report. This is a frontend demonstration — nothing is generated."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfiguring(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setConfiguring(null)
                setToast("Report configuration saved for this session.")
              }}
            >
              Generate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Date range">
            <Select defaultValue="Last 7 days">
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This month</option>
              <option>Custom</option>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site">
              <Select defaultValue="">
                <option value="">All sites</option>
              </Select>
            </Field>
            <Field label="Format">
              <Select defaultValue="PDF">
                <option>PDF</option>
                <option>CSV</option>
                <option>XLSX</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
