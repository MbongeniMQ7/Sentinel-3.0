"use client"

// Edit an existing employee's details (managers/owners), including their photo.
import { useEffect, useRef, useState } from "react"
import { UserRound, Upload, X } from "lucide-react"
import { Modal } from "./modal"
import { Button, Input, Field } from "./controls"
import { Select } from "./controls"
import { listSites, updateEmployee, uploadEmployeePhoto, type EmployeeRow, type Site } from "@/lib/supabase/db"

export function EditEmployeeModal({
  employee,
  open,
  onClose,
  onSaved,
}: {
  employee: EmployeeRow | null
  open: boolean
  onClose: () => void
  onSaved?: () => void
}) {
  const [name, setName] = useState("")
  const [roleTitle, setRoleTitle] = useState("")
  const [site, setSite] = useState("")
  const [sites, setSites] = useState<Site[]>([])
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [removePhoto, setRemovePhoto] = useState(false)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) listSites().then(setSites).catch(() => setSites([]))
  }, [open])

  useEffect(() => {
    if (employee && open) {
      setName(employee.full_name ?? "")
      setRoleTitle(employee.role_title ?? "")
      setSite(employee.site_id ?? "")
      setPhoto(null)
      setRemovePhoto(false)
      setError("")
    }
  }, [employee, open])

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("")
      return
    }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const currentPhoto = removePhoto ? "" : photoPreview || employee?.photo_url || ""

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!employee) return
    if (!name.trim()) {
      setError("Full name is required")
      return
    }
    setSaving(true)
    try {
      let photo_url: string | null | undefined
      if (photo) photo_url = await uploadEmployeePhoto(photo)
      else if (removePhoto) photo_url = null
      await updateEmployee(employee.id, {
        full_name: name.trim(),
        role_title: roleTitle.trim() || null,
        site_id: site || null,
        ...(photo_url !== undefined ? { photo_url } : {}),
      })
      onClose()
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Employee"
      description="Update details and profile photo. Changes appear across the workspace."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-employee-form" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="edit-employee-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Photo" hint="Shown on their live watch profile. JPG or PNG, up to 3MB.">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
              {currentPhoto ? (
                <img src={currentPhoto} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-7 w-7 text-slate-300" />
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                setPhoto(e.target.files?.[0] ?? null)
                setRemovePhoto(false)
              }}
            />
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" /> {currentPhoto ? "Change" : "Upload"}
            </Button>
            {currentPhoto && (
              <button
                type="button"
                onClick={() => {
                  setPhoto(null)
                  setRemovePhoto(true)
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
        </Field>
        <Field label="Full name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Smith" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role title">
            <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g. Site Supervisor" />
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
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    </Modal>
  )
}
