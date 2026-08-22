import { AppShell } from "@/components/app/app-shell"
import { OWNER_NAV } from "@/components/app/nav-config"

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="owner" nav={OWNER_NAV}>
      {children}
    </AppShell>
  )
}
