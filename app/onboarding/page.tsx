"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ArrowLeft, ArrowRight, Rocket, Building2, MapPin, UserCog, Users, CalendarClock, Watch, PartyPopper } from "lucide-react"
import { Button, Input, Select, Field } from "@/components/app/controls"
import { cn } from "@/lib/utils"
import { saveOnboarding } from "@/lib/supabase/db"

const STEPS = [
  { id: "welcome", label: "Welcome", icon: Rocket },
  { id: "company", label: "Company", icon: Building2 },
  { id: "site", label: "Site", icon: MapPin },
  { id: "managers", label: "Managers", icon: UserCog },
  { id: "employees", label: "Employees", icon: Users },
  { id: "shifts", label: "Shifts", icon: CalendarClock },
  { id: "devices", label: "Devices", icon: Watch },
  { id: "complete", label: "Complete", icon: PartyPopper },
] as const

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [companyName, setCompanyName] = useState("")
  const [industry, setIndustry] = useState("")
  const [country, setCountry] = useState("South Africa")
  const [siteName, setSiteName] = useState("")
  const [siteLocation, setSiteLocation] = useState("")
  const [siteTimezone, setSiteTimezone] = useState("Africa/Johannesburg")
  const [managerName, setManagerName] = useState("")
  const [managerEmail, setManagerEmail] = useState("")
  const [employeeName, setEmployeeName] = useState("")
  const [employeeEmail, setEmployeeEmail] = useState("")
  const [employeeRole, setEmployeeRole] = useState("")
  const [shiftName, setShiftName] = useState("")
  const [shiftStart, setShiftStart] = useState("")
  const [shiftEnd, setShiftEnd] = useState("")
  const [deviceId, setDeviceId] = useState("")

  const current = STEPS[step]
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1

  async function finish() {
    setSaving(true)
    setError(null)
    try {
      await saveOnboarding({
        company: { name: companyName.trim() || "My Company", industry: industry || undefined, country: country || undefined },
        site: { name: siteName.trim(), location: siteLocation || undefined, timezone: siteTimezone },
        managers: managerName.trim() && managerEmail.trim() ? [{ name: managerName.trim(), email: managerEmail.trim() }] : [],
        employees:
          employeeName.trim() && employeeEmail.trim()
            ? [{ name: employeeName.trim(), email: employeeEmail.trim(), role_title: employeeRole || undefined }]
            : [],
        shifts: shiftName.trim() && shiftStart && shiftEnd ? [{ name: shiftName.trim(), start_time: shiftStart, end_time: shiftEnd }] : [],
        device: deviceId.trim() ? { device_id: deviceId.trim() } : undefined,
      })
      router.push("/owner/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your workspace.")
      setSaving(false)
    }
  }

  function next() {
    if (isLast) {
      finish()
    } else {
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col px-4 py-10 sm:py-16">
        <header className="mb-8">
          <span className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Sentinel-AI" className="h-7 w-7 object-contain" />
            <span className="text-sm font-semibold uppercase tracking-widest text-[#0f2a4a]">Sentinel-AI</span>
          </span>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Set up your workspace</h1>
          <p className="mt-1 text-sm text-slate-500">A few steps to get your workforce ready.</p>
        </header>

        {/* Stepper */}
        <ol className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const done = i < step
            const active = i === step
            return (
              <li key={s.id} className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                    done && "border-[#0f2a4a] bg-[#0f2a4a] text-white",
                    active && "border-[#0f2a4a] text-[#0f2a4a]",
                    !done && !active && "border-slate-200 text-slate-400",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                {i < STEPS.length - 1 && <span className="h-px w-6 bg-slate-200" />}
              </li>
            )
          })}
        </ol>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <current.icon className="h-5 w-5 text-[#0f2a4a]" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{current.label}</h2>
          </div>

          {current.id === "welcome" && (
            <p className="text-sm leading-relaxed text-slate-600">
              Welcome to SentinelAI Workforce. We'll help you set up your company, add your team, configure shifts and
              connect wristbands so you can see your workforce clearly. You can skip any step and complete it later.
            </p>
          )}

          {current.id === "company" && (
            <div className="grid gap-4">
              <Field label="Company name" required>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company" />
              </Field>
              <Field label="Industry">
                <Select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="">Select an industry</option>
                  <option value="mining">Mining</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="logistics">Logistics</option>
                  <option value="construction">Construction</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Country">
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
              </Field>
            </div>
          )}

          {current.id === "site" && (
            <div className="grid gap-4">
              <Field label="Site name" required>
                <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="e.g. Head Office" />
              </Field>
              <Field label="Location">
                <Input value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} placeholder="City / address" />
              </Field>
              <Field label="Timezone">
                <Select value={siteTimezone} onChange={(e) => setSiteTimezone(e.target.value)}>
                  <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                </Select>
              </Field>
            </div>
          )}

          {current.id === "managers" && (
            <div className="grid gap-4">
              <p className="text-sm text-slate-500">Invite a manager to help run a site. You can add more later.</p>
              <Field label="Manager name">
                <Input value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Full name" />
              </Field>
              <Field label="Email">
                <Input type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} placeholder="manager@company.com" />
              </Field>
            </div>
          )}

          {current.id === "employees" && (
            <div className="grid gap-4">
              <p className="text-sm text-slate-500">Add your first employee, or bulk import later from the dashboard.</p>
              <Field label="Employee name">
                <Input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Full name" />
              </Field>
              <Field label="Email">
                <Input type="email" value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)} placeholder="employee@company.com" />
              </Field>
              <Field label="Role">
                <Input value={employeeRole} onChange={(e) => setEmployeeRole(e.target.value)} placeholder="e.g. Operator" />
              </Field>
            </div>
          )}

          {current.id === "shifts" && (
            <div className="grid gap-4">
              <Field label="Shift name">
                <Input value={shiftName} onChange={(e) => setShiftName(e.target.value)} placeholder="e.g. Day Shift" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start time">
                  <Input type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} />
                </Field>
                <Field label="End time">
                  <Input type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {current.id === "devices" && (
            <div className="grid gap-4">
              <p className="text-sm text-slate-500">Register a wristband to capture biometric signals. You can skip this for now.</p>
              <Field label="Device ID">
                <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="e.g. band-0001" />
              </Field>
            </div>
          )}

          {current.id === "complete" && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-slate-900">You're all set</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Your workspace is ready. Head to your dashboard to start monitoring your workforce.
              </p>
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            </div>
          )}
        </section>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={isFirst || saving}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            {!isLast && !isFirst && (
              <Button variant="secondary" onClick={next}>
                Skip
              </Button>
            )}
            <Button onClick={next} disabled={saving}>
              {isLast ? (saving ? "Saving…" : "Go to Dashboard") : "Continue"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
