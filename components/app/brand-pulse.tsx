"use client"

// A compact heartbeat line tinted with the current role's --brand accent.
// Dropped into the app header so every page carries the live "pulse" signature.
import { useEffect, useRef } from "react"

function gaussian(x: number, mu: number, sigma: number): number {
  return Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma))
}

function ecgValue(p: number): number {
  return (
    0.12 * gaussian(p, 0.17, 0.022) +
    -0.14 * gaussian(p, 0.33, 0.012) +
    1.0 * gaussian(p, 0.37, 0.011) +
    -0.3 * gaussian(p, 0.42, 0.014) +
    0.24 * gaussian(p, 0.62, 0.045)
  )
}

export function BrandPulse({ width = 112, height = 28, bpm = 64 }: { width?: number; height?: number; bpm?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)

    // Resolve the role accent from the cascading --brand CSS variable.
    const brand = getComputedStyle(canvas).getPropertyValue("--brand").trim() || "#0f2a4a"

    let raf = 0
    let last = performance.now()
    let scroll = 0
    const beatsVisible = 2.6

    function frame(now: number) {
      if (!canvas) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!prefersReduced) scroll += dt * (bpm / 60)

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, width, height)
      const cy = height * 0.55
      const amp = height * 0.34

      ctx!.beginPath()
      for (let x = 0; x <= width; x += 2) {
        const fromRight = (width - x) / width
        let phase = (scroll - fromRight * beatsVisible) % 1
        if (phase < 0) phase += 1
        // Fade the trailing (left) edge for a clean look.
        const y = cy - ecgValue(phase) * amp
        if (x === 0) ctx!.moveTo(x, y)
        else ctx!.lineTo(x, y)
      }
      ctx!.strokeStyle = brand
      ctx!.lineWidth = 1.6
      ctx!.lineJoin = "round"
      ctx!.globalAlpha = 0.85
      ctx!.stroke()
      ctx!.globalAlpha = 1

      let head = scroll % 1
      if (head < 0) head += 1
      ctx!.beginPath()
      ctx!.arc(width - 1, cy - ecgValue(head) * amp, 2, 0, Math.PI * 2)
      ctx!.fillStyle = brand
      ctx!.fill()

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [width, height, bpm])

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--brand)" }} />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--brand)" }} />
      </span>
      <canvas ref={canvasRef} style={{ width, height }} aria-hidden="true" />
    </span>
  )
}
