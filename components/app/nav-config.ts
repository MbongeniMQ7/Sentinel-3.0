import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Clock,
  Wallet,
  Activity,
  ShieldAlert,
  BarChart3,
  Building2,
  Watch,
  FileText,
  Settings,
  ScrollText,
  Home,
  Bell,
  UserRound,
  Network,
  ClipboardList,
  Inbox,
} from "lucide-react"

export type Role = "owner" | "manager" | "employee"

export type NavItem = { label: string; href: string; icon: LucideIcon }
export type NavGroup = { label: string; items: NavItem[] }

export const OWNER_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Workforce",
    items: [
      { label: "Workforce", href: "/owner/workforce", icon: Network },
      { label: "Employees", href: "/owner/employees", icon: Users },
      { label: "Sites", href: "/owner/sites", icon: Building2 },
    ],
  },
  {
    label: "Intelligence",
    items: [{ label: "Analytics", href: "/owner/analytics", icon: BarChart3 }],
  },
  {
    label: "Growth",
    items: [{ label: "Applications", href: "/owner/applications", icon: Inbox }],
  },
  {
    label: "Operations",
    items: [{ label: "Reports", href: "/owner/reports", icon: FileText }],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/owner/settings", icon: Settings },
      { label: "Audit Logs", href: "/owner/audit", icon: ScrollText },
    ],
  },
]

export const MANAGER_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Workforce",
    items: [
      { label: "Employees", href: "/manager/employees", icon: Users },
      { label: "Attendance", href: "/manager/attendance", icon: ClipboardList },
      { label: "Working Hours", href: "/manager/hours", icon: Clock },
      { label: "Earnings", href: "/manager/earnings", icon: Wallet },
      { label: "Shifts", href: "/manager/shifts", icon: CalendarClock },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Fatigue Monitoring", href: "/manager/fatigue", icon: ShieldAlert },
      { label: "Activity Patterns", href: "/manager/activity", icon: Activity },
      { label: "Alerts", href: "/manager/alerts", icon: Bell },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Devices", href: "/manager/devices", icon: Watch },
      { label: "Reports", href: "/manager/reports", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/manager/settings", icon: Settings }],
  },
]

export const EMPLOYEE_NAV: NavItem[] = [
  { label: "Home", href: "/employee/home", icon: Home },
  { label: "Attendance", href: "/employee/attendance", icon: ClipboardList },
  { label: "Hours", href: "/employee/hours", icon: Clock },
  { label: "Alerts", href: "/employee/alerts", icon: Bell },
  { label: "Profile", href: "/employee/profile", icon: UserRound },
]

export const ROLE_META: Record<Role, { label: string; home: string }> = {
  owner: { label: "Owner", home: "/owner/dashboard" },
  manager: { label: "Manager", home: "/manager/dashboard" },
  employee: { label: "Employee", home: "/employee/home" },
}
