"use client"

import { useEffect, useRef, useState } from "react"
import { SlidersHorizontal, ImagePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionCard, EmptyState } from "./primitives"
import { Button, Input, Field, Select } from "./controls"
import { Toast } from "./toast"
import {
  getProfile,
  updateMyProfile,
  getOrganization,
  updateOrganization,
  uploadOrganizationLogo,
  type Profile,
  type Organization,
} from "@/lib/supabase/db"

export type SettingsTab = { id: string; label: string }

function AccountTab() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [language, setLanguage] = useState("English")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    getProfile()
      .then((p) => {
        if (!p) return
        setProfile(p)
        setFirstName(p.first_name ?? "")
        setLastName(p.last_name ?? "")
        setLanguage(p.language ?? "English")
      })
      .catch(() => {})
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateMyProfile({ first_name: firstName.trim(), last_name: lastName.trim(), language })
      setToast("Account updated.")
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not save changes.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard title="Account" description="Your personal profile details.">
      <form onSubmit={save} className="max-w-lg space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your first name" />
          </Field>
          <Field label="Last name">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your last name" />
          </Field>
        </div>
        <Field label="Email" hint="Your sign-in email can't be changed here.">
          <Input type="email" value={profile?.email ?? ""} disabled />
        </Field>
        <Field label="Language">
          <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option>English</option>
          </Select>
        </Field>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </SectionCard>
  )
}

function CompanyTab() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [name, setName] = useState("")
  const [currency, setCurrency] = useState("ZAR")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getOrganization()
      .then((o) => {
        if (!o) return
        setOrg(o)
        setName(o.name ?? "")
        setCurrency(o.currency ?? "ZAR")
        setLogoUrl(o.logo_url ?? null)
      })
      .catch(() => {})
  }, [])

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadOrganizationLogo(file)
      setLogoUrl(url)
      setToast("Logo updated.")
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not upload the logo.")
    } finally {
      setUploading(false)
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateOrganization({ name: name.trim(), currency })
      setToast("Company updated.")
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not save changes.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard title="Company" description="Organisation details shown across the platform.">
      <form onSubmit={save} className="max-w-lg space-y-4">
        <Field label="Logo" hint="PNG or JPG, up to 2MB.">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {logoUrl ? (
                <img src={logoUrl} alt="Company logo" className="h-full w-full object-contain" />
              ) : (
                <ImagePlus className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || !org}
            >
              {uploading ? "Uploading…" : logoUrl ? "Change logo" : "Upload logo"}
            </Button>
          </div>
        </Field>
        <Field label="Company name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your company" />
        </Field>
        <Field label="Currency" hint="Used for estimated earnings">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="ZAR">ZAR (R)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
          </Select>
        </Field>
        <Button type="submit" disabled={saving || !org}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </SectionCard>
  )
}

function TabContent({ id }: { id: string }) {
  const [saved, setSaved] = useState<string | null>(null)

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved("Changes saved for this session.")
  }

  if (id === "account") return <AccountTab />
  if (id === "company") return <CompanyTab />

  if (id === "notifications") {
    const rows = ["Fatigue alerts", "Late arrivals", "Device disconnections", "Weekly summary"]
    return (
      <SectionCard title="Notifications" description="Choose what you'd like to be notified about.">
        <div className="max-w-lg divide-y divide-slate-100">
          {rows.map((r) => (
            <label key={r} className="flex items-center justify-between py-3 text-sm text-slate-700">
              {r}
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
            </label>
          ))}
        </div>
      </SectionCard>
    )
  }

  if (id === "security") {
    return (
      <SectionCard title="Security" description="Keep your account secure.">
        <form onSubmit={save} className="max-w-lg space-y-4">
          <Field label="Current password">
            <Input type="password" placeholder="••••••••" />
          </Field>
          <Field label="New password">
            <Input type="password" placeholder="••••••••" />
          </Field>
          <Button type="submit">Update password</Button>
        </form>
        <Toast message={saved} onDismiss={() => setSaved(null)} />
      </SectionCard>
    )
  }

  // Fallback for configuration-only tabs
  return (
    <SectionCard>
      <EmptyState
        icon={SlidersHorizontal}
        title="Nothing configured yet."
        description="This section will be available once your workspace has data to manage."
      />
    </SectionCard>
  )
}

export function SettingsScreen({ tabs }: { tabs: SettingsTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id)

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border border-slate-200 bg-white p-2">
        <nav className="space-y-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                active === t.id ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <div>{active && <TabContent id={active} />}</div>
    </div>
  )
}
