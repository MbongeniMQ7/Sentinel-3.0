"use client"

// Client-side telemetry stream: random-walks around the latest wristband
// reading so vitals visibly fluctuate between device syncs, like a live feed.
import { useEffect, useRef, useState } from "react"
import type { BiometricRow } from "@/lib/supabase/db"

export type LiveVitals = {
  heart_rate: number | null
  hrv: number | null
  skin_temperature: number | null
  activity_score: number | null
}

function walk(current: number, base: number, spread: number, step: number): number {
  const drift = (base - current) * 0.2 // pull back toward the server reading
  const next = current + drift + (Math.random() - 0.5) * 2 * step
  return Math.min(base + spread, Math.max(base - spread, next))
}

export function useLiveVitals(base: BiometricRow | null, intervalMs = 2200): LiveVitals {
  const [live, setLive] = useState<LiveVitals>({
    heart_rate: null,
    hrv: null,
    skin_temperature: null,
    activity_score: null,
  })
  const stateRef = useRef<LiveVitals>(live)

  useEffect(() => {
    if (!base) return
    stateRef.current = {
      heart_rate: base.heart_rate,
      hrv: base.hrv,
      skin_temperature: base.skin_temperature,
      activity_score: base.activity_score,
    }
    setLive(stateRef.current)

    const id = setInterval(() => {
      const s = stateRef.current
      stateRef.current = {
        heart_rate: base.heart_rate == null ? null : Math.round(walk(s.heart_rate ?? base.heart_rate, base.heart_rate, 6, 3)),
        hrv: base.hrv == null ? null : Math.round(walk(s.hrv ?? base.hrv, base.hrv, 5, 2)),
        skin_temperature:
          base.skin_temperature == null
            ? null
            : Number(walk(s.skin_temperature ?? base.skin_temperature, base.skin_temperature, 0.2, 0.08).toFixed(1)),
        activity_score:
          base.activity_score == null
            ? null
            : Math.round(walk(s.activity_score ?? base.activity_score, base.activity_score, 6, 3)),
      }
      setLive(stateRef.current)
    }, intervalMs)
    return () => clearInterval(id)
  }, [base, intervalMs])

  return live
}

// Re-renders on an interval — used for ticking "x seconds ago" timestamps.
export function useNow(intervalMs = 5000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function timeAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return "Never"
  const secs = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000))
  if (secs < 10) return "Just now"
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString()
}
