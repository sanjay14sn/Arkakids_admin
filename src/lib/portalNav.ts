import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
  GitPullRequest,
  MessageSquare,
  Building2,
  Megaphone,
  Wallet,
  UserCircle,
  UserCog,
  ClipboardList,
  Settings,
  Phone,
  CalendarDays,
  Camera,
  CalendarOff,
  ClipboardCheck,
  FolderOpen,
  ArrowLeftRight,
  Images,
  Star,
  Send,
  HeartPulse,
  ShieldCheck,
} from "lucide-react"
import type { UserRole } from "@/store/useStore"
import type { CenterFeatureKey } from "@/lib/centerPolicyClient"
import { getPortal } from "@/lib/portalRoles"
import { normalizePermissions, type RolePermissions } from "@/lib/rolePermissions"

export type PortalNavSubLink = {
  label: string
  path: string
  icon?: LucideIcon
}

export type PortalNavLink = {
  label: string
  path: string
  icon: LucideIcon
  badgeCount?: number
  subLinks?: PortalNavSubLink[]
}

export function getPortalNavLinks(opts: {
  role?: UserRole | null
  policyOk: (feature: CenterFeatureKey) => boolean
  permissions?: RolePermissions | null
  supportQueueCount?: number
  pendingLeavesCount?: number
}): PortalNavLink[] {
  const portal = getPortal(opts.role)
  const { policyOk, supportQueueCount, pendingLeavesCount, permissions } = opts
  const normPermissions = permissions ? normalizePermissions(permissions) : null

  const PATH_TO_FEATURE: Record<string, string> = {
    "/dashboard": "dashboard",
    "/crm": "crm",
    "/students": "students",
    "/staff": "staff",
    "/staff?section=coordinators": "coordinators",
    "/staff?section=teachers": "teachers",
    "/courses": "courses",
    "/attendance": "attendance",
    "/journal": "journal",
    "/homework": "homework",
    "/absences": "absences",
    "/childcare": "childcare",
    "/calendar": "calendar",
    "/child-documents": "childdocuments",
    "/transfers": "transfers",
    "/fees": "fees",
    "/admin-users": "coordinators",
    "/panel-associates": "coordinators",
    "/roles": "coordinators",
    "/campaigns": "campaigns",
    "/parent-communication": "campaigns",
    "/messages": "campaigns",
    "/support": "support",
    "/hr": "hr",
    "/hr/me": "hr",
  }

  const isAllowed = (path: string): boolean => {
    if (opts.role === "super_admin" || opts.role === "owner") return true
    if (!normPermissions) return true
    const fKey = PATH_TO_FEATURE[path]
    if (!fKey) return true
    const p = normPermissions[fKey]
    if (!p) return true
    return Boolean(p.view)
  }

  const filterLinks = (list: PortalNavLink[]): PortalNavLink[] => {
    return list
      .filter((link) => isAllowed(link.path))
      .map((link) => {
        if (link.subLinks) {
          const subFiltered = link.subLinks.filter((sub) => isAllowed(sub.path))
          return { ...link, subLinks: subFiltered }
        }
        return link
      })
  }

  if (portal === "super_admin") {
    return filterLinks([
      { label: "Control Center", path: "/dashboard", icon: LayoutDashboard },
      { label: "Branches", path: "/centers", icon: Building2 },

      { label: "Enquiries", path: "/crm", icon: GitPullRequest },
      { label: "Students", path: "/students", icon: Users },
      { label: "Class Program", path: "/courses", icon: BookOpen },
      { label: "All Center Coordinators", path: "/staff?section=coordinators", icon: UserCircle },
      { label: "All Teachers & Educators", path: "/staff?section=teachers", icon: GraduationCap },
      { label: "Fees & Payments", path: "/fees", icon: CreditCard },
      { label: "Child Documents", path: "/child-documents", icon: FolderOpen },
      { label: "Transfers", path: "/transfers", icon: ArrowLeftRight },
      { label: "Announcements", path: "/campaigns", icon: Megaphone },
      { label: "Settings", path: "/settings", icon: Settings },
      {
        label: "Support",
        path: "/support",
        icon: MessageSquare,
        badgeCount: supportQueueCount,
      },
    ])
  }

  if (portal === "coordinator") {
    const classroom: PortalNavLink[] = [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Students", path: "/students", icon: Users },
      { label: "Class Program", path: "/courses", icon: BookOpen },
      { label: "Attendance", path: "/attendance", icon: CalendarCheck },
      { label: "Daily Journal", path: "/journal", icon: Camera },
      { label: "Child Leave", path: "/absences", icon: CalendarOff, badgeCount: pendingLeavesCount },
      { label: "Child Care", path: "/childcare", icon: HeartPulse },
      { label: "Calendar", path: "/calendar", icon: CalendarDays },
      { label: "Child Documents", path: "/child-documents", icon: FolderOpen },
      { label: "Homework", path: "/homework", icon: ClipboardList },
      { label: "Messages", path: "/messages", icon: Send },
      { label: "Communication", path: "/support", icon: MessageSquare },
      ...(policyOk("enableHrModule")
        ? [{ label: "Staff Payroll & HR", path: "/hr/me", icon: Wallet }]
        : []),
    ]

    if (opts.role === "bde") {
      return filterLinks([
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Enquiries", path: "/crm", icon: GitPullRequest },
        { label: "Follow-ups", path: "/followups", icon: Phone },
        ...classroom.filter((link) => link.path !== "/dashboard"),
      ])
    }

    return filterLinks(classroom)
  }

  if (portal === "student") {
    return filterLinks([
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Daily Journal", path: "/journal", icon: Camera },
      { label: "Homework", path: "/homework", icon: ClipboardList },
      { label: "Attendance", path: "/attendance", icon: CalendarCheck },
      { label: "Leave", path: "/absences", icon: CalendarOff },
      { label: "Calendar", path: "/calendar", icon: CalendarDays },
      { label: "Gallery", path: "/gallery", icon: Images },
      { label: "Child Care", path: "/childcare", icon: HeartPulse },
      { label: "Documents", path: "/child-documents", icon: FolderOpen },
      { label: "My Fees", path: "/fees", icon: CreditCard },
      { label: "Messages", path: "/messages", icon: Send },
      { label: "Feedback", path: "/feedback", icon: Star },
    ])
  }

  return filterLinks([
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Enquiries", path: "/crm", icon: GitPullRequest },
    { label: "Students", path: "/students", icon: Users },

    { label: "Center Coordinators", path: "/staff?section=coordinators", icon: UserCircle },
    { label: "Teachers & Educators", path: "/staff?section=teachers", icon: GraduationCap },
    { label: "Class Program", path: "/courses", icon: BookOpen },
    { label: "Attendance", path: "/attendance", icon: CalendarCheck },
    { label: "Daily Journal", path: "/journal", icon: Camera },
    { label: "Homework", path: "/homework", icon: ClipboardList },
    { label: "Child Leave", path: "/absences", icon: CalendarOff, badgeCount: pendingLeavesCount },
    { label: "Child Care", path: "/childcare", icon: HeartPulse },
    { label: "Calendar", path: "/calendar", icon: CalendarDays },
    { label: "Child Documents", path: "/child-documents", icon: FolderOpen },
    { label: "Transfers", path: "/transfers", icon: ArrowLeftRight },
    { label: "Fees & Payments", path: "/fees", icon: CreditCard },
    { label: "Parent Communication", path: "/parent-communication", icon: Megaphone },
    ...(policyOk("enableHrModule")
      ? [{ label: "Staff Payroll & HR", path: "/hr", icon: Wallet }]
      : []),
    { label: "Support", path: "/support", icon: MessageSquare },
  ])
}
