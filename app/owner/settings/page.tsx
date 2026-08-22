import { PageHeader } from "@/components/app/primitives"
import { SettingsScreen } from "@/components/app/settings-screen"

export default function OwnerSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your company, workforce rules and preferences." />
      <SettingsScreen
        tabs={[
          { id: "account", label: "Account" },
          { id: "company", label: "Company" },
          { id: "sites", label: "Sites" },
          { id: "users", label: "Users" },
          { id: "roles", label: "Roles" },
          { id: "payrates", label: "Pay Rates" },
          { id: "rules", label: "Workforce Rules" },
          { id: "notifications", label: "Notifications" },
          { id: "devices", label: "Devices" },
          { id: "integrations", label: "Integrations" },
          { id: "subscription", label: "Subscription" },
          { id: "security", label: "Security" },
        ]}
      />
    </>
  )
}
