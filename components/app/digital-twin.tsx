"use client"

// Digital twin: a cinematic full-screen profile for one worker — a big beating
// heart, live vital bars and the fatigue ring. Opened by clicking a watch.
import { useEffect } from "react"
import { X, HeartPulse, Activity, Thermometer, Gauge, Wifi, Battery } from "lucide-react"
import { LiveWatch } from "@/components/app/live-watch"
import { useLiveVitals } from "@/hooks/use-live-vitals"
import type { FleetMember } from "@/lib/supabase/db"

const RISK_COLOR: Record<string, string> = { low: "#10b981", moderate: "#f59e0b", high: "#ef4444" }

function VitalBar({ label, value, max, unit, color }: { label: string; value: number | null; max: number; unit: string; color: string }) {
  const pct = value == null ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-white/60">
        <span>{label}</span>
        <span className="tabular-nums text-white/90">
          {value ?? "—"} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export function DigitalTwin({ member, onClose }: { member: FleetMember; onClose: () => void }) {
  const live = useLiveVitals(member.latest)
  const connected = member.connection_status === "connected"
  const color = connected ? RISK_COLOR[member.risk_level ?? "low"] : "#64748b"
  const hr = live.heart_rate ?? member.latest?.heart_rate ?? 0
  const beat = connected && hr ? 60 / Math.max(40, hr) : 0

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      style={{ background: "radial-gradient(120% 90% at 50% 0%,#0b1220ee 0%,#05070bf2 70%)" }}
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 p-7"
        style={{ background: "radial-gradient(120% 90% at 50% -10%,#121a28 0%,#0a0e16 60%,#05070b 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color }}>
            Digital Twin
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{member.full_name || "Unassigned"}</h2>
          <p className="text-sm text-white/50">{member.site_name ?? "No site"} · {member.device_id ?? "No device"}</p>
        </div>

        <div className="grid gap-7 md:grid-cols-[auto_1fr]">
          {/* Beating heart + watch */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: `radial-gradient(circle,${color}44 0%,transparent 70%)`, animation: beat ? `twinGlow ${beat}s ease-in-out infinite` : "none" }}
              />
              <HeartPulse
                className="h-24 w-24"
                style={{ color, animation: beat ? `twinBeat ${beat}s ease-in-out infinite` : "none" }}
              />
              <div className="absolute -bottom-1 text-center">
                <div className="text-3xl font-semibold text-white tabular-nums">{connected ? hr : "—"}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">bpm</div>
              </div>
            </div>
            <LiveWatch
              base={member.latest}
              riskLevel={member.risk_level}
              fatigueScore={member.fatigue_score}
              connected={connected}
              size="md"
            />
          </div>

          {/* Vitals + status */}
          <div className="space-y-5">
            <VitalBar label="Heart rate" value={connected ? hr : null} max={160} unit="bpm" color={color} />
            <VitalBar label="HRV" value={connected ? live.hrv ?? member.latest?.hrv ?? null : null} max={120} unit="ms" color="#60a5fa" />
            <VitalBar label="Skin temperature" value={connected ? live.skin_temperature ?? member.latest?.skin_temperature ?? null : null} max={40} unit="°C" color="#f472b6" />
            <VitalBar label="Fatigue score" value={member.fatigue_score != null ? Math.round(member.fatigue_score) : null} max={100} unit="" color={color} />

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { icon: Gauge, label: "Risk", value: connected ? (member.risk_level ?? "—") : "offline" },
                { icon: Activity, label: "Movement", value: member.latest?.movement ?? "—" },
                { icon: Wifi, label: "Connection", value: member.connection_status ?? "—" },
                { icon: Battery, label: "Battery", value: member.battery_level != null ? `${member.battery_level}%` : "—" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <s.icon className="h-4 w-4 text-white/40" />
                  <div>
                    <div className="text-sm font-medium capitalize text-white">{s.value}</div>
                    <div className="text-[10px] uppercase tracking-wide text-white/40">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes twinBeat { 0%,100% { transform: scale(1) } 14% { transform: scale(1.18) } 28% { transform: scale(1) } }
        @keyframes twinGlow { 0%,100% { opacity: 0.4 } 14% { opacity: 0.9 } 28% { opacity: 0.4 } }
      `}</style>
    </div>
  )
}
