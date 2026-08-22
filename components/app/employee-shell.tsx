"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wrench, Watch, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { EMPLOYEE_NAV } from "./nav-config"
import { useAuth } from "@/lib/supabase/use-auth"

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { signOut, initial, displayName } = useAuth()

  return (
    <div data-role="employee" className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-4 py-4">
          <Link href="/" className="flex items-center gap-2 px-1">
            <img src="/images/logo.png" alt="Sentinel-AI" className="h-8 w-8 object-contain" />
            <div className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight text-slate-900">Sentinel-AI</span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400">Employee workspace</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {EMPLOYEE_NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  active ? "bg-(--brand) text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400")} />
                {item.label}
              </Link>
            )
          })}
          <div className="my-2 border-t border-slate-100" />
          {[
            { label: "Corrections", href: "/employee/corrections", icon: Wrench },
            { label: "Device", href: "/employee/device", icon: Watch },
          ].map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  active ? "bg-(--brand) text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400")} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4 shrink-0 text-slate-400" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <img src="/images/logo.png" alt="Sentinel-AI" className="h-8 w-8 object-contain" />
            <span className="text-sm font-semibold tracking-tight text-slate-900">Sentinel-AI</span>
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/employee/corrections"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors lg:hidden",
                pathname === "/employee/corrections" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100",
              )}
              aria-label="Corrections"
            >
              <Wrench className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/employee/device"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors lg:hidden",
                pathname === "/employee/device" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100",
              )}
              aria-label="Device"
            >
              <Watch className="h-4.5 w-4.5" />
            </Link>
            <div
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-(--brand) text-xs font-semibold text-white lg:flex"
              title={displayName}
            >
              {initial || "E"}
            </div>
            <button
              onClick={signOut}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
              aria-label="Sign out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      {/* Bottom nav (mobile only) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {EMPLOYEE_NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-(--brand)" : "text-slate-400",
                )}
              >
                <item.icon className={cn("h-5 w-5", active ? "text-(--brand)" : "text-slate-400")} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
