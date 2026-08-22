"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, Building2, Bell, Watch } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { Role } from "./nav-config"
import { listEmployees, listSites, listFatigueAlerts, listDevices } from "@/lib/supabase/db"

type Result = { id: string; title: string; subtitle: string; href: string; icon: LucideIcon }

// Which entity list pages each role can navigate to.
const PAGES: Record<Role, Partial<Record<"employee" | "site" | "alert" | "device", string>>> = {
  owner: { employee: "/owner/employees", site: "/owner/sites" },
  manager: { employee: "/manager/employees", alert: "/manager/alerts", device: "/manager/devices" },
  employee: { alert: "/employee/alerts" },
}

export function CommandPalette({ role }: { role: Role }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<Result[]>([])
  const [active, setActive] = useState(0)
  const loaded = useRef(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Load the searchable index the first time the palette opens.
  useEffect(() => {
    if (!open || loaded.current) return
    loaded.current = true
    const pages = PAGES[role]
    const collected: Result[] = []
    const tasks: Promise<void>[] = []

    if (pages.employee) {
      tasks.push(
        listEmployees()
          .then((rows) =>
            rows.forEach((r) =>
              collected.push({
                id: `emp-${r.id}`,
                title: r.full_name || r.email || "Employee",
                subtitle: r.site?.name ? `Employee · ${r.site.name}` : "Employee",
                href: pages.employee!,
                icon: Users,
              }),
            ),
          )
          .catch(() => {}),
      )
    }
    if (pages.site) {
      tasks.push(
        listSites()
          .then((rows) =>
            rows.forEach((r) =>
              collected.push({
                id: `site-${r.id}`,
                title: r.name,
                subtitle: r.location ? `Site · ${r.location}` : "Site",
                href: pages.site!,
                icon: Building2,
              }),
            ),
          )
          .catch(() => {}),
      )
    }
    if (pages.alert) {
      tasks.push(
        listFatigueAlerts()
          .then((rows) =>
            rows.forEach((r) =>
              collected.push({
                id: `alert-${r.id}`,
                title: r.employee?.full_name || r.alert_type,
                subtitle: `Alert · ${r.risk_level} risk`,
                href: pages.alert!,
                icon: Bell,
              }),
            ),
          )
          .catch(() => {}),
      )
    }
    if (pages.device) {
      tasks.push(
        listDevices()
          .then((rows) =>
            rows.forEach((r) =>
              collected.push({
                id: `dev-${r.id}`,
                title: r.device_id,
                subtitle: r.employee?.full_name ? `Device · ${r.employee.full_name}` : `Device · ${r.connection_status}`,
                href: pages.device!,
                icon: Watch,
              }),
            ),
          )
          .catch(() => {}),
      )
    }

    Promise.all(tasks).then(() => setItems(collected))
  }, [open, role])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, 8)
    return items.filter((r) => `${r.title} ${r.subtitle}`.toLowerCase().includes(q)).slice(0, 12)
  }, [items, query])

  useEffect(() => setActive(0), [query, open])

  function go(r: Result) {
    setOpen(false)
    setQuery("")
    router.push(r.href)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-900/30 px-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setActive((i) => Math.min(i + 1, results.length - 1))
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setActive((i) => Math.max(i - 1, 0))
              } else if (e.key === "Enter" && results[active]) {
                e.preventDefault()
                go(results[active])
              }
            }}
            placeholder="Search employees, sites, alerts, devices…"
            className="h-12 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 sm:block">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length ? (
            results.map((r, i) => (
              <button
                key={r.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  i === active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <r.icon className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800">{r.title}</span>
                  <span className="block truncate text-xs text-slate-400">{r.subtitle}</span>
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-sm text-slate-400">
              {query ? `No results for “${query}”.` : "Start typing to search your workforce."}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
