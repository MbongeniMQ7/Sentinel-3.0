"use client"

import { useState, useEffect } from "react"
import { Search, Users, Building2, Bell, Watch, FileText } from "lucide-react"

const CATEGORIES = [
  { label: "Employees", icon: Users },
  { label: "Sites", icon: Building2 },
  { label: "Alerts", icon: Bell },
  { label: "Devices", icon: Watch },
  { label: "Reports", icon: FileText },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

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
            placeholder="Search employees, sites, alerts, devices, reports…"
            className="h-12 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400 sm:block">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Search categories
          </p>
          {CATEGORIES.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600"
            >
              <c.icon className="h-4 w-4 text-slate-400" />
              {c.label}
            </div>
          ))}
          <div className="px-3 py-6 text-center text-sm text-slate-400">
            {query
              ? `No results for “${query}”. Data will appear here once your workforce is configured.`
              : "Type to search across the current session."}
          </div>
        </div>
      </div>
    </div>
  )
}
