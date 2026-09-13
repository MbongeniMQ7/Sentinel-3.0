"use client"

import { useParams } from "next/navigation"
import { EmployeeDetail } from "@/components/app/employee-detail"

export default function OwnerEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <EmployeeDetail employeeId={id} backHref="/owner/employees" />
}
