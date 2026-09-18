"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { getProfile } from "@/lib/supabase/db"

export function SampleDataNotice({ personal = false }: { personal?: boolean }) {
  const [present, setPresent] = useState(false)
  useEffect(() => {
    let active = true
    void getProfile().then(async profile => {
      if (!profile?.organization_id) return
      let query = supabase.from("attendance_records").select("id, employees!inner(user_id)", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id).eq("is_sample", true)
      if (personal || profile.role === "employee") query = query.eq("employees.user_id", profile.id)
      const { count } = await query
      if (active) setPresent((count || 0) > 0)
    }).catch(() => {})
    return () => { active = false }
  }, [personal])
  return present ? <p className="mb-4 border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-900">{personal ? "Your history includes" : "This workspace includes"} sample workforce records. Hours, estimates and historical fatigue charts may contain demonstration data.</p> : null
}