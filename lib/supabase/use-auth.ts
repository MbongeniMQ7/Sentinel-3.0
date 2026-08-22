"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { bootstrapSession, signOut as _signOut, type Profile } from "./db"

export function useAuth() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    bootstrapSession()
      .then((p) => {
        if (!active) return
        if (!p) {
          router.replace("/login")
          return
        }
        setProfile(p)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [router])

  async function signOut() {
    await _signOut()
    router.replace("/login")
  }

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || ""
  const initial = (profile?.first_name || profile?.email || "?").charAt(0).toUpperCase()

  return { profile, loading, signOut, displayName, initial }
}
