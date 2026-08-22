"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MailCheck } from "lucide-react"
import { Button, Input, Field } from "@/components/app/controls"

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <img src="/images/logo.png" alt="Sentinel-AI" className="h-9 w-9 object-contain" />
          <span className="text-sm font-semibold text-slate-900">Sentinel-AI Workforce</span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          {!sent ? (
            <>
              <h1 className="text-xl font-semibold text-slate-900">Reset your password</h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter the email associated with your account and we’ll send you a reset link.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                <Field label="Email" required error={error}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </Field>
                <Button type="submit" className="w-full">
                  Send reset link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
                <MailCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900">Check your inbox</h1>
              <p className="mt-1 text-sm text-slate-500">
                If an account exists for <span className="font-medium text-slate-700">{email}</span>, a reset link is on
                its way.
              </p>
            </div>
          )}
        </div>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  )
}
