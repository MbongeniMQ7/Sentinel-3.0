"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wrench, Watch, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { EMPLOYEE_NAV } from "./nav-config"
import { useAuth } from "@/lib/supabase/use-auth"

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="Sentinel-AI" className="h-8 w-8 object-contain" />
          <span className="text-sm font-semibold tracking-tight text-slate-900">Sentinel-AI</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/employee/corrections"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              pathname === "/employee/corrections" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100",
            )}
            aria-label="Corrections"
          >
            <Wrench className="h-4.5 w-4.5" />
          </Link>
          <Link
            href="/employee/device"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              pathname === "/employee/device" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100",
            )}
            aria-label="Device"
          >
            <Watch className="h-4.5 w-4.5" />
          </Link>
          <button
            onClick={signOut}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Sign out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-md px-4 pb-24 pt-5">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {EMPLOYEE_NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-[#0f2a4a]" : "text-slate-400",
                )}
              >
                <item.icon className={cn("h-5 w-5", active ? "text-[#0f2a4a]" : "text-slate-400")} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
