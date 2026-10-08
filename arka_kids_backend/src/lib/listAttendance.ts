import { Attendance } from "@/models/Attendance"
import type { JwtPayload } from "@/lib/authMiddleware"
import { expandTenantIds, loadStudentForParent } from "@/lib/listSchoolNotices"
import { applyLeaveToRecords, injectLeaveSessions, loadApprovedLeaves } from "@/lib/childLeaveAttendance"

function dateKey(value?: unknown) {
  const text = String(value || "")
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  return text.slice(0, 10)
}

function serializeSession(doc: any) {
  const d = typeof doc.toObject === "function" ? doc.toObject() : doc
  return {
    ...d,
    id: String(d._id || d.id || ""),
    _id: String(d._id || d.id || ""),
    date: dateKey(d.date),
    type: d.type || "student",
    className: d.className || "",
    batchId: d.batchId || "",
    submitted: Boolean(d.submitted),
    records: (d.records || []).map((r: any) => ({
      entityId: String(r.entityId || ""),
      name: String(r.name || ""),
      status: String(r.status || "absent"),
      note: r.note || "",
      remarks: r.note || r.absenceReason || r.remarks || "",
      absenceReason: r.absenceReason || "",
      parentInformed: Boolean(r.parentInformed),
      arrivalTime: r.arrivalTime || "",
      checkInTime: r.arrivalTime || r.checkInTime || "",
    })),
  }
}

export async function listAttendanceForUser(
  user: JwtPayload,
  opts?: {
    date?: string | null
    month?: string | null
    type?: string | null
    entityId?: string | null
    className?: string | null
  }
) {
  const student = await loadStudentForParent(user)
  const tenantIds = await expandTenantIds(
    [user.tenantId, student?.tenantId].filter(Boolean).map(String)
  )

  const query: Record<string, any> = { type: opts?.type || "student" }
  if (user.role !== "super_admin" && tenantIds.length > 0) {
    query.tenantId = { $in: tenantIds }
  }
  if (opts?.date) query.date = opts.date
  if (opts?.month) query.date = { $regex: `^${opts.month}` }
  if (opts?.className) query.className = opts.className

  let rows = await Attendance.find(query).sort({ date: -1 }).lean()

  if (rows.length === 0 && tenantIds.length > 0 && user.role !== "super_admin") {
    const all = await Attendance.find({ type: query.type }).sort({ date: -1 }).limit(200).lean()
    const allowed = new Set(tenantIds.map((id) => id.toLowerCase()))
    rows = all.filter((item: any) => {
      const tenant = String(item.tenantId || "").trim()
      return !tenant || allowed.has(tenant.toLowerCase())
    })
  }

  let sessions = rows.map(serializeSession)
  const approvedLeaves = await loadApprovedLeaves(tenantIds)
  sessions = sessions.map((session) => ({
    ...session,
    records: applyLeaveToRecords(session.records, approvedLeaves, session.date),
  }))

  if (user.role === "student" || opts?.entityId) {
    const ids = new Set(
      [opts?.entityId, student?._id, user.role === "student" ? user.id : null]
        .filter(Boolean)
        .map(String)
    )
    const names = new Set(
      [student?.name]
        .filter(Boolean)
        .map((n) => String(n).trim().toLowerCase())
    )
    sessions = sessions
      .map((session) => ({
        ...session,
        records: session.records.filter(
          (r: any) =>
            ids.has(String(r.entityId)) ||
            names.has(String(r.name || "").trim().toLowerCase())
        ),
      }))
      .filter((session) => session.records.length > 0)
    sessions = injectLeaveSessions(sessions, approvedLeaves, {
      _id: student?._id || opts?.entityId,
      id: user.role === "student" ? user.id : opts?.entityId,
      name: student?.name,
    })
  }

  return sessions
}
