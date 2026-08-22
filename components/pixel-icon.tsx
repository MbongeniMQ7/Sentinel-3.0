"use client"

import { useEffect, useRef } from "react"

// Each icon is a 12×12 pixel grid animated at 60fps with RAF
// Colors are black at varying opacity to match the light theme

type IconType = "platform" | "agents" | "workflow" | "integrations" | "pricing"

interface PixelIconProps {
  type: IconType
  size?: number  // rendered px size (default 40)
}

// ── Platform icon: workforce presence grid — employees "clock in" in a wave ───
const PERSON = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0],
  [1, 0, 1],
]

function drawPlatform(ctx: CanvasRenderingContext2D, W: number, t: number) {
  const cols = 4, rows = 3
  const pRows = PERSON.length, pCols = PERSON[0].length
  const ps = Math.max(2, Math.floor(W / 20))
  const glyphW = pCols * ps
  const glyphH = pRows * ps
  const gapX = (W - cols * glyphW) / (cols + 1)
  const gapY = (W - rows * glyphH) / (rows + 1)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Diagonal wave — figures light up like sequential clock-ins
      const phase = (r + c) * 0.5
      const lit = 0.14 + 0.62 * ((Math.sin(t * 0.003 - phase) + 1) / 2)
      const ox = gapX + c * (glyphW + gapX)
      const oy = gapY + r * (glyphH + gapY)
      ctx.fillStyle = `rgba(0,0,0,${lit})`
      PERSON.forEach((prow, pr) => {
        prow.forEach((cell, pc) => {
          if (!cell) return
          ctx.fillRect(ox + pc * ps, oy + pr * ps, ps - 1, ps - 1)
        })
      })
    }
  }
}

// ── Agents icon: ECG heartbeat — biometric fatigue signal scrolling by ────────
// Vertical offsets (in pixel rows) for one heartbeat cycle; 0 = baseline
const ECG = [0, 0, 0, 0, 0, 1, 0, -1, -3, 5, -2, 1, 0, 0, 0, 0, 0, 0]

function drawAgents(ctx: CanvasRenderingContext2D, W: number, t: number) {
  const cols   = 15
  const ps     = W / cols
  const mid    = W / 2
  const scroll = Math.floor(t / 90)

  let prevY = mid
  for (let c = 0; c < cols; c++) {
    const idx = (c + scroll) % ECG.length
    const y   = mid - ECG[idx] * ps
    // Trailing fade — brighter toward the leading edge of the trace
    const alpha = 0.18 + 0.62 * (c / cols)
    ctx.fillStyle = `rgba(0,0,0,${alpha})`

    // Connect the previous sample to this one so the line stays continuous
    const steps = Math.max(1, Math.round(Math.abs(y - prevY) / ps))
    for (let s = 0; s <= steps; s++) {
      const yy = prevY + (y - prevY) * (s / steps)
      ctx.fillRect(c * ps, Math.round(yy / ps) * ps, ps - 1, ps - 1)
    }
    prevY = y
  }
}

// ── Workflow icon: smart wristband with a pulsing heartbeat screen ────────────
function drawWorkflow(ctx: CanvasRenderingContext2D, W: number, t: number) {
  const cols = 8, rows = 12
  const ps   = Math.floor(W / rows)
  const offX = Math.floor((W - cols * ps) / 2)
  const offY = Math.floor((W - rows * ps) / 2)
  const px = (c: number, r: number, a: number) => {
    ctx.fillStyle = `rgba(0,0,0,${a})`
    ctx.fillRect(offX + c * ps, offY + r * ps, ps - 1, ps - 1)
  }

  // Straps (top + bottom)
  ;[0, 1, 2, 9, 10, 11].forEach((r) => {
    px(3, r, 0.22)
    px(4, r, 0.22)
  })

  // Screen border (rows 3–8, cols 1–6)
  for (let r = 3; r <= 8; r++) {
    for (let c = 1; c <= 6; c++) {
      if (r === 3 || r === 8 || c === 1 || c === 6) px(c, r, 0.4)
    }
  }

  // Heartbeat blip inside the screen — pulses to "beat"
  const beat = 0.35 + 0.6 * Math.abs(Math.sin(t * 0.006))
  const blip: [number, number][] = [
    [2, 6],
    [3, 5],
    [4, 3],
    [5, 5],
  ]
  blip.forEach(([c, r]) => px(c, r, beat))
}

// ── Integrations icon: wristband broadcasting sync signal rings ───────────────
function drawIntegrations(ctx: CanvasRenderingContext2D, W: number, t: number) {
  const ps = Math.max(2, Math.floor(W / 16))
  const cx = W / 2
  const cy = W / 2

  // Central device
  ctx.fillStyle = "rgba(0,0,0,0.78)"
  ctx.fillRect(cx - ps, cy - ps, ps * 2 - 1, ps * 2 - 1)

  // Concentric rings expanding outward — the device syncing its signal
  const ringCount = 3
  const period = 1600
  for (let ring = 0; ring < ringCount; ring++) {
    const phase  = ((t + ring * (period / ringCount)) % period) / period // 0→1
    const radius = phase * (W * 0.42)
    const alpha  = (1 - phase) * 0.5
    const steps  = 22
    for (let s = 0; s < steps; s++) {
      const a = (s / steps) * Math.PI * 2
      const x = cx + Math.cos(a) * radius
      const y = cy + Math.sin(a) * radius
      ctx.fillStyle = `rgba(0,0,0,${alpha})`
      ctx.fillRect(Math.round(x / ps) * ps, Math.round(y / ps) * ps, ps - 1, ps - 1)
    }
  }
}

// ── Pricing icon: stacked bar chart growing ───────────────────────────────────
function drawPricing(ctx: CanvasRenderingContext2D, W: number, t: number) {
  const ps    = Math.floor(W / 12)
  const bars  = 3
  const bw    = ps * 2
  const gap   = ps
  const total = bars * bw + (bars - 1) * gap
  const offX  = Math.floor((W - total) / 2)
  const maxH  = W * 0.7

  const heights = [0.45, 0.75, 0.55]
  const wave = Math.sin(t * 0.0015) * 0.12

  heights.forEach((h, i) => {
    const animated = Math.max(0.1, h + wave * (i % 2 === 0 ? 1 : -1))
    const bh = animated * maxH
    const x  = offX + i * (bw + gap)
    const y  = W - bh - ps

    // Bar body (pixelated — fill row by row)
    const rowCount = Math.floor(bh / ps)
    for (let row = 0; row < rowCount; row++) {
      const progress = 1 - row / rowCount
      const alpha    = 0.15 + progress * 0.7
      ctx.fillStyle  = `rgba(0,0,0,${alpha})`
      ctx.fillRect(x, y + row * ps, bw, ps - 1)
    }
  })
}

// ── Canvas wrapper ────────────────────────────────────────────────────────────
export function PixelIcon({ type, size = 40 }: PixelIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    const draw = (t: number) => {
      const dpr = window.devicePixelRatio || 1
      canvas.width  = size * dpr
      canvas.height = size * dpr
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, size, size)

      // Disable anti-aliasing for crisp pixels
      ctx.imageSmoothingEnabled = false

      switch (type) {
        case "platform":      drawPlatform(ctx, size, t);      break
        case "agents":        drawAgents(ctx, size, t);        break
        case "workflow":      drawWorkflow(ctx, size, t);      break
        case "integrations":  drawIntegrations(ctx, size, t);  break
        case "pricing":       drawPricing(ctx, size, t);       break
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [type, size])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        display: "block",
        flexShrink: 0,
      }}
    />
  )
}
