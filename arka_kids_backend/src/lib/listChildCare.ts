import { ChildCare } from "@/models/index"
import type { JwtPayload } from "@/lib/authMiddleware"
import { expandTenantIds, loadStudentForParent } from "@/lib/listSchoolNotices"

function serializeCare(doc: any) {
  const d = typeof doc.toObject === "function" ? doc.toObject() : doc
  const date = String(d.date || "").slice(0, 10)
  return {
    ...d,
    id: String(d._id || d.id || ""),
    _id: String(d._id || d.id || ""),
    studentId: String(d.studentId || ""),
    studentName: String(d.studentName || ""),
    type: String(d.type || ""),
    date,
    meal: d.meal || "",
    items: d.items || "",
    eaten: d.eaten || "",
    note: d.note || "",
    start: d.start || "",
    end: d.end || "",
    quality: d.quality || "",
  }
}

export async function listChildCareForUser(
  user: JwtPayload,
  opts?: { studentId?: string | null; type?: string | null }
) {
  const student = await loadStudentForParent(user)
  const tenantIds = await expandTenantIds(
    [user.tenantId, student?.tenantId].filter(Boolean).map(String)
  )

  const query: Record<string, any> = {}
  if (user.role !== "super_admin" && tenantIds.length > 0) {
    query.tenantId = { $in: tenantIds }
  }
  if (opts?.type) query.type = opts.type

  let rows = await ChildCare.find(query).sort({ createdAt: -1 }).lean()

  if (rows.length === 0 && tenantIds.length > 0 && user.role !== "super_admin") {
    const all = await ChildCare.find(opts?.type ? { type: opts.type } : {})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
    const allowed = new Set(tenantIds.map((id) => id.toLowerCase()))
    rows = all.filter((item: any) => {
      const tenant = String(item.tenantId || "").trim()
      return !tenant || allowed.has(tenant.toLowerCase())
    })
  }

  const ids = new Set(
    [opts?.studentId, student?._id, user.role === "student" ? user.id : null]
      .filter(Boolean)
      .map(String)
  )
  const names = new Set(
    [student?.name]
      .filter(Boolean)
      .map((n) => String(n).trim().toLowerCase())
  )

  if (user.role === "student" || opts?.studentId) {
    rows = rows.filter((item: any) => {
      if (ids.has(String(item.studentId))) return true
      const name = String(item.studentName || "").trim().toLowerCase()
      return Boolean(name && names.has(name))
    })
  }

  return rows.map(serializeCare)
}
