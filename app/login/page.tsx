"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { WorkforceGrid } from "@/components/workforce-grid"
import { ROLE_META, type Role } from "@/components/app/nav-config"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!email) next.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email"
    if (!password) next.password = "Password is required"
    setErrors(next)
    if (Object.keys(next).length === 0) router.push("/owner/dashboard")
  }

  const roles: Role[] = ["owner", "manager", "employee"]

  return (
    <div className="grid min-h-screen bg-[#F5F4F0] font-sans text-[#111] antialiased lg:grid-cols-2">
      {/* Left — animated brand panel (matches landing hero) */}
      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0">
          <WorkforceGrid />
        </div>

        {/* Progressive light gradient rising from bottom */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: "70%",
            background:
              "linear-gradient(to top, #F5F4F0 0%, #F5F4F0 16%, rgba(245,244,240,0.82) 38%, rgba(245,244,240,0.4) 62%, transparent 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: "45%",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 100%)",
          }}
        />

        {/* Brand */}
        <Link href="/" className="absolute left-10 top-10 z-30 flex items-center gap-2">
          <img src="/images/logo.png" alt="Sentinel-AI" className="h-7 w-7 object-contain" />
          <span className="font-pixel text-xs tracking-[0.25em] text-black/60">SENTINEL-AI</span>
        </Link>

        {/* Hero copy anchored bottom-left */}
        <div className="absolute inset-x-0 bottom-0 z-30 px-10 pb-12">
          <h1
            className="max-w-md font-light tracking-tight text-[#111]"
            style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: "clamp(2rem, 3.4vw, 3.25rem)", lineHeight: 1.05 }}
          >
            See your workforce clearly.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-black/45">
            Attendance, working hours and fatigue indicators — unified into one operational platform.
          </p>
          <p className="mt-8 text-xs tracking-widest text-black/25">© 2026 SENTINEL-AI WORKFORCE</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-10 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <img src="/images/logo.png" alt="Sentinel-AI" className="h-8 w-8 object-contain" />
              <span className="font-pixel text-xs tracking-[0.25em] text-black/60">SENTINEL-AI</span>
            </Link>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1 text-[11px] tracking-widest text-black/40">
            SIGN IN
          </span>
          <h2
            className="mt-5 font-light tracking-tight text-[#111]"
            style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: "2rem", lineHeight: 1.1 }}
          >
            Welcome back.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-black/45">
            Enter your details to access your workforce operations.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-black/45">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#111] outline-none transition-colors placeholder:text-black/25 focus:border-black/30"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500/80">{errors.email}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium uppercase tracking-widest text-black/45">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-black/40 transition-colors hover:text-black/70">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#111] outline-none transition-colors placeholder:text-black/25 focus:border-black/30"
              />
              {errors.password && <p className="mt-1.5 text-xs text-red-500/80">{errors.password}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-black/45">
              <input type="checkbox" className="h-3.5 w-3.5 rounded border-black/20" />
              Remember me
            </label>

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#111] py-3 text-sm font-medium tracking-widest text-white transition-colors hover:bg-[#333]"
            >
              SIGN IN
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>

          {/* Frontend demo role picker — not authentication */}
          <div className="mt-10">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/[0.07]" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-black/30">Preview interface</span>
              <div className="h-px flex-1 bg-black/[0.07]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => router.push(ROLE_META[r].home)}
                  className="rounded-xl border border-black/10 py-2.5 text-xs font-medium tracking-wide text-black/55 transition-all hover:border-black/25 hover:bg-black/[0.03] hover:text-black"
                >
                  {ROLE_META[r].label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-black/45">
            New to Sentinel-AI?{" "}
            <Link href="/onboarding" className="font-medium text-[#111] hover:underline">
              Set up your workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
