import { AppShell } from "@/components/app/app-shell"
import { MANAGER_NAV } from "@/components/app/nav-config"

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="manager" nav={MANAGER_NAV}>
      {children}
    </AppShell>
  )
}
