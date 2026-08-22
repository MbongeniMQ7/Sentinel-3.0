"use client"

import { useState } from "react"
import { Play, Square } from "lucide-react"
import { cn } from "@/lib/utils"

export function ClockInCard() {
  const [working, setWorking] = useState(false)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
          working ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", working ? "bg-emerald-500" : "bg-slate-400")} />
        {working ? "Working" : "Not Working"}
      </span>

      <div className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">0h 00m</div>
      <p className="mt-1 text-sm text-slate-500">{working ? "Shift in progress" : "No active shift"}</p>

      <button
        onClick={() => setWorking((w) => !w)}
        className={cn(
          "mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-colors",
          working ? "bg-red-600 hover:bg-red-700" : "bg-[#0f2a4a] hover:bg-[#163a63]",
        )}
      >
        {working ? (
          <>
            <Square className="h-4 w-4" /> Clock Out
          </>
        ) : (
          <>
            <Play className="h-4 w-4" /> Clock In
          </>
        )}
      </button>
    </div>
  )
}
