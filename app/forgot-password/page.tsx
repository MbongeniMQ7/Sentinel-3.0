"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MailCheck } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return setError("Email is required")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email")
    setError(undefined)
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F4F0] px-6 py-12 font-sans text-[#111] antialiased">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex items-center gap-2">
          <img src="/images/logo.png" alt="Sentinel-AI" className="h-8 w-8 object-contain" />
          <span className="font-pixel text-xs tracking-[0.25em] text-black/60">SENTINEL-AI</span>
        </Link>

        <div className="rounded-2xl border border-black/[0.07] bg-white p-8">
          {!sent ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1 text-[11px] tracking-widest text-black/40">
                RESET
              </span>
              <h1
                className="mt-4 font-light tracking-tight text-[#111]"
                style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: "1.75rem", lineHeight: 1.1 }}
              >
                Reset your password
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-black/45">
                Enter the email associated with your account and we’ll send you a reset link.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
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
                  {error && <p className="mt-1.5 text-xs text-red-500/80">{error}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#111] py-3 text-sm font-medium tracking-widest text-white transition-colors hover:bg-[#333]"
                >
                  SEND RESET LINK
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
                <MailCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <h1
                className="font-light tracking-tight text-[#111]"
                style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: "1.5rem", lineHeight: 1.15 }}
              >
                Check your inbox
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-black/45">
                If an account exists for <span className="font-medium text-black/70">{email}</span>, a reset link is on
                its way.
              </p>
            </div>
          )}
        </div>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-black/45 transition-colors hover:text-black/80"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  )
}
