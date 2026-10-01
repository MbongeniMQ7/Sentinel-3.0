"use client"

// Stylized wristband-on-wrist mockup for marketing: a forearm wearing the
// Sentinel band, broadcasting live signal rings with a beating readout.
export function WristbandMockup() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md select-none">
      <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label="Sentinel wristband on a wrist">
        <defs>
          <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9d2bf" />
            <stop offset="1" stopColor="#c9a689" />
          </linearGradient>
          <linearGradient id="case" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a2f3a" />
            <stop offset="1" stopColor="#05070b" />
          </linearGradient>
          <radialGradient id="screen" cx="0.5" cy="0.25" r="0.9">
            <stop offset="0" stopColor="#0b1220" />
            <stop offset="1" stopColor="#05070b" />
          </radialGradient>
        </defs>

        {/* Forearm */}
        <g transform="rotate(-24 200 200)">
          <rect x="150" y="40" width="100" height="320" rx="50" fill="url(#skin)" />
          <rect x="150" y="40" width="100" height="320" rx="50" fill="#000" opacity="0.06" />

          {/* Watch strap */}
          <rect x="140" y="150" width="120" height="100" rx="26" fill="url(#case)" />
          {/* Watch case */}
          <rect x="150" y="158" width="100" height="84" rx="22" fill="url(#case)" stroke="rgba(255,255,255,0.08)" />
          {/* Screen */}
          <rect x="160" y="166" width="80" height="68" rx="16" fill="url(#screen)" />

          {/* Mini ECG */}
          <polyline
            points="166,206 178,206 184,206 190,192 196,222 202,180 208,222 214,206 224,206 234,206"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.1s" repeatCount="indefinite" />
          </polyline>
          <text x="200" y="230" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9" fontFamily="ui-monospace, monospace">
            82 BPM
          </text>
        </g>

        {/* Broadcasting signal rings from the watch */}
        {[0, 1, 2].map((i) => (
          <circle key={i} cx="232" cy="150" r="30" fill="none" stroke="#10b981" strokeWidth="1.5">
            <animate attributeName="r" values="24;90" dur="3s" begin={`${i}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0" dur="3s" begin={`${i}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Streaming
      </span>
    </div>
  )
}
