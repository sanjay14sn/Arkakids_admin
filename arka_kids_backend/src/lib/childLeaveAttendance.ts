import { ChildLeave } from "@/models/ChildLeave"
import { Attendance } from "@/models/Attendance"

export function dateKey(value?: unknown) {
  const text = String(value || "")
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  return text.slice(0, 10)
}

export function eachDate(from?: unknown, to?: unknown) {
  const start = dateKey(from)
  const end = dateKey(to || from)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return []
  const [sy, sm, sd] = start.split("-").map(Number)
  const [ey, em, ed] = (/^\d{4}-\d{2}-\d{2}$/.test(end) ? end : start).split("-").map(Number)
  const out: string[] = []
  const cur = new Date(sy, sm - 1, sd)
  const last = new Date(ey, em - 1, ed)
  while (cur <= last) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, "0")
    const d = String(cur.getDate()).padStart(2, "0")
    out.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

export function sameStudent(
  record: { entityId?: unknown; name?: unknown },
  leave: { childId?: unknown; childName?: unknown; studentName?: unknown }
) {
  const entityId = String(record.entityId || "")
  const childId = String(leave.childId || "")
  if (entityId && childId && entityId === childId) return true
  const a = String(record.name || "").trim().toLowerCase()
  const b = String(leave.childName || leave.studentName || "").trim().toLowerCase()
  return Boolean(a && b && a === b)
}

export function serializeChildLeave(doc: any) {
  const d = typeof doc?.toObject === "function" ? doc.toObject() : { ...doc }
  return {
    ...d,
    id: String(d._id || d.id || ""),
    _id: String(d._id || d.id || ""),
    childId: String(d.childId || ""),
    childName: String(d.childName || d.studentName || ""),
    fromDate: dateKey(d.fromDate),
    toDate: dateKey(d.toDate || d.fromDate),
    reason: String(d.reason || ""),
    status: String(d.status || "pending").toLowerCase(),
    requestedBy: String(d.requestedBy || ""),
    decidedBy: d.decidedBy || undefined,
  }
}

export function findApprovedLeave(
  leaves: any[],
  student: { id?: unknown; entityId?: unknown; name?: unknown },
  date: string
) {
  const day = dateKey(date)
  return (leaves || []).find((leave) => {
    if (String(leave?.status || "").toLowerCase() !== "approved") return false
    const from = dateKey(leave.fromDate)
    const to = dateKey(leave.toDate || leave.fromDate)
    if (!from || day < from || day > to) return false
    return sameStudent(
      { entityId: student.id || student.entityId, name: student.name },
      leave
    )
  })
}

export function applyLeaveToRecords(records: any[], leaves: any[], date: string) {
  return (records || []).map((row) => {
    const leave = findApprovedLeave(leaves, { entityId: row.entityId, name: row.name }, date)
    if (!leave) return row
    return {
      ...row,
      status: "leave",
      absenceReason: leave.reason || row.absenceReason,
      note: leave.reason || row.note,
      remarks: leave.reason || row.remarks || row.note,
    }
  })
}

export async function loadApprovedLeaves(tenantIds: string[]) {
  const query: Record<string, any> = { status: "approved" }
  if (tenantIds.length > 0) query.tenantId = { $in: tenantIds }
  let rows = await ChildLeave.find(query).lean()
  if (rows.length === 0 && tenantIds.length > 0) {
    const all = await ChildLeave.find({ status: "approved" }).limit(500).lean()
    const allowed = new Set(tenantIds.map((id) => id.toLowerCase()))
    rows = all.filter((item: any) => {
      const tenant = String(item.tenantId || "").trim()
      return !tenant || allowed.has(tenant.toLowerCase())
    })
  }
  return rows.map(serializeChildLeave)
}

export async function applyLeaveToAttendanceDocs(leave: any, tenantIds: string[]) {
  const dates = eachDate(leave.fromDate, leave.toDate)
  if (dates.length === 0) return
  const query: Record<string, any> = { type: "student", date: { $in: dates } }
  if (tenantIds.length > 0) query.tenantId = { $in: tenantIds }

  let sessions = await Attendance.find(query)
  if (sessions.length === 0 && tenantIds.length > 0) {
    const all = await Attendance.find({ type: "student", date: { $in: dates } })
    const allowed = new Set(tenantIds.map((id) => id.toLowerCase()))
    sessions = all.filter((item: any) => {
      const tenant = String(item.tenantId || "").trim()
      return !tenant || allowed.has(tenant.toLowerCase())
    })
  }

  for (const session of sessions) {
    const records = session.records || []
    let changed = false
    for (let i = 0; i < records.length; i++) {
      if (!sameStudent(records[i], leave)) continue
      records[i].status = "leave"
      records[i].absenceReason = leave.reason || records[i].absenceReason
      records[i].note = leave.reason || records[i].note
      changed = true
    }
    if (!records.some((row: { entityId?: unknown; name?: unknown }) => sameStudent(row, leave)) && (leave.childId || leave.childName)) {
      records.push({
        entityId: String(leave.childId || ""),
        name: String(leave.childName || "Student"),
        status: "leave",
        absenceReason: leave.reason,
        note: leave.reason,
        parentInformed: true,
      })
      changed = true
    }
    if (changed) {
      session.markModified("records")
      await session.save()
    }
  }
}

export async function clearLeaveFromAttendanceDocs(leave: any, tenantIds: string[]) {
  const dates = eachDate(leave.fromDate, leave.toDate)
  if (dates.length === 0) return

  const otherApproved = await loadApprovedLeaves(tenantIds)
  const remaining = otherApproved.filter((item) => String(item.id || item._id) !== String(leave._id || leave.id))

  const query: Record<string, any> = { type: "student", date: { $in: dates } }
  if (tenantIds.length > 0) query.tenantId = { $in: tenantIds }

  let sessions = await Attendance.find(query)
  if (sessions.length === 0 && tenantIds.length > 0) {
    const all = await Attendance.find({ type: "student", date: { $in: dates } })
    const allowed = new Set(tenantIds.map((id) => id.toLowerCase()))
    sessions = all.filter((item: any) => {
      const tenant = String(item.tenantId || "").trim()
      return !tenant || allowed.has(tenant.toLowerCase())
    })
  }

  for (const session of sessions) {
    const records = session.records || []
    let changed = false
    for (let i = 0; i < records.length; i++) {
      if (!sameStudent(records[i], leave)) continue
      if (String(records[i].status || "") !== "leave") continue
      const stillCovered = findApprovedLeave(remaining, records[i], dateKey(session.date))
      if (stillCovered) continue
      records[i].status = "present"
      if (!records[i].absenceReason || records[i].absenceReason === leave.reason) {
        records[i].absenceReason = undefined
      }
      if (!records[i].note || records[i].note === leave.reason) {
        records[i].note = undefined
      }
      changed = true
    }
    if (changed) {
      session.markModified("records")
      await session.save()
    }
  }
}

export function injectLeaveSessions(sessions: any[], leaves: any[], student?: { _id?: unknown; id?: unknown; name?: unknown } | null) {
  const existing = new Set(sessions.map((session) => dateKey(session.date)))
  const extra: any[] = []
  for (const leave of leaves) {
    if (String(leave.status || "").toLowerCase() !== "approved") continue
    if (student) {
      const matches = sameStudent(
        { entityId: student._id || student.id, name: student.name },
        leave
      )
      if (!matches) continue
    }
    for (const date of eachDate(leave.fromDate, leave.toDate)) {
      if (existing.has(date)) continue
      extra.push({
        id: `leave-${leave.id || leave._id}-${date}`,
        _id: `leave-${leave.id || leave._id}-${date}`,
        date,
        type: "student",
        className: leave.className || "",
        batchId: leave.batchId || "",
        submitted: true,
        records: [
          {
            entityId: String(leave.childId || ""),
            name: String(leave.childName || ""),
            status: "leave",
            note: leave.reason || "",
            remarks: leave.reason || "",
            absenceReason: leave.reason || "",
            parentInformed: true,
            arrivalTime: "",
            checkInTime: "",
          },
        ],
      })
      existing.add(date)
    }
  }
  return [...sessions, ...extra]
}
