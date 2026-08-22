"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { WorkforceGrid } from "@/components/workforce-grid"
import { ROLE_META, type Role } from "@/components/app/nav-config"
import { supabase } from "@/lib/supabase/client"

type Step = "email" | "code"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const code = digits.join("")
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault()
    setError("")
    setInfo("")
    if (!validEmail) {
      setError("Enter a valid email address")
      return
    }
    setLoading(true)
    const { data, error } = await supabase.functions.invoke("request-otp", {
      body: { email: email.trim().toLowerCase() },
    })
    setLoading(false)
    if (error || !data?.ok) {
      setError(data?.error || "Could not send the code. Please try again.")
      return
    }
    setDigits(Array(6).fill(""))
    setStep("code")
    setInfo(`We sent a 6-digit code to ${email}`)
    setTimeout(() => inputs.current[0]?.focus(), 50)
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault()
    setError("")
    if (code.length !== 6) {
      setError("Enter the 6-digit code")
      return
    }
    setLoading(true)
    const { data, error: fnError } = await supabase.functions.invoke("verify-otp", {
      body: { email: email.trim().toLowerCase(), code },
    })
    if (fnError || !data?.ok || !data?.token_hash) {
      setLoading(false)
      setError(data?.error || "Incorrect code. Please try again.")
      return
    }
    const { error } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: "magiclink" })
    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    let role: Role = "employee"
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      if (profile?.role) role = profile.role as Role
    }
    router.push(ROLE_META[role].home)
  }

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "")
    if (!clean) {
      setDigits((d) => d.map((x, idx) => (idx === i ? "" : x)))
      return
    }
    setDigits((d) => {
      const next = [...d]
      if (clean.length > 1) {
        for (let k = 0; k < clean.length && i + k < 6; k++) next[i + k] = clean[k]
      } else {
        next[i] = clean
      }
      return next
    })
    const jump = Math.min(i + clean.length, 5)
    inputs.current[jump]?.focus()
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

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
            {step === "email" ? "SIGN IN" : "VERIFY"}
          </span>
          <h2
            className="mt-5 font-light tracking-tight text-[#111]"
            style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: "2rem", lineHeight: 1.1 }}
          >
            {step === "email" ? "Welcome back." : "Enter your code."}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-black/45">
            {step === "email"
              ? "Enter your email and we'll send you a secure sign-in code."
              : info || `We sent a 6-digit code to ${email}`}
          </p>

          {step === "email" ? (
            <form onSubmit={sendCode} className="mt-8 space-y-5" noValidate>
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
              </div>

              {error && <p className="text-xs text-red-500/80">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#111] py-3 text-sm font-medium tracking-widest text-white transition-colors hover:bg-[#333] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "SEND CODE"}
                {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="mt-8 space-y-5" noValidate>
              <div className="flex justify-between gap-2">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el
                    }}
                    inputMode="numeric"
                    maxLength={6}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    className="h-14 w-full rounded-xl border border-black/10 bg-white text-center font-mono text-xl text-[#111] outline-none transition-colors focus:border-black/30"
                  />
                ))}
              </div>

              {error && <p className="text-xs text-red-500/80">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#111] py-3 text-sm font-medium tracking-widest text-white transition-colors hover:bg-[#333] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "VERIFY & SIGN IN"}
                {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email")
                    setError("")
                    setInfo("")
                  }}
                  className="inline-flex items-center gap-1 text-black/45 transition-colors hover:text-black/70"
                >
                  <ArrowLeft className="h-3 w-3" /> Change email
                </button>
                <button
                  type="button"
                  onClick={() => sendCode()}
                  disabled={loading}
                  className="text-black/45 transition-colors hover:text-black/70 disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          <p className="mt-10 text-center text-sm text-black/45">
            New to Sentinel-AI?{" "}
            <Link href="/apply" className="font-medium text-[#111] hover:underline">
              Set up your workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
