"use client"

import { useEffect, useState } from "react"
import { ScrollText } from "lucide-react"
import { PageHeader, DataTable, EmptyState } from "@/components/app/primitives"
import { listAuditLogs, subscribeTable, type AuditRow } from "@/lib/supabase/db"

function actorName(a: AuditRow) {
  const first = a.actor?.first_name ?? ""
  const last = a.actor?.last_name ?? ""
  const name = `${first} ${last}`.trim()
  return name || a.actor?.email || "System"
}

export default function OwnerAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([])

  useEffect(() => {
    const load = () => listAuditLogs().then(setRows).catch(() => setRows([]))
    load()
    return subscribeTable("audit_logs", load)
  }, [])

  return (
    <>
      <PageHeader title="Audit Logs" description="A record of activity across your workspace." />
      <DataTable
        columns={["Time", "Actor", "Action", "Target"]}
        empty={
          <EmptyState
            icon={ScrollText}
            title="No audit activity."
            description="Actions taken in your workspace will be recorded here."
          />
        }
        rows={
          rows.length
            ? rows.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 text-slate-600">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{actorName(a)}</td>
                  <td className="px-4 py-3 text-slate-600">{a.action}</td>
                  <td className="px-4 py-3 text-slate-600">{a.target_name || a.target_type || "—"}</td>
                </tr>
              ))
            : undefined
        }
      />
    </>
  )
}
