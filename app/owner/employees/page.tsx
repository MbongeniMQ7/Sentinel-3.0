"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, Plus, Search, Download, Send, Trash2, ShieldCheck } from "lucide-react"
import { PageHeader, DataTable, EmptyState, Badge } from "@/components/app/primitives"
import { Button, Input, Select } from "@/components/app/controls"
import { AddEmployeeModal } from "@/components/app/add-employee-modal"
import { Modal } from "@/components/app/modal"
import { Toast } from "@/components/app/toast"
import { downloadCsv, type ReportData } from "@/lib/reports"
import {
  listEmployees,
  listSites,
  resendInvite,
  deleteEmployee,
  promoteToOwner,
  subscribeTable,
  type EmployeeRow,
  type Site,
} from "@/lib/supabase/db"

export default function OwnerEmployeesPage() {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [siteFilter, setSiteFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [rows, setRows] = useState<EmployeeRow[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<EmployeeRow | null>(null)
  const [toPromote, setToPromote] = useState<EmployeeRow | null>(null)

  function load() {
    listEmployees().then(setRows).catch(() => setRows([]))
  }

  async function handleResend(emp: EmployeeRow) {
    setBusyId(emp.id)
    try {
      await resendInvite(emp.id)
      setToast(`Invite re-sent to ${emp.email}.`)
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not resend the invite.")
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    setBusyId(toDelete.id)
    try {
      await deleteEmployee(toDelete.id)
      setToast(`${toDelete.full_name || "Employee"} removed.`)
      setToDelete(null)
      load()
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not remove the employee.")
    } finally {
      setBusyId(null)
    }
  }

  async function handlePromote() {
    if (!toPromote) return
    setBusyId(toPromote.id)
    try {
      const res = await promoteToOwner(toPromote.id)
      const name = toPromote.full_name || toPromote.email || "This person"
      setToast(
        res.emailed === false
          ? `${name} is now an owner, but the notification email couldn't be sent.`
          : `${name} is now an owner. A confirmation email has been sent.`,
      )
      setToPromote(null)
      load()
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not promote this person to owner.")
    } finally {
      setBusyId(null)
    }
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
      if (statusFilter && r.status !== statusFilter) return false
      return true
    })
  }, [rows, query, siteFilter, statusFilter])

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
        description="Manage your workforce across every site."
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
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees"
            className="pl-9"
          />
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
          <Select className="w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      <DataTable
        columns={["Employee", "Site", "Status", "Role", "Linked", "Actions"]}
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.invited_role === "manager" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => setToPromote(r)}
                          title="Promote to owner"
                        >
                          <ShieldCheck className="h-4 w-4" /> Make Owner
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => handleResend(r)}
                        title="Resend invite email"
                      >
                        <Send className="h-4 w-4" /> Resend
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => setToDelete(r)}
                        title="Delete employee"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            : undefined
        }
      />

      <AddEmployeeModal open={open} onClose={() => setOpen(false)} onSubmitted={() => setToast("Employee added.")} />

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Remove employee"
        description={`This permanently removes ${toDelete?.full_name || toDelete?.email || "this employee"} and revokes their access. This can't be undone.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)} disabled={busyId === toDelete?.id}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={busyId === toDelete?.id}>
              {busyId === toDelete?.id ? "Removing…" : "Remove"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {toDelete?.email} will no longer appear in your workforce or receive Sentinel-AI access.
        </p>
      </Modal>

      <Modal
        open={!!toPromote}
        onClose={() => setToPromote(null)}
        title="Promote to owner"
        description={`${toPromote?.full_name || toPromote?.email || "This person"} will be granted full owner access to your organization.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToPromote(null)} disabled={busyId === toPromote?.id}>
              Cancel
            </Button>
            <Button onClick={handlePromote} disabled={busyId === toPromote?.id}>
              {busyId === toPromote?.id ? "Promoting…" : "Make Owner"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Owners can manage sites, employees, analytics, reports and settings. {toPromote?.email} will be emailed to
          confirm their new role.
        </p>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
