"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, Check, Eye } from "lucide-react"
import { ROLE_META, type Role } from "./nav-config"
import { cn } from "@/lib/utils"

export function RoleSwitcher({ current }: { current: Role }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const roles: Role[] = ["owner", "manager", "employee"]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
      >
        <Eye className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">View as</span>
          <span className="block truncate text-sm font-medium text-slate-800">{ROLE_META[current].label}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-40 mb-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => {
                setOpen(false)
                router.push(ROLE_META[r].home)
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-slate-50",
                r === current ? "text-slate-900" : "text-slate-600",
              )}
            >
              {ROLE_META[r].label}
              {r === current && <Check className="h-4 w-4 text-[#0f2a4a]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
