export type PermissionAction = "view" | "add" | "edit" | "delete"

export type FeaturePermission = Record<PermissionAction, boolean>

export type RolePermissions = Record<string, FeaturePermission>

export const PLATFORM_FEATURES = [
  { key: "dashboard", label: "Dashboard", group: "Core" },
  { key: "crm", label: "Enquiries", group: "Sales" },
  { key: "students", label: "Students", group: "Academic" },
  { key: "staff", label: "Staff Management", group: "Staff" },
  { key: "coordinators", label: "Center Coordinators", group: "Staff" },
  { key: "teachers", label: "Teachers & Educators", group: "Staff" },
  { key: "courses", label: "Class Program", group: "Academic" },
  { key: "attendance", label: "Attendance", group: "Academic" },
  { key: "journal", label: "Daily Journal", group: "Classroom" },
  { key: "homework", label: "Homework", group: "Classroom" },
  { key: "absences", label: "Child Leave", group: "Classroom" },
  { key: "childcare", label: "Child Care", group: "Classroom" },
  { key: "calendar", label: "Calendar", group: "Classroom" },
  { key: "childdocuments", label: "Child Documents", group: "Classroom" },
  { key: "transfers", label: "Transfers", group: "Academic" },
  { key: "fees", label: "Fees & Payments", group: "Finance" },
  { key: "notices", label: "School Notices", group: "Communication" },
  { key: "campaigns", label: "Parent Communication", group: "Communication" },
  { key: "support", label: "Support", group: "Operations" },
] as const

export type FeatureKey = (typeof PLATFORM_FEATURES)[number]["key"]

export function instituteRoleFeatures() {
  return PLATFORM_FEATURES
}

export const INSTITUTE_FEATURE_GROUPS = Array.from(
  new Set(instituteRoleFeatures().map((f) => f.group))
)

export const PERMISSION_ACTIONS: PermissionAction[] = ["view", "add", "edit", "delete"]

export interface AppRole {
  id: string
  name: string
  slug: string
  description: string
  isSystem: boolean
  baseRole: string | null
  tenantId?: string | null
  permissions: RolePermissions
}

export function emptyPermissions(): RolePermissions {
  const perms: RolePermissions = {}
  for (const feature of PLATFORM_FEATURES) {
    perms[feature.key] = { view: false, add: false, edit: false, delete: false }
  }
  return perms
}

export function fullPermissions(): RolePermissions {
  const perms: RolePermissions = {}
  for (const feature of PLATFORM_FEATURES) {
    perms[feature.key] = { view: true, add: true, edit: true, delete: true }
  }
  return perms
}

export function normalizePermissions(input?: RolePermissions | null): RolePermissions {
  const base = emptyPermissions()
  if (!input) return base
  for (const feature of PLATFORM_FEATURES) {
    const row = input[feature.key]
    if (row) {
      base[feature.key] = {
        view: Boolean(row.view),
        add: Boolean(row.add),
        edit: Boolean(row.edit),
        delete: Boolean(row.delete),
      }
    }
  }
  return base
}

export function setFeaturePermission(
  permissions: RolePermissions,
  featureKey: string,
  action: PermissionAction,
  value: boolean
): RolePermissions {
  const next = { ...permissions, [featureKey]: { ...permissions[featureKey] } }
  next[featureKey][action] = value
  if (action !== "view" && value) next[featureKey].view = true
  if (action === "view" && !value) {
    next[featureKey] = { view: false, add: false, edit: false, delete: false }
  }
  return next
}

export function setAllFeaturePermissions(
  permissions: RolePermissions,
  featureKey: string,
  value: boolean
): RolePermissions {
  return {
    ...permissions,
    [featureKey]: { view: value, add: value, edit: value, delete: value },
  }
}

export function setColumnPermissions(
  permissions: RolePermissions,
  action: PermissionAction,
  value: boolean,
  featureKeys = PLATFORM_FEATURES.map((f) => f.key)
): RolePermissions {
  const next = { ...permissions }
  for (const key of featureKeys) {
    next[key] = setFeaturePermission(next, key, action, value)[key]
  }
  return next
}

export const FEATURE_GROUPS = Array.from(new Set(PLATFORM_FEATURES.map((f) => f.group)))
