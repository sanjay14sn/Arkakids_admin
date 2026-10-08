export const ALL_BATCHES_ID = "all"

export function parseNoticeDate(value?: unknown): string {
  const raw = String(value || "").trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, "0")
    const d = String(parsed.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export type BatchAudience = {
  _id?: unknown
  id?: string
  courseName?: string
  section?: string
  code?: string
  studentNames?: string[]
  status?: string
}

export type StudentAudience = {
  name?: string
  className?: string
  classId?: string
  section?: string
}

export function batchLabel(batch: BatchAudience): string {
  if (batch.section) {
    return `${batch.courseName || "Class"} - ${batch.section}`
  }
  return String(batch.code || batch.courseName || "Batch")
}

export function batchId(batch: BatchAudience): string {
  return String(batch._id || batch.id || "")
}

function norm(value?: string | null): string {
  return String(value || "").trim().toLowerCase()
}

/** True when this school notice should appear for the given child. */
export function noticeVisibleToStudent(
  notice: { isSchoolNotice?: boolean; targetBatchIds?: string[] },
  student: StudentAudience | null,
  batches: BatchAudience[]
): boolean {
  if (!notice.isSchoolNotice) return true
  const ids = (notice.targetBatchIds || []).map(String)
  if (ids.length === 0 || ids.includes(ALL_BATCHES_ID)) return true
  if (!student) return false

  const childName = norm(student.name)
  const className = norm(student.className)
  const classId = String(student.classId || "")
  const section = norm(student.section)

  return batches.some((batch) => {
    const id = batchId(batch)
    if (!id || !ids.includes(id)) return false
    if (classId && classId === id) return true

    const names = (batch.studentNames || []).map((n) => norm(String(n)))
    if (childName && names.includes(childName)) return true

    const label = norm(batchLabel(batch))
    if (className && (className === label || label.includes(className) || className.includes(label))) {
      return true
    }
    if (section && (norm(batch.section) === section || label.includes(section))) return true
    return false
  })
}
