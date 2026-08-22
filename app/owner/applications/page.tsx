"use client"

import { useEffect, useMemo, useState } from "react"
import { Inbox, Search, Mail, Phone, Globe, ExternalLink } from "lucide-react"
import { PageHeader, DataTable, EmptyState, Badge, MetricCard } from "@/components/app/primitives"
import { Input, Select } from "@/components/app/controls"
import { Toast } from "@/components/app/toast"
import {
  listApplications,
  updateApplicationStatus,
  subscribeTable,
  type ApplicationRow,
  type ApplicationStatus,
} from "@/lib/supabase/db"

const STATUSES: ApplicationStatus[] = ["new", "reviewing", "contacted", "approved", "rejected"]

const STATUS_TONE: Record<ApplicationStatus, "slate" | "green" | "amber" | "red" | "navy"> = {
  new: "navy",
  reviewing: "amber",
  contacted: "amber",
  approved: "green",
  rejected: "red",
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })
}

export default function OwnerApplicationsPage() {
  const [rows, setRows] = useState<ApplicationRow[]>([])
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [toast, setToast] = useState<string | null>(null)

  function load() {
    listApplications().then(setRows).catch(() => setRows([]))
  }

  useEffect(() => {
    load()
    return subscribeTable("company_applications", load)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (q && !`${r.company_name} ${r.contact_name} ${r.contact_email}`.toLowerCase().includes(q)) return false
      if (typeFilter && r.application_type !== typeFilter) return false
      if (statusFilter && r.status !== statusFilter) return false
      return true
    })
  }, [rows, query, typeFilter, statusFilter])

  const metrics = useMemo(
    () => ({
      total: rows.length,
      neu: rows.filter((r) => r.status === "new").length,
      join: rows.filter((r) => r.application_type === "join").length,
      acquire: rows.filter((r) => r.application_type === "acquire").length,
    }),
    [rows],
  )

  async function changeStatus(id: string, status: ApplicationStatus) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)))
    try {
      await updateApplicationStatus(id, status)
      setToast("Status updated.")
    } catch {
      setToast("Could not update status.")
      load()
    }
  }

  return (
    <>
      <PageHeader
        title="Applications"
        description="Companies that want to join or acquire the platform."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total" value={metrics.total} icon={Inbox} />
        <MetricCard label="New" value={metrics.neu} hint="Awaiting review" />
        <MetricCard label="Join" value={metrics.join} hint="Adopt platform" />
        <MetricCard label="Acquire" value={metrics.acquire} hint="Acquire software" />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies or contacts"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select className="w-36" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="join">Join</option>
            <option value="acquire">Acquire</option>
          </Select>
          <Select className="w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <DataTable
        columns={["Company", "Contact", "Type", "Industry", "Received", "Status"]}
        empty={
          <EmptyState
            icon={Inbox}
            title="No applications yet."
            description="Submissions from the public partner form will appear here in real time."
          />
        }
        rows={
          filtered.length
            ? filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 align-top last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.company_name}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                      {r.website && (
                        <a
                          href={r.website.startsWith("http") ? r.website : `https://${r.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-slate-600"
                        >
                          <Globe className="h-3 w-3" /> Website <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      {r.company_size && <span>{r.company_size} employees</span>}
                    </div>
                    {r.message && <p className="mt-1 max-w-xs text-xs text-slate-500">{r.message}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{r.contact_name}</div>
                    <a
                      href={`mailto:${r.contact_email}`}
                      className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      <Mail className="h-3 w-3" /> {r.contact_email}
                    </a>
                    {r.contact_phone && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                        <Phone className="h-3 w-3" /> {r.contact_phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={r.application_type === "acquire" ? "navy" : "slate"}>
                      {r.application_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.industry || "—"}
                    <div className="text-xs text-slate-400">{r.country || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                      <Select
                        className="h-8 w-32 text-xs"
                        value={r.status}
                        onChange={(e) => changeStatus(r.id, e.target.value as ApplicationStatus)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </td>
                </tr>
              ))
            : undefined
        }
      />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
