"use client"

import { useEffect, useRef, useState } from "react"
import { UserRound, Upload, X } from "lucide-react"
import { Modal } from "./modal"
import { Button, Input, Select, Field } from "./controls"
import { createEmployee, listSites, uploadEmployeePhoto, type Site } from "@/lib/supabase/db"

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
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [errors, setErrors] = useState<{ name?: string; email?: string; form?: string }>({})
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) listSites().then(setSites).catch(() => setSites([]))
  }, [open])

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("")
      return
    }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  function reset() {
    setName("")
    setEmail("")
    setRole("employee")
    setSite("")
    setPhoto(null)
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
      const photo_url = photo ? await uploadEmployeePhoto(photo) : null
      await createEmployee({ full_name: name.trim(), email: email.trim(), invited_role: role, site_id: site || null, photo_url })
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
        <Field label="Photo" hint="Shown on their live watch profile. JPG or PNG, up to 3MB.">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-7 w-7 text-slate-300" />
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" /> {photo ? "Change" : "Upload"}
            </Button>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
        </Field>
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
