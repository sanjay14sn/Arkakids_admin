import type { User, UserRole } from "@/store/useStore"

export const PREVIEW_TOKEN = "preview-local"
export const PREVIEW_ROLE_KEY = "preview_role"

const PREVIEW_USERS: Record<UserRole, User> = {
  super_admin: {
    id: "preview-super-admin",
    name: "Head Office",
    email: "admin@arkakids.local",
    role: "super_admin",
  },
  owner: {
    id: "preview-owner",
    name: "Franchise Owner",
    email: "owner@arkakids.local",
    role: "owner",
    tenantId: "ARKA KIDS",
  },
  trainer: {
    id: "preview-coordinator",
    name: "Classroom Coordinator",
    email: "coordinator@arkakids.local",
    role: "trainer",
    tenantId: "ARKA KIDS",
  },
  bde: {
    id: "preview-enquiry",
    name: "Enquiry Coordinator",
    email: "enquiry@arkakids.local",
    role: "bde",
    tenantId: "ARKA KIDS",
  },
  student: {
    id: "preview-student",
    name: "Neha Sharma",
    email: "parent@arkakids.local",
    role: "student",
    tenantId: "ARKA KIDS",
  },
}

export const PREVIEW_OTP = "123456"

export function isPreviewSession() {
  if (typeof window === "undefined") return false
  return (
    localStorage.getItem("token") === PREVIEW_TOKEN ||
    Boolean(localStorage.getItem(PREVIEW_ROLE_KEY))
  )
}

export function getPreviewUser(role?: UserRole | null, email?: string): User {
  const resolved = role && PREVIEW_USERS[role] ? role : "owner"
  const base = PREVIEW_USERS[resolved]
  if (email?.trim()) return { ...base, email: email.trim() }
  return base
}

export function startPreviewSession(role: UserRole, email?: string) {
  if (typeof window === "undefined") return getPreviewUser(role, email)
  localStorage.setItem("token", PREVIEW_TOKEN)
  localStorage.setItem(PREVIEW_ROLE_KEY, role)
  return getPreviewUser(role, email)
}

export function readPreviewUser(): User | null {
  if (!isPreviewSession()) return null
  const role = (localStorage.getItem(PREVIEW_ROLE_KEY) || "owner") as UserRole
  return getPreviewUser(role)
}

export function clearPreviewSession() {
  if (typeof window === "undefined") return
  if (localStorage.getItem("token") === PREVIEW_TOKEN) {
    localStorage.removeItem("token")
  }
  localStorage.removeItem(PREVIEW_ROLE_KEY)
}

const PREVIEW_LIST_PATHS = new Set([
  "/bde/leads",
  "/bde/tasks",
  "/bde/followups",
  "/conversions/requests",
  "/jobs",
  "/jobs/applications",
  "/batches",
  "/students",
  "/students/mine",
  "/centers",
  "/admin/bdes",
  "/trainers",
  "/courses",
  "/notifications",
  "/notices",
  "/roles",
  "/support/tickets",
  "/support/announcements",
  "/campaigns",
  "/campaigns/templates",
  "/fees/reminders/targets",
  "/fees/reminders/calls",
  "/fees/reminders/emails",
  "/session-feedback/pending",
  "/session-feedback/me",
  "/hr/employees",
  "/hr/holidays",
  "/hr/leave/balances",
  "/hr/leave/requests",
  "/hr/salary-structures",
  "/hr/claims",
  "/hr/documents",
  "/lead-integrations",
])

/** Empty payloads so preview screens render without calling the API or throwing. */
export function previewApiResponse(endpoint: string, options: RequestInit = {}) {
  const method = String(options.method || "GET").toUpperCase()
  const path = endpoint.split("?")[0]

  if (method === "DELETE") return { ok: true }
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    let body: Record<string, unknown> = {}
    if (typeof options.body === "string") {
      try {
        body = JSON.parse(options.body) as Record<string, unknown>
      } catch {
        body = {}
      }
    }
    return { id: `preview-${Date.now()}`, ok: true, ...body }
  }

  if (path === "/dashboard/metrics") {
    return {
      metrics: {},
      centersList: [],
      revenueTrends: [],
      leadPipelineConversion: [],
      recentTenants: [],
      enrollmentData: [],
      statusBreakdown: [],
      profile: {},
      schedules: [],
      watchlist: [],
      myLeads: [],
      myTasks: [],
      followUps: [],
      targets: {},
      recovery: { totalRecovery: 0, totalFeeTarget: 0, totalOutstanding: 0 },
      attendance: null,
    }
  }

  if (path.startsWith("/support/tickets/queue-count")) {
    return { open: 0, inProgress: 0, pending: 0 }
  }

  if (path === "/students/profile/me") {
    return {
      id: "child-aanya",
      name: "Aanya Sharma",
      email: "parent@arkakids.local",
      course: "Nursery",
      status: "active",
      feesTotal: 28000,
      feesPaid: 20000,
    }
  }

  if (path.startsWith("/centers/policy")) {
    return { tenantId: "ARKA KIDS", centerName: "ARKA KIDS" }
  }

  if (path === "/campaigns/stats") {
    return { totalCampaigns: 0, totalReached: 0, avgOpenRate: 0, scheduled: 0 }
  }

  if (path === "/campaigns/audience-estimate") {
    return { count: 0, audience: "all_leads" }
  }

  if (PREVIEW_LIST_PATHS.has(path)) return []
  return {}
}
