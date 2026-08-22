"use client"

import { useEffect, useState } from "react"
import { Play, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { clockIn, clockOut, getTodayAttendance, type AttendanceRow } from "@/lib/supabase/db"

function formatElapsed(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${String(m).padStart(2, "0")}m`
}

export function ClockInCard({ onChange }: { onChange?: () => void }) {
  const [record, setRecord] = useState<AttendanceRow | null>(null)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const working = !!record?.clock_in_time && !record?.clock_out_time

  useEffect(() => {
    getTodayAttendance().then(setRecord).catch(() => setRecord(null))
  }, [])

  useEffect(() => {
    if (!working) return
    const id = setInterval(() => setNow(Date.now()), 30000)
    setNow(Date.now())
    return () => clearInterval(id)
  }, [working])

  const elapsed = (() => {
    if (!record?.clock_in_time) return "0h 00m"
    if (record.clock_out_time) return formatElapsed(new Date(record.clock_out_time).getTime() - new Date(record.clock_in_time).getTime())
    return formatElapsed(now - new Date(record.clock_in_time).getTime())
  })()

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      const next = working ? await clockOut() : await clockIn()
      setRecord(next)
      onChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  const done = !!record?.clock_out_time

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
          working ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", working ? "bg-emerald-500" : "bg-slate-400")} />
        {working ? "Working" : done ? "Shift Complete" : "Not Working"}
      </span>

      <div className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">{elapsed}</div>
      <p className="mt-1 text-sm text-slate-500">
        {working ? "Shift in progress" : done ? "You've clocked out for today" : "No active shift"}
      </p>

      {!done && (
        <button
          onClick={toggle}
          disabled={busy}
          className={cn(
            "mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60",
            working ? "bg-red-600 hover:bg-red-700" : "bg-[#0f2a4a] hover:bg-[#163a63]",
          )}
        >
          {working ? (
            <>
              <Square className="h-4 w-4" /> {busy ? "Clocking out…" : "Clock Out"}
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> {busy ? "Clocking in…" : "Clock In"}
            </>
          )}
        </button>
      )}

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
    </div>
  )
}
