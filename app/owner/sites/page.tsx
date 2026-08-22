"use client"

import { useEffect, useState } from "react"
import { Building2, Plus, MapPin, Clock } from "lucide-react"
import { PageHeader, EmptyState, SectionCard } from "@/components/app/primitives"
import { Button } from "@/components/app/controls"
import { CreateSiteModal } from "@/components/app/create-site-modal"
import { Toast } from "@/components/app/toast"
import { listSites, subscribeTable, type Site } from "@/lib/supabase/db"

export default function OwnerSitesPage() {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [sites, setSites] = useState<Site[]>([])

  function load() {
    listSites().then(setSites).catch(() => setSites([]))
  }

  useEffect(() => {
    load()
    return subscribeTable("sites", load)
  }, [])

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

      {sites.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Building2 className="h-5 w-5 text-slate-500" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">{s.name}</h2>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-slate-500">
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> {s.location || "No location set"}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> {s.timezone}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateSiteModal open={open} onClose={() => setOpen(false)} onSubmitted={() => setToast("Site created.")} />
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  )
}
