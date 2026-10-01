"use client"

// "Pulse of the workforce": one wide ECG line whose beat rate tracks the fleet's
// average BPM — a single living wave summarizing everyone at once.
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

export function WorkforcePulse({ bpm, color = "#38bdf8", height = 72 }: { bpm: number; color?: string; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bpmRef = useRef(bpm)
  const colorRef = useRef(color)
  bpmRef.current = bpm
  colorRef.current = color

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
    let scroll = 0

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

    const beatsVisible = 7

    function frame(now: number) {
      if (!canvas) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const bpmNow = Math.max(40, bpmRef.current || 70)
      if (!prefersReduced) scroll += dt * (bpmNow / 60)

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, W, H)
      const cy = H * 0.55
      const amp = H * 0.34
      const col = colorRef.current

      ctx!.beginPath()
      for (let x = 0; x <= W; x += 2) {
        const fromRight = (W - x) / W
        let phase = (scroll - fromRight * beatsVisible) % 1
        if (phase < 0) phase += 1
        const y = cy - ecgValue(phase) * amp
        if (x === 0) ctx!.moveTo(x, y)
        else ctx!.lineTo(x, y)
      }
      ctx!.strokeStyle = col
      ctx!.lineWidth = 2
      ctx!.lineJoin = "round"
      ctx!.shadowColor = col
      ctx!.shadowBlur = 12
      ctx!.stroke()
      ctx!.shadowBlur = 0

      let head = scroll % 1
      if (head < 0) head += 1
      ctx!.beginPath()
      ctx!.arc(W - 1, cy - ecgValue(head) * amp, 3, 0, Math.PI * 2)
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

  return <canvas ref={canvasRef} className="w-full" style={{ height }} />
}
