import { ScrollText } from "lucide-react"
import { PageHeader, DataTable, EmptyState } from "@/components/app/primitives"

export default function OwnerAuditPage() {
  return (
    <>
      <PageHeader title="Audit Logs" description="A record of activity across your workspace." />
      <DataTable
        columns={["Time", "Actor", "Action", "Target", "Site"]}
        empty={
          <EmptyState
            icon={ScrollText}
            title="No audit activity."
            description="Actions taken in your workspace will be recorded here."
          />
        }
      />
    </>
  )
}
