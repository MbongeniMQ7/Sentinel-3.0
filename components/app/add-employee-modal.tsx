"use client"

import { useState } from "react"
import { Modal } from "./modal"
import { Button, Input, Select, Field } from "./controls"

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
  const [role, setRole] = useState("Employee")
  const [site, setSite] = useState("")
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  function reset() {
    setName("")
    setEmail("")
    setRole("Employee")
    setSite("")
    setErrors({})
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = "Full name is required"
    if (!email.trim()) next.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email"
    setErrors(next)
    if (Object.keys(next).length > 0) return
    // Frontend-only: no data is sent anywhere.
    reset()
    onClose()
    onSubmitted?.()
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Add Employee"
      description="Enter the employee's details. This is a frontend demonstration — nothing is saved."
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
          <Button type="submit" form="add-employee-form">
            Add Employee
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
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Employee</option>
              <option>Manager</option>
            </Select>
          </Field>
          <Field label="Site" hint="No sites created yet">
            <Select value={site} onChange={(e) => setSite(e.target.value)}>
              <option value="">Unassigned</option>
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  )
}
