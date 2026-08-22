"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionCard, EmptyState } from "./primitives"
import { Button, Input, Field, Select } from "./controls"
import { Toast } from "./toast"

export type SettingsTab = { id: string; label: string }

function TabContent({ id }: { id: string }) {
  const [saved, setSaved] = useState<string | null>(null)

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved("Changes saved for this session.")
  }

  if (id === "account") {
    return (
      <SectionCard title="Account" description="Your personal profile details.">
        <form onSubmit={save} className="max-w-lg space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input placeholder="Your first name" />
            </Field>
            <Field label="Last name">
              <Input placeholder="Your last name" />
            </Field>
          </div>
          <Field label="Email">
            <Input type="email" placeholder="you@company.com" />
          </Field>
          <Field label="Language">
            <Select defaultValue="English">
              <option>English</option>
            </Select>
          </Field>
          <Button type="submit">Save changes</Button>
        </form>
        <Toast message={saved} onDismiss={() => setSaved(null)} />
      </SectionCard>
    )
  }

  if (id === "company") {
    return (
      <SectionCard title="Company" description="Organisation details shown across the platform.">
        <form onSubmit={save} className="max-w-lg space-y-4">
          <Field label="Company name">
            <Input placeholder="Your company" />
          </Field>
          <Field label="Currency" hint="Used for estimated earnings">
            <Select defaultValue="ZAR (R)">
              <option>ZAR (R)</option>
              <option>USD ($)</option>
              <option>GBP (£)</option>
              <option>EUR (€)</option>
            </Select>
          </Field>
          <Button type="submit">Save changes</Button>
        </form>
        <Toast message={saved} onDismiss={() => setSaved(null)} />
      </SectionCard>
    )
  }

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
