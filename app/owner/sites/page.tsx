"use client"

import { useState } from "react"
import { Building2, Plus } from "lucide-react"
import { PageHeader, EmptyState, SectionCard } from "@/components/app/primitives"
import { Button } from "@/components/app/controls"
import { CreateSiteModal } from "@/components/app/create-site-modal"
import { Toast } from "@/components/app/toast"

export default function OwnerSitesPage() {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  return (
    <>
      <PageHeader
        title="Sites"
        description="Manage your operating locations."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Create Site
          </Button>
        }
      />

      <SectionCard>
        <EmptyState
          icon={Building2}
          title="No sites created."
          description="Create a site to organise your workforce, attendance and devices by location."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Create Site
            </Button>
          }
        />
      </SectionCard>

      <CreateSiteModal open={open} onClose={() => setOpen(false)} onSubmitted={() => setToast("Site created in this session.")} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
