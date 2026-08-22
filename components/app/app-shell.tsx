"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Search, Bell, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NavGroup, Role } from "./nav-config"
import { CommandPalette } from "./command-palette"
import { useAuth } from "@/lib/supabase/use-auth"

type ShellTheme = {
  label: string
  sidebar: string
  brandTitle: string
  brandSub: string
  groupLabel: string
  itemIdle: string
  itemActive: string
  itemActiveIcon: string
  itemIdleIcon: string
  closeBtn: string
}

const THEMES: Record<Role, ShellTheme> = {
  owner: {
    label: "Owner",
    sidebar: "border-slate-200 bg-white",
    brandTitle: "text-slate-900",
    brandSub: "text-slate-400",
    groupLabel: "text-slate-400",
    itemIdle: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    itemActive: "bg-[var(--brand)] text-white",
    itemActiveIcon: "text-white",
    itemIdleIcon: "text-slate-400",
    closeBtn: "text-slate-500 hover:bg-slate-100",
  },
  manager: {
    label: "Manager",
    sidebar: "border-teal-950/50 bg-[#0b3f3a]",
    brandTitle: "text-white",
    brandSub: "text-teal-200/70",
    groupLabel: "text-teal-200/50",
    itemIdle: "text-teal-50/80 hover:bg-white/10 hover:text-white",
    itemActive: "bg-white text-[#0b3f3a] font-medium",
    itemActiveIcon: "text-[#0b3f3a]",
    itemIdleIcon: "text-teal-200/70",
    closeBtn: "text-teal-100 hover:bg-white/10",
  },
  employee: {
    label: "Employee",
    sidebar: "border-slate-200 bg-white",
    brandTitle: "text-slate-900",
    brandSub: "text-slate-400",
    groupLabel: "text-slate-400",
    itemIdle: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    itemActive: "bg-[var(--brand)] text-white",
    itemActiveIcon: "text-white",
    itemIdleIcon: "text-slate-400",
    closeBtn: "text-slate-500 hover:bg-slate-100",
  },
}

function Brand({ theme }: { theme: ShellTheme }) {
  return (
    <Link href="/" className="flex items-center gap-2 px-1">
      <img src="/images/logo.png" alt="Sentinel-AI" className="h-8 w-8 object-contain" />
      <div className="leading-tight">
        <span className={cn("block text-sm font-semibold tracking-tight", theme.brandTitle)}>Sentinel-AI</span>
        <span className={cn("block text-[10px] uppercase tracking-widest", theme.brandSub)}>
          {theme.label} workspace
        </span>
      </div>
    </Link>
  )
}

function NavLinks({ nav, theme, onNavigate }: { nav: NavGroup[]; theme: ShellTheme; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {nav.map((group) => (
        <div key={group.label}>
          <p className={cn("mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest", theme.groupLabel)}>
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
                    active ? theme.itemActive : theme.itemIdle,
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", active ? theme.itemActiveIcon : theme.itemIdleIcon)} />
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
  const { initial, displayName, signOut } = useAuth()
  const theme = THEMES[role]

  return (
    <div data-role={role} className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex", theme.sidebar)}>
        <div className="px-4 py-4">
          <Brand theme={theme} />
        </div>
        <NavLinks nav={nav} theme={theme} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <aside className={cn("absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r", theme.sidebar)}>
            <div className="flex items-center justify-between px-4 py-4">
              <Brand theme={theme} />
              <button
                onClick={() => setMobileOpen(false)}
                className={cn("flex h-8 w-8 items-center justify-center rounded-lg", theme.closeBtn)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLinks nav={nav} theme={theme} onNavigate={() => setMobileOpen(false)} />
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
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-(--brand) text-xs font-semibold text-white"
              title={displayName}
            >
              {initial || role.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={signOut}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <CommandPalette role={role} />
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
