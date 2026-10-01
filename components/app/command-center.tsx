"use client"

// Live Command Center: an immersive dark wall of smartwatch faces, one per
// employee, each beating at the wearer's real heart rate with a live fatigue
// ring. Plus a heartbeat map, an anomaly spotlight, alert cues and a demo
// "replay day" mode. Data refreshes over Supabase realtime subscriptions.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Activity,
  HeartPulse,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Wifi,
  Volume2,
  VolumeX,
  LayoutGrid,
  Map as MapIcon,
  Play,
  Pause,
} from "lucide-react"
import { LiveWatch } from "@/components/app/live-watch"
import { listLiveFleet, subscribeTable, type FleetMember } from "@/lib/supabase/db"

type RiskFilter = "all" | "high" | "moderate" | "low"
type View = "wall" | "map"
const RISK_RANK: Record<string, number> = { high: 0, moderate: 1, low: 2 }
const RISK_COLOR: Record<string, string> = { low: "#10b981", moderate: "#f59e0b", high: "#ef4444" }

// Circadian heart-rate curve for demo "replay day" mode (phase 0..1 over a day).
function circadianHr(phase: number, persona: number): number {
  const h = phase * 24
  const base = 58 + persona * 10
  const intensity =
    h < 5 ? 0.12 : h < 8 ? 0.35 : h < 12 ? 0.85 : h < 14 ? 0.6 : h < 17 ? 0.9 : h < 21 ? 0.5 : 0.2
  return Math.round(base + intensity * 42)
}

function riskFromHr(hr: number): "low" | "moderate" | "high" {
  return hr >= 105 ? "high" : hr >= 92 ? "moderate" : "low"
}

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

// A pulsing dot for the heartbeat map — pulse speed tracks the real BPM.
function HeartDot({ m }: { m: FleetMember }) {
  const connected = m.connection_status === "connected"
  const color = connected ? RISK_COLOR[m.risk_level ?? "low"] : "#64748b"
  const hr = m.latest?.heart_rate ?? 70
  const dur = connected ? 60 / Math.max(40, hr) : 0
  return (
    <div className="group relative flex flex-col items-center gap-1" title={`${m.full_name ?? "—"} • ${hr} bpm`}>
      <span className="relative flex h-5 w-5 items-center justify-center">
        {connected && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: color, animation: `heartDot ${dur}s ease-out infinite` }}
          />
        )}
        <span className="relative inline-flex h-3 w-3 rounded-full" style={{ background: color }} />
      </span>
      <span className="max-w-18 truncate text-[10px] text-white/50">{(m.full_name ?? "—").split(" ")[0]}</span>
    </div>
  )
}

export function CommandCenter() {
  const [fleet, setFleet] = useState<FleetMember[]>([])
  const [loaded, setLoaded] = useState(false)
  const [site, setSite] = useState("")
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all")
  const [view, setView] = useState<View>("wall")
  const [fullscreen, setFullscreen] = useState(false)
  const [muted, setMuted] = useState(true)
  const [demo, setDemo] = useState(false)
  const [demoPhase, setDemoPhase] = useState(0.33)
  const rootRef = useRef<HTMLDivElement>(null)
  const prevHighRef = useRef<Set<string>>(new Set())

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

  // Demo "replay day": fast-forward the circadian clock so vitals rise & fall.
  useEffect(() => {
    if (!demo) return
    const id = setInterval(() => setDemoPhase((p) => (p + 0.012) % 1), 120)
    return () => clearInterval(id)
  }, [demo])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else rootRef.current?.requestFullscreen().catch(() => {})
  }

  // Apply demo transform to the fleet when replay mode is on.
  const effectiveFleet = useMemo(() => {
    if (!demo) return fleet
    return fleet.map((m, i) => {
      const persona = ((i * 2654435761) % 1000) / 1000
      const hr = circadianHr((demoPhase + persona * 0.15) % 1, persona)
      const risk = riskFromHr(hr)
      return {
        ...m,
        connection_status: "connected" as const,
        risk_level: risk,
        fatigue_score: Math.min(98, Math.max(5, (hr - 55) * 1.6)),
        latest: m.latest
          ? { ...m.latest, heart_rate: hr }
          : {
              id: `demo-${m.employee_id}`,
              reading_time: new Date().toISOString(),
              heart_rate: hr,
              hrv: Math.round(85 - (hr - 55) * 0.6),
              skin_temperature: Number((36.2 + (hr - 55) * 0.012).toFixed(1)),
              movement: hr > 95 ? "high" : hr > 75 ? "moderate" : "low",
              activity_score: Math.min(100, hr - 20),
            },
      }
    })
  }, [fleet, demo, demoPhase])

  // Alert cue: beep + vibrate when a new person crosses into high risk.
  useEffect(() => {
    const high = new Set(effectiveFleet.filter((m) => m.risk_level === "high").map((m) => m.employee_id))
    const fresh = [...high].some((id) => !prevHighRef.current.has(id))
    if (fresh && loaded) {
      if (!muted) {
        try {
          const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext
          const ac = new Ctx()
          const g = ac.createGain()
          g.gain.value = 0.08
          g.connect(ac.destination)
          ;[0, 0.18].forEach((t) => {
            const o = ac.createOscillator()
            o.type = "sine"
            o.frequency.value = 880
            o.connect(g)
            o.start(ac.currentTime + t)
            o.stop(ac.currentTime + t + 0.12)
          })
          setTimeout(() => ac.close(), 600)
        } catch {}
      }
      navigator.vibrate?.([120, 60, 120])
    }
    prevHighRef.current = high
  }, [effectiveFleet, muted, loaded])

  const sites = useMemo(
    () => [...new Set(fleet.map((m) => m.site_name).filter(Boolean))] as string[],
    [fleet],
  )

  const visible = useMemo(() => {
    return effectiveFleet
      .filter((m) => (site ? m.site_name === site : true))
      .filter((m) => (riskFilter === "all" ? true : (m.risk_level ?? "low") === riskFilter))
      .sort((a, b) => {
        const ra = RISK_RANK[a.risk_level ?? "low"] ?? 3
        const rb = RISK_RANK[b.risk_level ?? "low"] ?? 3
        if (ra !== rb) return ra - rb
        return (b.latest?.heart_rate ?? 0) - (a.latest?.heart_rate ?? 0)
      })
  }, [effectiveFleet, site, riskFilter])

  const stats = useMemo(() => {
    const connected = effectiveFleet.filter((m) => m.connection_status === "connected")
    const hrs = connected.map((m) => m.latest?.heart_rate).filter((v): v is number => v != null)
    const avgHr = hrs.length ? Math.round(hrs.reduce((s, v) => s + v, 0) / hrs.length) : 0
    const high = effectiveFleet.filter((m) => m.risk_level === "high").length
    return { monitored: effectiveFleet.length, connected: connected.length, avgHr, high }
  }, [effectiveFleet])

  // Anomaly spotlight: highest risk, then highest heart rate.
  const anomaly = useMemo(() => {
    const ranked = [...effectiveFleet]
      .filter((m) => m.connection_status === "connected" && m.latest?.heart_rate != null)
      .sort((a, b) => {
        const ra = RISK_RANK[a.risk_level ?? "low"] ?? 3
        const rb = RISK_RANK[b.risk_level ?? "low"] ?? 3
        if (ra !== rb) return ra - rb
        return (b.latest?.heart_rate ?? 0) - (a.latest?.heart_rate ?? 0)
      })
    const top = ranked[0]
    return top && (top.risk_level === "high" || (top.latest?.heart_rate ?? 0) >= 100) ? top : null
  }, [effectiveFleet])

  const mapGroups = useMemo(() => {
    const g = new Map<string, FleetMember[]>()
    for (const m of visible) {
      const key = m.site_name ?? "Unassigned"
      g.set(key, [...(g.get(key) ?? []), m])
    }
    return [...g.entries()]
  }, [visible])

  return (
    <div
      ref={rootRef}
      className="relative -mx-4 -my-2 overflow-hidden rounded-2xl p-5 sm:-mx-6 sm:p-7"
      style={{ background: "radial-gradient(120% 90% at 50% -10%,#101826 0%,#0a0e16 55%,#05070b 100%)" }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              {demo ? "Replay" : "Live"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Command Center</h1>
          <p className="mt-1 text-sm text-white/50">
            Real-time wristband vitals across your workforce. Beats, fatigue and connection — at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-white/4 p-0.5">
            <button
              onClick={() => setView("wall")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${view === "wall" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Wall
            </button>
            <button
              onClick={() => setView("map")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${view === "map" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"}`}
            >
              <MapIcon className="h-3.5 w-3.5" /> Map
            </button>
          </div>
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
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${riskFilter === r ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => setDemo((d) => !d)}
            aria-label="Toggle replay day"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-xs font-medium text-white/70 hover:text-white"
          >
            {demo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {demo ? "Stop" : "Replay day"}
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label="Toggle alert sound"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-xs font-medium text-white/70 hover:text-white"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
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
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Activity} label="Monitored" value={stats.monitored} accent="#38bdf8" />
        <StatTile icon={Wifi} label="Connected" value={stats.connected} accent="#10b981" />
        <StatTile icon={HeartPulse} label="Avg BPM" value={stats.avgHr || "—"} accent="#f472b6" />
        <StatTile icon={ShieldAlert} label="High risk" value={stats.high} accent="#ef4444" />
      </div>

      {/* Anomaly spotlight */}
      {anomaly && (
        <div
          className="mb-6 flex items-center gap-4 rounded-xl border px-4 py-3"
          style={{
            borderColor: `${RISK_COLOR[anomaly.risk_level ?? "high"]}55`,
            background: `${RISK_COLOR[anomaly.risk_level ?? "high"]}14`,
            animation: "spotlightPulse 1.8s ease-in-out infinite",
          }}
        >
          <ShieldAlert className="h-5 w-5 shrink-0" style={{ color: RISK_COLOR[anomaly.risk_level ?? "high"] }} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Anomaly detected</p>
            <p className="truncate text-sm text-white">
              <strong className="font-semibold">{anomaly.full_name ?? "Unassigned"}</strong>
              {anomaly.site_name ? ` · ${anomaly.site_name}` : ""} — {anomaly.latest?.heart_rate} bpm,{" "}
              {anomaly.risk_level} fatigue risk
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {!loaded ? (
        <p className="py-16 text-center text-sm text-white/40">Connecting to the fleet…</p>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-white/40">No wristbands match this view.</p>
      ) : view === "wall" ? (
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
      ) : (
        <div className="space-y-5">
          {mapGroups.map(([siteName, members]) => (
            <div key={siteName} className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                {siteName} · {members.length}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-5">
                {members.map((m) => (
                  <HeartDot key={m.employee_id} m={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes heartDot { 0% { transform: scale(0.6); opacity: 0.7 } 100% { transform: scale(2.6); opacity: 0 } }
        @keyframes spotlightPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0) } 50% { box-shadow: 0 0 22px -4px rgba(239,68,68,0.4) } }
      `}</style>
    </div>
  )
}
