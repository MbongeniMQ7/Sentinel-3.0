"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, CheckCircle2, Loader2 } from "lucide-react"
import { submitApplication, type ApplicationType } from "@/lib/supabase/db"

const IBM = '"IBM Plex Sans", sans-serif'

const INDUSTRIES = ["Mining", "Manufacturing", "Logistics", "Construction", "Agriculture", "Energy", "Other"]
const SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"]

type FormState = {
  application_type: ApplicationType
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  industry: string
  country: string
  company_size: string
  website: string
  message: string
}

const EMPTY: FormState = {
  application_type: "join",
  company_name: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  industry: "",
  country: "South Africa",
  company_size: "",
  website: "",
  message: "",
}

export default function ApplyPage() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim())
  const canSubmit =
    form.company_name.trim() && form.contact_name.trim() && emailValid && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await submitApplication(form)
      setDone(true)
    } catch {
      setError("Something went wrong submitting your application. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111] antialiased">
      {/* Header */}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-black/60 transition-colors hover:text-black">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[11px] tracking-wide" style={{ fontFamily: "system-ui, sans-serif" }}>
            BACK
          </span>
        </Link>
        <span className="flex items-center gap-2">
          <img src="/images/logo.png" alt="Sentinel-AI" className="h-6 w-6 object-contain" />
          <span className="font-pixel text-xs tracking-[0.25em] text-black/70">SENTINEL-AI</span>
        </span>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        {done ? (
          <div className="mt-10 flex flex-col items-center rounded-3xl border border-black/[0.07] bg-white px-8 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="mt-6 text-2xl font-light" style={{ fontFamily: IBM }}>
              Application received
            </h1>
            <p className="mt-3 max-w-md text-sm text-black/55">
              Thank you, {form.contact_name.split(" ")[0] || "there"}. Our team will review your details and reach out
              to <span className="font-medium text-black/80">{form.contact_email}</span> shortly.
            </p>
            <Link
              href="/"
              className="mt-8 rounded-xl bg-[#111] px-6 py-2.5 text-[12px] tracking-wide text-white transition-colors hover:bg-black"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              RETURN HOME
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1 text-[11px] tracking-widest text-black/40">
                <Building2 className="h-3.5 w-3.5" /> PARTNER WITH US
              </span>
              <h1 className="mt-5 text-4xl font-light leading-[1.08] tracking-tight" style={{ fontFamily: IBM }}>
                Bring SentinelAI to your workforce
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-black/55">
                Tell us about your company. Whether you want to adopt the platform for your teams or acquire the
                software for your own operation, share your details and we&apos;ll be in touch.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-10 rounded-3xl border border-black/[0.07] bg-white p-6 sm:p-8"
            >
              {/* Application type toggle */}
              <div className="mb-8">
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-black/40">
                  I want to
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { key: "join", title: "Join", desc: "Adopt SentinelAI for my teams" },
                      { key: "acquire", title: "Acquire", desc: "Acquire the software for my company" },
                    ] as const
                  ).map((opt) => {
                    const active = form.application_type === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => set("application_type", opt.key)}
                        className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                          active
                            ? "border-[#111] bg-[#111] text-white"
                            : "border-black/10 bg-white text-black/70 hover:border-black/25"
                        }`}
                      >
                        <div className="text-sm font-medium" style={{ fontFamily: IBM }}>
                          {opt.title}
                        </div>
                        <div className={`mt-1 text-xs ${active ? "text-white/60" : "text-black/40"}`}>{opt.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <ApplyField label="Company name" required>
                  <input
                    value={form.company_name}
                    onChange={(e) => set("company_name", e.target.value)}
                    placeholder="Acme Mining Co."
                    className={inputCls}
                  />
                </ApplyField>
                <ApplyField label="Website">
                  <input
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://acme.co.za"
                    className={inputCls}
                  />
                </ApplyField>
                <ApplyField label="Contact name" required>
                  <input
                    value={form.contact_name}
                    onChange={(e) => set("contact_name", e.target.value)}
                    placeholder="Jane Dlamini"
                    className={inputCls}
                  />
                </ApplyField>
                <ApplyField label="Work email" required>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => set("contact_email", e.target.value)}
                    placeholder="jane@acme.co.za"
                    className={inputCls}
                  />
                </ApplyField>
                <ApplyField label="Phone">
                  <input
                    value={form.contact_phone}
                    onChange={(e) => set("contact_phone", e.target.value)}
                    placeholder="+27 82 000 0000"
                    className={inputCls}
                  />
                </ApplyField>
                <ApplyField label="Country">
                  <input
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    placeholder="South Africa"
                    className={inputCls}
                  />
                </ApplyField>
                <ApplyField label="Industry">
                  <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className={inputCls}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </ApplyField>
                <ApplyField label="Company size">
                  <select
                    value={form.company_size}
                    onChange={(e) => set("company_size", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select size</option>
                    {SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s} employees
                      </option>
                    ))}
                  </select>
                </ApplyField>
              </div>

              <div className="mt-5">
                <ApplyField label="Tell us more">
                  <textarea
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    rows={4}
                    placeholder="What are you hoping to achieve with SentinelAI?"
                    className={`${inputCls} h-auto py-2.5`}
                  />
                </ApplyField>
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Submitting…" : "Submit application"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  )
}

const inputCls =
  "h-10 w-full rounded-xl border border-black/10 bg-[#FAFAF8] px-3 text-sm text-[#111] placeholder:text-black/30 focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/5"

function ApplyField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-black/40">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
