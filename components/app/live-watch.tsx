"use client"

// A live smartwatch face: an animated ECG trace that beats at the wearer's real
// heart rate, a fatigue "health ring", and ticking BPM / HRV / temp readouts.
// The numbers come from useLiveVitals (random-walk around the latest reading),
// the ECG beat interval is derived from the live heart rate.
import { useEffect, useRef } from "react"
import { HeartPulse } from "lucide-react"
import { useLiveVitals } from "@/hooks/use-live-vitals"
import type { BiometricRow } from "@/lib/supabase/db"

type Risk = "low" | "moderate" | "high"

const RISK_COLOR: Record<Risk, string> = {
  low: "#10b981",
  moderate: "#f59e0b",
  high: "#ef4444",
}

function gaussian(x: number, mu: number, sigma: number): number {
  return Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma))
}

// Synthetic PQRST waveform, phase 0..1 within a single heartbeat. Returns -1..1.
function ecgValue(p: number): number {
  return (
    0.12 * gaussian(p, 0.17, 0.022) + // P wave
    -0.14 * gaussian(p, 0.33, 0.012) + // Q
    1.0 * gaussian(p, 0.37, 0.011) + // R spike
    -0.3 * gaussian(p, 0.42, 0.014) + // S
    0.24 * gaussian(p, 0.62, 0.045) // T wave
  )
}

function EcgTrace({ bpm, color, connected }: { bpm: number; color: string; connected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bpmRef = useRef(bpm)
  const colorRef = useRef(color)
  const connectedRef = useRef(connected)
  bpmRef.current = bpm
  colorRef.current = color
  connectedRef.current = connected

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    let W = 0
    let H = 0
    let dpr = 1
    let raf = 0
    let last = performance.now()
    let scrollBeats = 0

    function resize() {
      if (!canvas) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const beatsVisible = 3.2

    function frame(now: number) {
      if (!canvas) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const bpmNow = Math.max(30, bpmRef.current || 70)
      if (!prefersReduced) scrollBeats += dt * (bpmNow / 60)

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, W, H)

      const cy = H * 0.56
      const amp = H * 0.33
      const col = colorRef.current

      // Faint baseline grid
      ctx!.strokeStyle = "rgba(255,255,255,0.05)"
      ctx!.lineWidth = 1
      for (let gx = 0; gx <= W; gx += Math.max(12, W / 8)) {
        ctx!.beginPath()
        ctx!.moveTo(gx, 0)
        ctx!.lineTo(gx, H)
        ctx!.stroke()
      }

      if (!connectedRef.current) {
        // Flatline for offline bands.
        ctx!.strokeStyle = "rgba(148,163,184,0.5)"
        ctx!.lineWidth = 1.5
        ctx!.beginPath()
        ctx!.moveTo(0, cy)
        ctx!.lineTo(W, cy)
        ctx!.stroke()
        raf = requestAnimationFrame(frame)
        return
      }

      // Build the waveform path, newest sample at the right edge, scrolling left.
      ctx!.beginPath()
      const step = 2
      for (let x = 0; x <= W; x += step) {
        const fractionFromRight = (W - x) / W
        let phase = (scrollBeats - fractionFromRight * beatsVisible) % 1
        if (phase < 0) phase += 1
        const y = cy - ecgValue(phase) * amp
        if (x === 0) ctx!.moveTo(x, y)
        else ctx!.lineTo(x, y)
      }
      ctx!.strokeStyle = col
      ctx!.lineWidth = 2
      ctx!.lineJoin = "round"
      ctx!.shadowColor = col
      ctx!.shadowBlur = 10
      ctx!.stroke()
      ctx!.shadowBlur = 0

      // Leading dot at the newest sample.
      let headPhase = scrollBeats % 1
      if (headPhase < 0) headPhase += 1
      const headY = cy - ecgValue(headPhase) * amp
      ctx!.beginPath()
      ctx!.arc(W - 1, headY, 2.6, 0, Math.PI * 2)
      ctx!.fillStyle = col
      ctx!.fill()

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="h-full w-full" />
}

export function LiveWatch({
  base,
  riskLevel,
  fatigueScore,
  name,
  deviceId,
  connected = true,
  size = "md",
}: {
  base: BiometricRow | null
  riskLevel?: Risk | null
  fatigueScore?: number | null
  name?: string
  deviceId?: string | null
  connected?: boolean
  size?: "sm" | "md" | "lg"
}) {
  const live = useLiveVitals(base)
  const risk: Risk = riskLevel ?? "low"
  const color = connected ? RISK_COLOR[risk] : "#64748b"
  const hr = live.heart_rate ?? base?.heart_rate ?? null
  const hrv = live.hrv ?? base?.hrv ?? null
  const temp = live.skin_temperature ?? base?.skin_temperature ?? null
  const score = Math.max(0, Math.min(100, Number(fatigueScore ?? 0)))

  const dims = {
    sm: { w: 150, screen: "h-[150px]", bpm: "text-3xl", beat: "h-5 w-5" },
    md: { w: 190, screen: "h-[190px]", bpm: "text-4xl", beat: "h-6 w-6" },
    lg: { w: 260, screen: "h-[260px]", bpm: "text-6xl", beat: "h-8 w-8" },
  }[size]

  // Health ring geometry
  const R = 46
  const C = 2 * Math.PI * R
  const dash = (score / 100) * C

  return (
    <div className="flex flex-col items-center" style={{ width: dims.w }}>
      {/* Watch body */}
      <div
        className="relative rounded-[34px] p-2.5 shadow-2xl"
        style={{
          width: dims.w,
          background: "linear-gradient(160deg,#2a2f3a 0%,#11141b 60%,#05070b 100%)",
          boxShadow: `0 20px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 32px -8px ${color}55`,
        }}
      >
        {/* Crown button */}
        <span
          className="absolute -right-1 top-1/2 h-9 w-2 -translate-y-1/2 rounded-r-md"
          style={{ background: "linear-gradient(90deg,#3a4150,#1b1f27)" }}
        />
        {/* Screen */}
        <div
          className={`relative ${dims.screen} w-full overflow-hidden rounded-[26px]`}
          style={{ background: "radial-gradient(130% 120% at 50% 0%,#0b0f17 0%,#05070b 100%)" }}
        >
          {/* ECG trace background */}
          <div className="absolute inset-0 opacity-90">
            <EcgTrace bpm={hr ?? 70} color={color} connected={connected} />
          </div>

          {/* Health ring (fatigue score) top-right */}
          <svg className="absolute right-2 top-2" width="40" height="40" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9" />
            <circle
              cx="55"
              cy="55"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              transform="rotate(-90 55 55)"
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          </svg>

          {/* Live BPM readout */}
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
            <div className="flex items-center gap-1.5" style={{ color }}>
              <HeartPulse
                className={`${dims.beat} drop-shadow`}
                style={{
                  animation: connected && hr ? `watchBeat ${60 / Math.max(40, hr)}s ease-in-out infinite` : "none",
                }}
              />
            </div>
            <div className={`${dims.bpm} font-semibold leading-none tracking-tight text-white tabular-nums`}>
              {connected ? hr ?? "—" : "—"}
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">bpm</div>
          </div>

          {/* Bottom mini-stats */}
          <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between text-[10px] text-white/55">
            <span className="tabular-nums">HRV {connected ? hrv ?? "—" : "—"}</span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
              style={{ color, background: `${color}22` }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              {connected ? risk : "offline"}
            </span>
            <span className="tabular-nums">{connected ? (temp != null ? `${temp}°` : "—") : "—"}</span>
          </div>
        </div>
      </div>

      {(name || deviceId) && (
        <div className="mt-3 w-full text-center">
          {name && <p className="truncate text-sm font-medium text-slate-100">{name}</p>}
          {deviceId && <p className="truncate font-mono text-[10px] text-slate-400">{deviceId}</p>}
        </div>
      )}

      <style>{`
        @keyframes watchBeat {
          0%, 100% { transform: scale(1); }
          12% { transform: scale(1.28); }
          24% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
