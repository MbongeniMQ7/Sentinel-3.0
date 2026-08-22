import React from "react"
import { cn } from "@/lib/utils"

// ─── Section card ─────────────────────────────────────────────────────────────
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  )
}

// ─── Page header ──────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── Metric card ──────────────────────────────────────────────────────────────
export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string
  value: string | number
  icon?: React.ComponentType<{ className?: string }>
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white">
          <Icon className="h-5 w-5 text-slate-400" />
        </div>
      )}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ─── Risk badge ───────────────────────────────────────────────────────────────
export function RiskBadge({ level }: { level: "low" | "moderate" | "high" }) {
  const map = {
    low: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    moderate: "bg-amber-50 text-amber-700 ring-amber-600/20",
    high: "bg-red-50 text-red-700 ring-red-600/20",
  } as const
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset",
        map[level],
      )}
    >
      {level}
    </span>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode
  tone?: "slate" | "green" | "amber" | "red" | "navy"
}) {
  const map = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    navy: "bg-slate-900/5 text-slate-700",
  } as const
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", map[tone])}>
      {children}
    </span>
  )
}

// ─── Data table shell (empty-first) ──────────────────────────────────────────
export function DataTable({
  columns,
  empty,
  rows,
}: {
  columns: string[]
  empty: React.ReactNode
  rows?: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows ?? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
