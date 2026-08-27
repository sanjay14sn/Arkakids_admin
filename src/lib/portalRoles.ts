import type { UserRole } from "@/store/useStore"

export type PortalId = "super_admin" | "franchise_owner" | "coordinator" | "student"

export const BRAND_NAME = "ARKA KIDS"
export const BRAND_TAGLINE = "Preschool Management"

export function getPortal(role?: UserRole | null): PortalId {
  if (role === "super_admin") return "super_admin"
  if (role === "owner") return "franchise_owner"
  if (role === "trainer" || role === "bde") return "coordinator"
  return "student"
}

export function isCoordinator(role?: UserRole | null): boolean {
  return role === "trainer" || role === "bde"
}

export function isFranchiseOwner(role?: UserRole | null): boolean {
  return role === "owner"
}

export function isSuperAdmin(role?: UserRole | null): boolean {
  return role === "super_admin"
}

export function portalLabel(role?: UserRole | null): string {
  switch (getPortal(role)) {
    case "super_admin":
      return "Super Admin"
    case "franchise_owner":
      return "Franchise Owner"
    case "coordinator":
      return "Coordinator"
    default:
      return "Parent"
  }
}

/** User-facing preschool glossary (JWT/API values stay unchanged). */
export const GLOSSARY = {
  brand: BRAND_NAME,
  center: "Branch",
  centers: "Branches",
  lead: "Enquiry",
  leads: "Enquiries",
  trainer: "Coordinator",
  trainers: "Coordinators",
  bde: "Coordinator",
  course: "Class",
  courses: "Classes",
  batch: "Class",
  batches: "Classes",
  institute: "Branch",
} as const

export const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  crm: "Enquiries",
  followups: "Follow-ups",
  admissions: "Admissions",
  students: "Students",
  trainers: "Coordinators",
  courses: "Classes",
  attendance: "Attendance",
  fees: "Fees & Payments",
  journal: "Daily Journal",
  homework: "Homework",
  absences: "Child Leave",
  progress: "Assessments",
  calendar: "Calendar",
  "child-documents": "Child Documents",
  transfers: "Transfers",
  campaigns: "Announcements",
  reports: "Reports",
  analytics: "Analytics",
  centers: "Branches",
  roles: "Users & Roles",
  settings: "Settings",
  storage: "Storage",
  support: "Support",
  profile: "Profile",
  messages: "Messages",
  "parent-communication": "Parent Communication",
  feedback: "Feedback",
  gallery: "Gallery",
  apply: "Admission",
  enquiry: "Enquiry",
  lms: "Homework",
  assignments: "Homework",
  hr: "HR",
  bde: "Coordinators",
}

export function breadcrumbLabel(segment: string): string {
  return ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
}
