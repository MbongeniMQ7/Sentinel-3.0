"use client"

import { useEffect } from "react"
import { CheckCircle2, X } from "lucide-react"

export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div className="fixed bottom-4 right-4 z-[90] flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
      <span className="text-sm text-slate-700">{message}</span>
      <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
