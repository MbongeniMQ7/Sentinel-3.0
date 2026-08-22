"use client"

import { useEffect, useState } from "react"

const LOGO_IN_DUR      = 900   // duration of the logo appear transition
const HOLD_DURATION    = 600   // hold fully visible before exit
const LETTERS_IN_TOTAL = LOGO_IN_DUR + HOLD_DURATION

const LOGO_OUT_DUR     = 500   // duration of the logo fade out
const LETTERS_OUT_TOTAL = LOGO_OUT_DUR

const CURTAIN_DELAY      = LETTERS_IN_TOTAL + 100
const CURTAIN_DURATION   = 1300  // matches the CSS transition on the curtain div
const ANIM_TOTAL         = CURTAIN_DELAY + LETTERS_OUT_TOTAL + 1400

// Exported: moment the curtain finishes retracting — when the bg is fully visible
export const INTRO_DURATION_MS = CURTAIN_DELAY + CURTAIN_DURATION
// Exported: ms before curtain fully done to start hero animations (overlap for smoothness)
export const HERO_REVEAL_MS = CURTAIN_DELAY + CURTAIN_DURATION - 150

type Phase = "idle" | "in" | "out" | "done"

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [curtainUp, setCurtainUp] = useState(false)

  useEffect(() => {
    // Tiny delay so the browser has painted before we start transitioning
    const t0 = setTimeout(() => setPhase("in"), 80)
    const t1 = setTimeout(() => setPhase("out"), LETTERS_IN_TOTAL)
    const t2 = setTimeout(() => setCurtainUp(true), CURTAIN_DELAY)
    const t3 = setTimeout(() => onDone(), HERO_REVEAL_MS)
    const t4 = setTimeout(() => setPhase("done"), ANIM_TOTAL)

    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  if (phase === "done") return null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none" aria-hidden="true">

      {/* Gradient curtain — retracts upward, revealing mountains from bottom */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          bottom: curtainUp ? "100%" : "0%",
          transition: curtainUp ? "bottom 1.3s cubic-bezier(0.76, 0, 0.24, 1)" : "none",
          background: "#f5f4f1",
        }}
      />

      {/* SentinelAI logo */}
      <div className="absolute inset-0 flex items-center justify-center px-8">
        {(() => {
          const isIdle = phase === "idle"
          const isIn   = phase === "in"
          const isOut  = phase === "out"

          const opacity    = isIdle ? 0 : isIn ? 1 : 0
          const blur       = isIdle ? 28 : isIn ? 0 : 18
          const scale      = isIdle ? 0.9 : isIn ? 1 : 1.04

          const transition = isOut
            ? `opacity ${LOGO_OUT_DUR}ms cubic-bezier(0.4,0,1,1),
               filter  ${LOGO_OUT_DUR}ms cubic-bezier(0.4,0,1,1),
               transform ${LOGO_OUT_DUR}ms cubic-bezier(0.4,0,1,1)`
            : isIn
            ? `opacity ${LOGO_IN_DUR}ms cubic-bezier(0.16,1,0.3,1),
               filter  ${LOGO_IN_DUR}ms cubic-bezier(0.16,1,0.3,1),
               transform ${LOGO_IN_DUR}ms cubic-bezier(0.16,1,0.3,1)`
            : "none"

          return (
            <img
              src="/images/logo.png"
              alt="Sentinel-AI"
              className="w-[min(72vw,420px)] select-none"
              style={{
                opacity,
                filter: `blur(${blur}px)`,
                transform: `scale(${scale})`,
                transition,
                willChange: "opacity, filter, transform",
              }}
            />
          )
        })()}
      </div>

    </div>
  )
}
