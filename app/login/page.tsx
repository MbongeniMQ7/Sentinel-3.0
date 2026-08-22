"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button, Input, Field } from "@/components/app/controls"
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden flex-col justify-between bg-[#0f2a4a] p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1">
            <img src="/images/logo.png" alt="Sentinel-AI" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-semibold">Sentinel-AI</span>
            <span className="block text-[10px] uppercase tracking-widest text-white/50">Workforce</span>
          </div>
        </Link>
        <div>
          <h1 className="max-w-sm text-3xl font-light leading-tight">
            See your workforce clearly. Protect your people intelligently.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-white/60">
            Attendance, working hours and fatigue indicators — unified into one operational platform.
          </p>
        </div>
        <p className="text-xs text-white/40">© 2026 SentinelAI Workforce</p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <img src="/images/logo.png" alt="Sentinel-AI" className="h-9 w-9 object-contain" />
              <span className="text-sm font-semibold text-slate-900">Sentinel-AI Workforce</span>
            </Link>
          </div>

          <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Welcome back. Enter your details to continue.</p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Field label="Email" required error={errors.email}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password" required error={errors.password}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-500">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-[#0f2a4a] hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full">
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Frontend demo role picker — not authentication */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Preview interface</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => router.push(ROLE_META[r].home)}
                  className="rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  {ROLE_META[r].label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            New to SentinelAI?{" "}
            <Link href="/onboarding" className="font-medium text-[#0f2a4a] hover:underline">
              Set up your workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
