import mongoose from "mongoose"
import { Batch } from "@/models/Batch"
import { Student } from "@/models/Student"
import { Center } from "@/models/Center"
import { Notification } from "@/models/index"
import { tenantFilter, type JwtPayload } from "@/lib/authMiddleware"
import { ALL_BATCHES_ID, noticeVisibleToStudent } from "@/lib/schoolNotices"

function serializeNotice(doc: any) {
  const n = typeof doc.toObject === "function" ? doc.toObject() : doc
  const description = String(n.description || n.subtitle || "")
  return {
    ...n,
    id: String(n._id),
    _id: String(n._id),
    title: String(n.title || ""),
    description,
    subtitle: description,
    type: n.type || "info",
    noticeDate: n.noticeDate || "",
    createdAt: n.createdAt,
    targetBatchIds: n.targetBatchIds || [],
    targetBatchNames: n.targetBatchNames || [],
  }
}

export async function loadStudentForParent(user: JwtPayload) {
  if (user.role !== "student") return null
  const byId = await Student.findById(user.id).catch(() => null)
  if (byId) return byId
  const email = user.email?.toLowerCase().trim()
  if (!email) return null
  return Student.findOne({
    ...tenantFilter(user),
    $or: [{ parentEmail: email }, { email }],
  }).catch(() => null)
}

export async function expandTenantIds(raw: string[]): Promise<string[]> {
  const ids = new Set(raw.filter(Boolean).map(String))
  if (ids.size === 0) return []

  const objectIds = [...ids].filter((id) => mongoose.isValidObjectId(id) && id.length === 24)
  const names = [...ids].filter((id) => !objectIds.includes(id))
  const clauses: Record<string, unknown>[] = []
  if (objectIds.length) clauses.push({ _id: { $in: objectIds } })
  if (names.length) {
    clauses.push({ name: { $in: names } }, { tenantName: { $in: names } })
  }

  const centers = clauses.length
    ? await Center.find(clauses.length === 1 ? clauses[0] : { $or: clauses }).lean()
    : []

  for (const center of centers as any[]) {
    ids.add(String(center._id))
    if (center.name) ids.add(String(center.name))
    if (center.tenantName) ids.add(String(center.tenantName))
    if (center.tenantId) ids.add(String(center.tenantId))
  }
  return [...ids]
}

export async function listSchoolNoticesForUser(user: JwtPayload) {
  const student = await loadStudentForParent(user)
  const tenantIds = await expandTenantIds(
    [user.tenantId, student?.tenantId].filter(Boolean).map(String)
  )

  const query: Record<string, any> = { isSchoolNotice: true }
  if (tenantIds.length > 0) {
    query.tenantId = { $in: tenantIds }
  }

  let rows = await Notification.find(query).sort({ noticeDate: -1, createdAt: -1 }).limit(50).lean()

  if (rows.length === 0) {
    const all = await Notification.find({ isSchoolNotice: true }).sort({ createdAt: -1 }).limit(50).lean()
    if (tenantIds.length === 0) {
      rows = all
    } else {
      const allowed = new Set(tenantIds.map((id) => id.toLowerCase()))
      rows = all.filter((n: any) => {
        const tenant = String(n.tenantId || "").trim()
        return !tenant || allowed.has(tenant.toLowerCase())
      })
    }
  }

  if (user.role !== "student") {
    return rows.map(serializeNotice)
  }

  const child = student
    ? {
        name: student.name,
        className: student.className,
        classId: student.classId,
        section: student.section,
      }
    : { name: user.name }

  const needsBatches = rows.some((n: any) => {
    const ids = (n.targetBatchIds || []).map(String)
    return ids.length > 0 && !ids.includes(ALL_BATCHES_ID)
  })
  const batches = needsBatches
    ? await Batch.find(tenantIds.length ? { tenantId: { $in: tenantIds } } : {}).lean()
    : []

  return rows
    .filter((n: any) =>
      noticeVisibleToStudent(
        { isSchoolNotice: true, targetBatchIds: n.targetBatchIds },
        child,
        batches as any
      )
    )
    .map(serializeNotice)
}
