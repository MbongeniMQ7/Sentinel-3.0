"use client"

import { useEffect, useState } from "react"
import { Modal } from "./modal"
import { Button, Input, Select, Field } from "./controls"
import { createEmployee, listSites, type Site } from "@/lib/supabase/db"

export function AddEmployeeModal({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"employee" | "manager">("employee")
  const [site, setSite] = useState("")
  const [sites, setSites] = useState<Site[]>([])
  const [errors, setErrors] = useState<{ name?: string; email?: string; form?: string }>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) listSites().then(setSites).catch(() => setSites([]))
  }, [open])

  function reset() {
    setName("")
    setEmail("")
    setRole("employee")
    setSite("")
    setErrors({})
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = "Full name is required"
    if (!email.trim()) next.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email"
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setSaving(true)
    try {
      await createEmployee({ full_name: name.trim(), email: email.trim(), invited_role: role, site_id: site || null })
      reset()
      onClose()
      onSubmitted?.()
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Could not add employee." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Add Employee"
      description="They'll be able to sign in with this email and are linked automatically on first login."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-employee-form" disabled={saving}>
            {saving ? "Adding…" : "Add Employee"}
          </Button>
        </>
      }
    >
      <form id="add-employee-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" required error={errors.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Smith" />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value as "employee" | "manager")}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </Select>
          </Field>
          <Field label="Site" hint={sites.length ? undefined : "No sites created yet"}>
            <Select value={site} onChange={(e) => setSite(e.target.value)}>
              <option value="">Unassigned</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {errors.form && <p className="text-xs text-red-500">{errors.form}</p>}
      </form>
    </Modal>
  )
}
