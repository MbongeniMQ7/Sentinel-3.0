"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ROLE_META } from "@/components/app/nav-config"
import { supabase } from "./client"
import { bootstrapSession, signOut as _signOut, type Profile } from "./db"

export function useAuth() {
  const router = useRouter()
  const pathname = usePathname()
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
        const workspace = pathname.split("/")[1]
        if (workspace !== p.role) {
          router.replace(ROLE_META[p.role].home)
          return
        }
        setProfile(p)
        setLoading(false)
      })
      .catch(() => {
        if (active) router.replace("/login")
      })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null)
        setLoading(true)
        router.replace("/login")
      }
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [router, pathname])

  async function signOut() {
    await _signOut()
    router.replace("/login")
  }

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || ""
  const initial = (profile?.first_name || profile?.email || "?").charAt(0).toUpperCase()

  return { profile, loading, signOut, displayName, initial }
}
