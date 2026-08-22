"use client"

import { useEffect, useRef } from "react"

// Animated isometric "workforce activity" grid.
// Each cube is a unit of workforce activity; heights breathe with a per-cell
// rhythm, a heartbeat signal sweeps diagonally across the field, and a few
// cells light up like employees clocking in. Rendered in the navy brand color
// on the light hero background.

const NAVY = { r: 15, g: 42, b: 74 } // #0f2a4a

export function WorkforceGrid() {
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

    // Grid configuration
    const COLS = 14
    const ROWS = 14

    // A stable pseudo-random highlight set (active "employees")
    const highlights = new Set<number>()
    for (let i = 0; i < 10; i++) {
      highlights.add(Math.floor(Math.random() * COLS * ROWS))
    }

    function fill(r: number, g: number, b: number, a: number) {
      ctx!.fillStyle = `rgba(${r},${g},${b},${a})`
    }

    function drawCube(sx: number, sy: number, tw: number, th: number, h: number, lit: number) {
      const hw = tw / 2
      const hh = th / 2

      // Right (side) face — mid tone
      fill(NAVY.r, NAVY.g, NAVY.b, 0.10 + lit * 0.18)
      ctx!.beginPath()
      ctx!.moveTo(sx + hw, sy + hh)
      ctx!.lineTo(sx + hw, sy + hh - h)
      ctx!.lineTo(sx, sy + th - h)
      ctx!.lineTo(sx, sy + th)
      ctx!.closePath()
      ctx!.fill()

      // Left (side) face — darker
      fill(NAVY.r, NAVY.g, NAVY.b, 0.06 + lit * 0.12)
      ctx!.beginPath()
      ctx!.moveTo(sx - hw, sy + hh)
      ctx!.lineTo(sx - hw, sy + hh - h)
      ctx!.lineTo(sx, sy + th - h)
      ctx!.lineTo(sx, sy + th)
      ctx!.closePath()
      ctx!.fill()

      // Top face — brightest, brand-tinted
      fill(NAVY.r, NAVY.g, NAVY.b, 0.16 + lit * 0.5)
      ctx!.beginPath()
      ctx!.moveTo(sx, sy - h)
      ctx!.lineTo(sx + hw, sy + hh - h)
      ctx!.lineTo(sx, sy + th - h)
      ctx!.lineTo(sx - hw, sy + hh - h)
      ctx!.closePath()
      ctx!.fill()
    }

    function frame(now: number) {
      if (!canvas) return
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, W, H)

      const t = prefersReduced ? 0 : now * 0.001

      // Tile size scales with viewport; keep 2:1 isometric ratio
      const tw = Math.max(38, W / 16)
      const th = tw / 2

      // Center the diamond, biased toward the upper-right like the old clip
      const originX = W * 0.62
      const originY = H * 0.16

      // Heartbeat signal sweeps diagonally across the grid (by i + j)
      const wavePos = (t * 2.2) % (COLS + ROWS + 6)

      // Draw back-to-front for correct overlap
      for (let sum = 0; sum <= COLS + ROWS - 2; sum++) {
        for (let i = 0; i < COLS; i++) {
          const j = sum - i
          if (j < 0 || j >= ROWS) continue

          const sx = originX + (i - j) * (tw / 2)
          const sy = originY + (i + j) * (th / 2)

          // Cull cubes that fall well outside the visible area
          if (sx < -tw || sx > W + tw || sy > H + tw) continue

          // Base breathing height
          const breathe = 0.5 + 0.5 * Math.sin(t * 0.9 + i * 0.5 + j * 0.35)
          let h = 6 + breathe * 14

          // Heartbeat pulse — a band that lifts cubes as it passes
          const dist = Math.abs(i + j - wavePos)
          const pulse = Math.max(0, 1 - dist / 1.6)
          h += pulse * 26

          // Active "employee" cells glow and stand taller
          const idx = i * ROWS + j
          const isHi = highlights.has(idx)
          const hiPulse = isHi ? 0.5 + 0.5 * Math.sin(t * 2 + idx) : 0
          h += hiPulse * 10

          const lit = Math.min(1, pulse * 0.9 + hiPulse * 0.6)

          drawCube(sx, sy, tw, th, h, lit)
        }
      }

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
