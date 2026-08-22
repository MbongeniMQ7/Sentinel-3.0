"use client"

import { useState } from "react"
import { Modal } from "./modal"
import { Button, Input, Select, Field } from "./controls"
import { createSite } from "@/lib/supabase/db"

export function CreateSiteModal({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
}) {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [timezone, setTimezone] = useState("Africa/Johannesburg")
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  function reset() {
    setName("")
    setLocation("")
    setTimezone("Africa/Johannesburg")
    setError(undefined)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError("Site name is required")
    setSaving(true)
    try {
      await createSite({ name: name.trim(), location: location.trim() || undefined, timezone })
      reset()
      onClose()
      onSubmitted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create site.")
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
      title="Create Site"
      description="Add an operating location for your organization."
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
          <Button type="submit" form="create-site-form" disabled={saving}>
            {saving ? "Creating…" : "Create Site"}
          </Button>
        </>
      }
    >
      <form id="create-site-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Site name" required error={error}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Central Warehouse" />
        </Field>
        <Field label="Location">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, region" />
        </Field>
        <Field label="Timezone">
          <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <option>Africa/Johannesburg</option>
            <option>Africa/Lagos</option>
            <option>Europe/London</option>
            <option>America/New_York</option>
            <option>Asia/Dubai</option>
          </Select>
        </Field>
      </form>
    </Modal>
  )
}
