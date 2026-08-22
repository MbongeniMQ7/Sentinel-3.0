import { SettingsScreen } from "@/components/app/settings-screen"

export default function ManagerSettingsPage() {
  return (
    <SettingsScreen
      tabs={[
        { id: "account", label: "Account" },
        { id: "notifications", label: "Notifications" },
        { id: "security", label: "Security" },
      ]}
    />
  )
}
