"use client"

import { useState } from "react"
import { UserRound } from "lucide-react"
import { SectionCard } from "@/components/app/primitives"
import { Button, Input, Field } from "@/components/app/controls"
import { Toast } from "@/components/app/toast"

export default function EmployeeProfilePage() {
  const [toast, setToast] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setToast("Profile updated for this session.")
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your personal details.</p>
      </div>

      <SectionCard title="Details">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <UserRound className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Your name</p>
            <p className="text-xs text-slate-500">Employee</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Full name">
            <Input placeholder="Your full name" />
          </Field>
          <Field label="Email">
            <Input type="email" placeholder="you@company.com" />
          </Field>
          <Field label="Phone">
            <Input type="tel" placeholder="Phone number" />
          </Field>
          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </SectionCard>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
