"use client"

import { supabase } from "./client"
import type { SentinelReadingsResponse } from "@/lib/sentinel"

export type LiveWatchReading = {
  heartRate: number | null
  temperature: number | null
  score: number | null
  calibration: number | null
  status: string | null
  updatedAt: number | null
}

function numberField(record: Record<string, unknown>, fields: string[]): number | null {
  for (const field of fields) {
    const value = record[field]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }
  return null
}

function stringField(record: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const value = record[field]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

export async function getMyLiveWatchReading(deviceId: string): Promise<LiveWatchReading | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!data.session?.access_token) throw new Error("Sign in is required to load watch readings.")

  const response = await fetch("/api/sentinel/readings", {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
    cache: "no-store",
  })
  const payload = (await response.json()) as SentinelReadingsResponse & { error?: string }
  if (!response.ok) throw new Error(payload.error || "Live watch data is unavailable.")
  const entry = Object.entries(payload.readings ?? {}).find(([id]) => id.toLowerCase() === deviceId.toLowerCase())
  if (!entry) return null

  const reading = entry[1]
  return {
    heartRate: reading.bpm,
    temperature: reading.temp,
    score: reading.score,
    calibration: reading.calibration,
    status: reading.status,
    updatedAt: reading.updated_at,
  }
}