"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Search, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NavGroup, Role } from "./nav-config"
import { RoleSwitcher } from "./role-switcher"
import { CommandPalette } from "./command-palette"

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 px-1">
      <img src="/images/logo.png" alt="Sentinel-AI" className="h-8 w-8 object-contain" />
      <div className="leading-tight">
        <span className="block text-sm font-semibold tracking-tight text-slate-900">Sentinel-AI</span>
        <span className="block text-[10px] uppercase tracking-widest text-slate-400">Workforce</span>
      </div>
    </Link>
  )
}

function NavLinks({ nav, onNavigate }: { nav: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {nav.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-[#0f2a4a] text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400")} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function AppShell({
  role,
  nav,
  children,
}: {
  role: Role
  nav: NavGroup[]
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-4 py-4">
          <Brand />
        </div>
        <NavLinks nav={nav} />
        <div className="border-t border-slate-100 p-3">
          <RoleSwitcher current={role} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-4">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLinks nav={nav} onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-slate-100 p-3">
              <RoleSwitcher current={role} />
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <SearchTrigger />

          <div className="ml-auto flex items-center gap-1.5">
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
              {role.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <CommandPalette />
    </div>
  )
}

function SearchTrigger() {
  function open() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
  }
  return (
    <button
      onClick={open}
      className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-400 transition-colors hover:bg-slate-50"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search…</span>
      <kbd className="ml-6 hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
    </button>
  )
}
