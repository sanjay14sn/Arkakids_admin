import { ChildDocument } from "@/models/index"
import type { JwtPayload } from "@/lib/authMiddleware"
import { expandTenantIds, loadStudentForParent } from "@/lib/listSchoolNotices"

export function serializeChildDocument(doc: any) {
  const d = typeof doc.toObject === "function" ? doc.toObject() : doc
  const studentId = String(d.studentId || d.childId || "")
  const url = String(d.url || d.fileUrl || "")
  const name = String(d.name || d.fileName || d.title || "Document")
  const type = String(d.type || "")
  const status = d.status || (url ? "uploaded" : "missing")
  return {
    ...d,
    id: String(d._id || d.id || ""),
    _id: String(d._id || d.id || ""),
    childId: studentId,
    studentId,
    studentName: String(d.studentName || ""),
    name,
    fileName: name,
    type,
    url,
    fileUrl: url,
    status,
    uploadedAt: d.uploadedAt || d.updatedAt || d.createdAt,
  }
}

export async function listChildDocumentsForUser(user: JwtPayload) {
  const student = await loadStudentForParent(user)
  const tenantIds = await expandTenantIds(
    [user.tenantId, student?.tenantId].filter(Boolean).map(String)
  )

  const query: Record<string, any> = {}
  if (tenantIds.length > 0) {
    query.tenantId = { $in: tenantIds }
  }

  if (user.role === "student") {
    const studentId = String(student?._id || user.id || "")
    if (studentId) query.studentId = studentId
  }

  const rows = await ChildDocument.find(query).sort({ createdAt: -1 }).lean()
  return rows.map(serializeChildDocument)
}
