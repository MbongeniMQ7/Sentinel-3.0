export type SentinelReading = {
  status: string | null
  score: number | null
  bpm: number | null
  temp: number | null
  rmssd: number | null
  base_rmssd: number | null
  calibration: number | null
  updated_at: number | null
}

export type SentinelReadingsResponse = {
  readings: Record<string, SentinelReading>
}
