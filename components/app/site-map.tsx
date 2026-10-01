"use client"

// Live site map: a stylized facility floor where each worker is a dot that
// drifts between zones and pulses at their real heart rate, colored by fatigue.
import { useEffect, useRef } from "react"
import type { FleetMember } from "@/lib/supabase/db"

const RISK_RGB: Record<string, string> = { low: "16,185,129", moderate: "245,158,11", high: "239,68,68" }
const ZONES = ["Entrance", "Floor A", "Floor B", "Loading", "Rest Area"]

type Dot = { x: number; y: number; vx: number; vy: number; zone: number; phase: number }

export function SiteMap({ members, height = 440 }: { members: FleetMember[]; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotsRef = useRef<Map<string, Dot>>(new Map())
  const membersRef = useRef(members)
  membersRef.current = members

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

    function zoneRects() {
      const pad = 16
      const gap = 12
      const cols = 3
      const rows = 2
      const cw = (W - pad * 2 - gap * (cols - 1)) / cols
      const ch = (H - pad * 2 - gap * (rows - 1)) / rows
      const rects: { x: number; y: number; w: number; h: number; name: string }[] = []
      for (let i = 0; i < ZONES.length; i++) {
        const c = i % cols
        const r = Math.floor(i / cols)
        rects.push({ x: pad + c * (cw + gap), y: pad + r * (ch + gap), w: cw, h: ch, name: ZONES[i] })
      }
      return rects
    }

    function frame(now: number) {
      if (!canvas) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, W, H)
      const rects = zoneRects()

      // Draw zones
      for (const z of rects) {
        ctx!.fillStyle = "rgba(255,255,255,0.025)"
        ctx!.strokeStyle = "rgba(255,255,255,0.08)"
        ctx!.lineWidth = 1
        ctx!.beginPath()
        ctx!.roundRect(z.x, z.y, z.w, z.h, 14)
        ctx!.fill()
        ctx!.stroke()
        ctx!.fillStyle = "rgba(255,255,255,0.3)"
        ctx!.font = "600 10px ui-sans-serif, system-ui"
        ctx!.fillText(z.name.toUpperCase(), z.x + 12, z.y + 20)
      }

      const dots = dotsRef.current
      const members = membersRef.current
      const alive = new Set<string>()

      members.forEach((m, i) => {
        alive.add(m.employee_id)
        let d = dots.get(m.employee_id)
        if (!d) {
          const z = i % rects.length
          const r = rects[z]
          d = {
            x: r.x + 20 + Math.random() * (r.w - 40),
            y: r.y + 30 + Math.random() * (r.h - 50),
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.5) * 14,
            zone: z,
            phase: Math.random(),
          }
          dots.set(m.employee_id, d)
        }
        const r = rects[d.zone]
        if (!prefersReduced) {
          // Occasionally wander to another zone
          if (Math.random() < 0.002) d.zone = Math.floor(Math.random() * rects.length)
          d.x += d.vx * dt
          d.y += d.vy * dt
          if (d.x < r.x + 16 || d.x > r.x + r.w - 16) d.vx *= -1
          if (d.y < r.y + 28 || d.y > r.y + r.h - 16) d.vy *= -1
          d.x = Math.max(r.x + 16, Math.min(r.x + r.w - 16, d.x))
          d.y = Math.max(r.y + 28, Math.min(r.y + r.h - 16, d.y))
        }

        const connected = m.connection_status === "connected"
        const rgb = connected ? RISK_RGB[m.risk_level ?? "low"] : "100,116,139"
        const hr = m.latest?.heart_rate ?? 70
        if (connected && !prefersReduced) d.phase = (d.phase + dt * (hr / 60)) % 1

        // Pulse ring
        if (connected) {
          const pr = 4 + d.phase * 14
          ctx!.beginPath()
          ctx!.arc(d.x, d.y, pr, 0, Math.PI * 2)
          ctx!.strokeStyle = `rgba(${rgb},${(1 - d.phase) * 0.5})`
          ctx!.lineWidth = 1.5
          ctx!.stroke()
        }
        // Core dot
        ctx!.beginPath()
        ctx!.arc(d.x, d.y, 4, 0, Math.PI * 2)
        ctx!.fillStyle = `rgb(${rgb})`
        ctx!.shadowColor = `rgb(${rgb})`
        ctx!.shadowBlur = connected ? 8 : 0
        ctx!.fill()
        ctx!.shadowBlur = 0
      })

      // Drop dots for departed members
      for (const key of [...dots.keys()]) if (!alive.has(key)) dots.delete(key)

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/3">
      <canvas ref={canvasRef} className="w-full" style={{ height }} />
    </div>
  )
}
