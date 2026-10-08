import { Homework } from "@/models/index"
import type { JwtPayload } from "@/lib/authMiddleware"
import { expandTenantIds, loadStudentForParent } from "@/lib/listSchoolNotices"
import { journalVisibleToClass } from "@/lib/listJournals"

function todayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function dateKey(value?: unknown) {
  const raw = String(value || "").slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : ""
}

function isVisibleToParent(item: any, today: string) {
  const due = dateKey(item.dueDate)
  if (due && due < today) return false
  if (item.visibility === "scheduled") {
    const from = dateKey(item.visibleFrom) || dateKey(item.assignedDate)
    if (from && from > today) return false
  }
  return true
}

function serializeHomework(doc: any) {
  const h = typeof doc.toObject === "function" ? doc.toObject() : doc
  const activity = String(h.activity || h.subject || "General")
  const instructions = String(h.instructions || h.description || "")
  const batch = String(h.batch || h.className || "")
  const attachment = h.attachment || null
  const attachmentUrl = attachment?.src || h.attachmentUrl || ""
  return {
    ...h,
    id: String(h._id),
    _id: String(h._id),
    title: String(h.title || activity || "Homework"),
    activity,
    subject: activity,
    instructions,
    description: instructions,
    batch,
    className: h.className || batch,
    dueDate: h.dueDate || "",
    assignedDate: h.assignedDate || (h.createdAt ? String(h.createdAt).slice(0, 10) : ""),
    visibility: h.visibility || "immediate",
    visibleFrom: h.visibleFrom || "",
    status: h.status || "active",
    createdBy: h.createdBy || "",
    attachment,
    attachmentUrl,
    submittable: Boolean(h.submittable),
    submissions: Array.isArray(h.submissions) ? h.submissions : [],
  }
}

export async function listHomeworksForUser(user: JwtPayload, className?: string | null) {
  const student = await loadStudentForParent(user)
  const tenantIds = await expandTenantIds(
    [user.tenantId, student?.tenantId].filter(Boolean).map(String)
  )

  const query: Record<string, any> = {}
  if (user.role !== "super_admin" && tenantIds.length > 0) {
    query.tenantId = { $in: tenantIds }
  }

  let rows = await Homework.find(query).sort({ createdAt: -1 }).limit(80).lean()

  if (rows.length === 0 && tenantIds.length > 0 && user.role !== "super_admin") {
    const all = await Homework.find({}).sort({ createdAt: -1 }).limit(80).lean()
    const allowed = new Set(tenantIds.map((id) => id.toLowerCase()))
    rows = all.filter((item: any) => {
      const tenant = String(item.tenantId || "").trim()
      return !tenant || allowed.has(tenant.toLowerCase())
    })
  }

  const aliases = [className, student?.className, student?.section, student?.classId]
    .filter(Boolean)
    .map(String)

  if (user.role === "student") {
    const today = todayIso()
    rows = rows.filter((item: any) => {
      if (!isVisibleToParent(item, today)) return false
      return journalVisibleToClass(item.batch || item.className, aliases)
    })
  } else if (className) {
    rows = rows.filter((item: any) =>
      journalVisibleToClass(item.batch || item.className, [className])
    )
  }

  return rows.map(serializeHomework)
}
