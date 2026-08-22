"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, Plus, Search, Download } from "lucide-react"
import { PageHeader, DataTable, EmptyState, Badge } from "@/components/app/primitives"
import { Button, Input, Select } from "@/components/app/controls"
import { AddEmployeeModal } from "@/components/app/add-employee-modal"
import { Toast } from "@/components/app/toast"
import { downloadCsv, type ReportData } from "@/lib/reports"
import {
  listEmployees,
  listSites,
  subscribeTable,
  type EmployeeRow,
  type Site,
} from "@/lib/supabase/db"

export default function ManagerEmployeesPage() {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [siteFilter, setSiteFilter] = useState("")
  const [rows, setRows] = useState<EmployeeRow[]>([])
  const [sites, setSites] = useState<Site[]>([])

  function load() {
    listEmployees().then(setRows).catch(() => setRows([]))
  }

  useEffect(() => {
    load()
    listSites().then(setSites).catch(() => setSites([]))
    return subscribeTable("employees", load)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (q && !`${r.full_name ?? ""} ${r.email ?? ""}`.toLowerCase().includes(q)) return false
      if (siteFilter && r.site_id !== siteFilter) return false
      return true
    })
  }, [rows, query, siteFilter])

  function handleExport() {
    if (!filtered.length) {
      setToast("There are no employees to export.")
      return
    }
    const data: ReportData = {
      title: "Employees",
      columns: ["Name", "Email", "Role", "Site", "Status", "Linked"],
      rows: filtered.map((r) => [
        r.full_name ?? "—",
        r.email ?? "—",
        r.invited_role,
        r.site?.name ?? "Unassigned",
        r.status,
        r.user_id ? "Active login" : "Invited",
      ]),
      summary: [{ label: "Total", value: String(filtered.length) }],
    }
    downloadCsv(data, { siteName: "All sites", range: "all" })
    setToast(`Exported ${filtered.length} employee${filtered.length === 1 ? "" : "s"}.`)
  }

  return (
    <>
      <PageHeader
        title="Employees"
        description="The people you manage across your sites."
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add Employee
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employees" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select className="w-36" value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
            <option value="">All sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <DataTable
        columns={["Employee", "Site", "Status", "Role", "Linked"]}
        empty={
          <EmptyState
            icon={Users}
            title="No employees found."
            description="Add your first employee to begin tracking attendance and fatigue."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Add Employee
              </Button>
            }
          />
        }
        rows={
          filtered.length
            ? filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{r.full_name || "—"}</div>
                    <div className="text-xs text-slate-400">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.site?.name || "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.status === "active" ? "green" : "slate"}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{r.invited_role}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.user_id ? "navy" : "amber"}>{r.user_id ? "Active login" : "Invited"}</Badge>
                  </td>
                </tr>
              ))
            : undefined
        }
      />

      <AddEmployeeModal open={open} onClose={() => setOpen(false)} onSubmitted={() => setToast("Employee added.")} />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
