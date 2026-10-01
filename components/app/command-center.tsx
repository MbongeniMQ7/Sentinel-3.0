"use client"

// Live Command Center: an immersive dark wall of smartwatch faces, one per
// employee, each beating at the wearer's real heart rate with a live fatigue
// ring. Built for the "big screen" — a glanceable, real-time view of the whole
// workforce's wellbeing. Data refreshes over Supabase realtime subscriptions.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Activity, HeartPulse, Maximize2, Minimize2, ShieldAlert, Wifi } from "lucide-react"
import { LiveWatch } from "@/components/app/live-watch"
import { listLiveFleet, subscribeTable, type FleetMember } from "@/lib/supabase/db"

type RiskFilter = "all" | "high" | "moderate" | "low"
const RISK_RANK: Record<string, number> = { high: 0, moderate: 1, low: 2 }

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof HeartPulse
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/3 px-4 py-3 backdrop-blur">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${accent}22`, color: accent }}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xl font-semibold leading-none text-white tabular-nums">{value}</div>
        <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">{label}</div>
      </div>
    </div>
  )
}

export function CommandCenter() {
  const [fleet, setFleet] = useState<FleetMember[]>([])
  const [loaded, setLoaded] = useState(false)
  const [site, setSite] = useState("")
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all")
  const [fullscreen, setFullscreen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    listLiveFleet()
      .then((f) => {
        setFleet(f)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  useEffect(() => {
    load()
    const subs = [
      subscribeTable("biometric_readings", load),
      subscribeTable("fatigue_assessments", load),
      subscribeTable("devices", load),
    ]
    return () => subs.forEach((u) => u())
  }, [load])

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else rootRef.current?.requestFullscreen().catch(() => {})
  }

  const sites = useMemo(
    () => [...new Set(fleet.map((m) => m.site_name).filter(Boolean))] as string[],
    [fleet],
  )

  const visible = useMemo(() => {
    return fleet
      .filter((m) => (site ? m.site_name === site : true))
      .filter((m) => (riskFilter === "all" ? true : (m.risk_level ?? "low") === riskFilter))
      .sort((a, b) => {
        const ra = RISK_RANK[a.risk_level ?? "low"] ?? 3
        const rb = RISK_RANK[b.risk_level ?? "low"] ?? 3
        if (ra !== rb) return ra - rb
        return (b.latest?.heart_rate ?? 0) - (a.latest?.heart_rate ?? 0)
      })
  }, [fleet, site, riskFilter])

  const stats = useMemo(() => {
    const connected = fleet.filter((m) => m.connection_status === "connected")
    const hrs = connected.map((m) => m.latest?.heart_rate).filter((v): v is number => v != null)
    const avgHr = hrs.length ? Math.round(hrs.reduce((s, v) => s + v, 0) / hrs.length) : 0
    const high = fleet.filter((m) => m.risk_level === "high").length
    return { monitored: fleet.length, connected: connected.length, avgHr, high }
  }, [fleet])

  return (
    <div
      ref={rootRef}
      className="relative -mx-4 -my-2 overflow-hidden rounded-2xl p-5 sm:-mx-6 sm:p-7"
      style={{
        background: "radial-gradient(120% 90% at 50% -10%,#101826 0%,#0a0e16 55%,#05070b 100%)",
      }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Live</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Command Center</h1>
          <p className="mt-1 text-sm text-white/50">
            Real-time wristband vitals across your workforce. Beats, fatigue and connection — at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            aria-label="Filter by site"
            className="rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-sm text-white/80 outline-none focus:border-white/25"
          >
            <option value="" className="text-slate-900">All sites</option>
            {sites.map((s) => (
              <option key={s} value={s} className="text-slate-900">
                {s}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-white/10 bg-white/4 p-0.5">
            {(["all", "high", "moderate", "low"] as RiskFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                  riskFilter === r ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={toggleFullscreen}
            aria-label="Toggle full screen"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-xs font-medium text-white/70 hover:text-white"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {fullscreen ? "Exit" : "Big screen"}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Activity} label="Monitored" value={stats.monitored} accent="#38bdf8" />
        <StatTile icon={Wifi} label="Connected" value={stats.connected} accent="#10b981" />
        <StatTile icon={HeartPulse} label="Avg BPM" value={stats.avgHr || "—"} accent="#f472b6" />
        <StatTile icon={ShieldAlert} label="High risk" value={stats.high} accent="#ef4444" />
      </div>

      {stats.high > 0 && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            <strong className="font-semibold">{stats.high}</strong> {stats.high === 1 ? "person is" : "people are"} at high
            fatigue risk — review and intervene.
          </span>
        </div>
      )}

      {/* Watch wall */}
      {!loaded ? (
        <p className="py-16 text-center text-sm text-white/40">Connecting to the fleet…</p>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-white/40">No wristbands match this view.</p>
      ) : (
        <div className="grid grid-cols-2 justify-items-center gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((m) => (
            <LiveWatch
              key={m.employee_id}
              base={m.latest}
              riskLevel={m.risk_level}
              fatigueScore={m.fatigue_score}
              name={m.full_name || "Unassigned"}
              deviceId={m.device_id}
              connected={m.connection_status === "connected"}
              size="sm"
            />
          ))}
        </div>
      )}
    </div>
  )
}
