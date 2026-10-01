"use client"

// Decorative layer of tiny people walking across the base of a chart — a
// playful nod to "workforce activity". Pointer-events-none so it never blocks
// the chart. Uses the role --brand accent by default.
const FIGURES = [
  { delay: 0, dur: 14, scale: 1, bottom: 2 },
  { delay: 3, dur: 18, scale: 0.85, bottom: 6 },
  { delay: 6, dur: 11, scale: 1.1, bottom: 0 },
  { delay: 9, dur: 16, scale: 0.75, bottom: 9 },
  { delay: 1.5, dur: 20, scale: 0.9, bottom: 4 },
  { delay: 12, dur: 13, scale: 1, bottom: 1 },
]

function Walker({ color }: { color: string }) {
  return (
    <svg width="12" height="18" viewBox="0 0 12 18" fill="none" style={{ display: "block" }}>
      <circle cx="6" cy="3" r="2.4" fill={color} />
      <rect x="4.8" y="5.6" width="2.4" height="6.2" rx="1.2" fill={color} />
      <g className="wp-leg-a" style={{ transformOrigin: "6px 11.5px" }}>
        <rect x="5.2" y="11.5" width="1.6" height="5.2" rx="0.8" fill={color} />
      </g>
      <g className="wp-leg-b" style={{ transformOrigin: "6px 11.5px" }}>
        <rect x="5.2" y="11.5" width="1.6" height="5.2" rx="0.8" fill={color} />
      </g>
    </svg>
  )
}

export function WalkingPeople({ color = "var(--brand)", opacity = 0.5 }: { color?: string; opacity?: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden" aria-hidden="true" style={{ opacity }}>
      {FIGURES.map((f, i) => (
        <span
          key={i}
          className="wp-walker"
          style={{
            position: "absolute",
            bottom: f.bottom,
            left: 0,
            transform: `scale(${f.scale})`,
            animation: `wpWalk ${f.dur}s linear ${f.delay}s infinite`,
          }}
        >
          <span className="wp-bob" style={{ display: "block" }}>
            <Walker color={color} />
          </span>
        </span>
      ))}

      <style>{`
        @keyframes wpWalk {
          0%   { transform: translateX(-20px) scaleX(1); }
          49%  { transform: translateX(calc(100% + 20px)) scaleX(1); }
          50%  { transform: translateX(calc(100% + 20px)) scaleX(-1); }
          99%  { transform: translateX(-20px) scaleX(-1); }
          100% { transform: translateX(-20px) scaleX(1); }
        }
        @keyframes wpBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
        @keyframes wpLegA { 0%,100% { transform: rotate(18deg); } 50% { transform: rotate(-18deg); } }
        @keyframes wpLegB { 0%,100% { transform: rotate(-18deg); } 50% { transform: rotate(18deg); } }
        .wp-bob  { animation: wpBob 0.5s ease-in-out infinite; }
        .wp-leg-a { animation: wpLegA 0.5s ease-in-out infinite; }
        .wp-leg-b { animation: wpLegB 0.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .wp-walker, .wp-bob, .wp-leg-a, .wp-leg-b { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
