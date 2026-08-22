"use client"

import { useEffect, useRef } from "react"

// Animated device-signal visual: a central wristband broadcasting sync rings,
// with a live ECG heartbeat trace and drifting biometric points. Navy brand
// tint on the light background — used in the Wristband Technology section.

const NAVY = { r: 15, g: 42, b: 74 }

export function SignalWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    let W = 0
    let H = 0
    let dpr = 1

    function resize() {
      if (!canvas) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
    }
    resize()
    window.addEventListener("resize", resize)

    const ECG = [0, 0, 0, 0, 0, 0.15, 0, -0.2, -0.55, 1, -0.35, 0.15, 0, 0, 0, 0, 0, 0, 0, 0]

    function frame(now: number) {
      if (!canvas) return
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, W, H)

      const t = prefersReduced ? 0 : now * 0.001
      const cx = W * 0.5
      const cy = H * 0.5
      const c = `${NAVY.r},${NAVY.g},${NAVY.b}`

      // Concentric sync rings expanding outward
      const rings = 4
      const maxR = Math.min(W, H) * 0.46
      const period = 3.2
      for (let i = 0; i < rings; i++) {
        const phase = ((t / period + i / rings) % 1)
        const r = phase * maxR
        const alpha = (1 - phase) * 0.28
        ctx!.beginPath()
        ctx!.arc(cx, cy, r, 0, Math.PI * 2)
        ctx!.strokeStyle = `rgba(${c},${alpha})`
        ctx!.lineWidth = 1.5
        ctx!.stroke()
      }

      // Drifting biometric points orbiting the device
      const pts = 6
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2 + t * 0.4
        const rr = maxR * (0.55 + 0.12 * Math.sin(t * 1.3 + i))
        const px = cx + Math.cos(a) * rr
        const py = cy + Math.sin(a) * rr * 0.62
        const glow = 0.3 + 0.4 * ((Math.sin(t * 2 + i) + 1) / 2)
        ctx!.beginPath()
        ctx!.arc(px, py, 3, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${c},${glow})`
        ctx!.fill()
      }

      // Central device node
      ctx!.beginPath()
      ctx!.arc(cx, cy, 9, 0, Math.PI * 2)
      ctx!.fillStyle = `rgba(${c},0.85)`
      ctx!.fill()
      ctx!.beginPath()
      ctx!.arc(cx, cy, 15, 0, Math.PI * 2)
      ctx!.strokeStyle = `rgba(${c},0.35)`
      ctx!.lineWidth = 1.5
      ctx!.stroke()

      // Live ECG trace across the lower third
      const baseY = H * 0.78
      const amp = Math.min(H * 0.16, 60)
      const span = W * 0.9
      const startX = W * 0.05
      const scroll = t * 3
      ctx!.beginPath()
      const cols = 80
      for (let i = 0; i <= cols; i++) {
        const idx = Math.floor(i + scroll) % ECG.length
        const x = startX + (i / cols) * span
        const y = baseY - ECG[idx] * amp
        if (i === 0) ctx!.moveTo(x, y)
        else ctx!.lineTo(x, y)
      }
      ctx!.strokeStyle = `rgba(${c},0.5)`
      ctx!.lineWidth = 2
      ctx!.stroke()

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  )
}
