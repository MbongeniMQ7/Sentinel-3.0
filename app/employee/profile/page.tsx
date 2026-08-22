"use client"

import { useEffect, useState } from "react"
import { UserRound } from "lucide-react"
import { SectionCard } from "@/components/app/primitives"
import { Button, Input, Field } from "@/components/app/controls"
import { Toast } from "@/components/app/toast"
import { getProfile, updateMyProfile, type Profile } from "@/lib/supabase/db"

export default function EmployeeProfilePage() {
  const [toast, setToast] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p)
      setFirstName(p?.first_name ?? "")
      setLastName(p?.last_name ?? "")
      setPhone(p?.phone ?? "")
    })
  }, [])

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Your name"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateMyProfile({ first_name: firstName, last_name: lastName, phone })
      setToast("Profile updated.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your personal details.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Overview" className="lg:col-span-1">
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <UserRound className="h-9 w-9 text-slate-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">{fullName}</p>
              <p className="text-xs capitalize text-slate-500">{profile?.role ?? "Employee"}</p>
            </div>
            {profile?.email && <p className="break-all text-xs text-slate-400">{profile.email}</p>}
          </div>
        </SectionCard>

        <SectionCard title="Details" className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </Field>
              <Field label="Last name">
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </Field>
            </div>
            <Field label="Email" hint="Email is managed via your login and can't be changed here.">
              <Input type="email" value={profile?.email ?? ""} disabled />
            </Field>
            <Field label="Phone">
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
            </Field>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </SectionCard>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
