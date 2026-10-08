import { Journal } from "@/models/index"
import type { JwtPayload } from "@/lib/authMiddleware"
import { expandTenantIds, loadStudentForParent } from "@/lib/listSchoolNotices"

function classKey(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/[—–−]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function parseClass(value?: string | null) {
  const key = classKey(value)
  const match = key.match(/^(.*)\s+([a-z])$/)
  if (match) return { core: match[1].trim(), section: match[2] }
  return { core: key, section: null as string | null }
}

export function journalVisibleToClass(journalClass: string | undefined, aliases: string[]) {
  if (!classKey(journalClass)) return true
  const usable = aliases.map(classKey).filter(Boolean)
  if (usable.length === 0) return true

  const journal = parseClass(journalClass)
  return usable.some((alias) => {
    const student = parseClass(alias)
    if (!student.core) return false
    const coreOk =
      journal.core === student.core ||
      journal.core.includes(student.core) ||
      student.core.includes(journal.core)
    if (!coreOk) return false
    if (journal.section && student.section && journal.section !== student.section) return false
    return true
  })
}

function serializeJournal(doc: any) {
  const j = typeof doc.toObject === "function" ? doc.toObject() : doc
  const photos: string[] = Array.isArray(j.photos) ? j.photos.filter(Boolean) : []
  const media =
    Array.isArray(j.media) && j.media.length > 0
      ? j.media
      : photos.map((url: string, i: number) => ({
          id: `m-${j._id}-${i}`,
          kind: "photo",
          label: "Class photo",
          src: url,
          tone: "from-amber-200 to-orange-300",
        }))
  const note = String(j.content || j.note || "")
  const imageUrl = media[0]?.src || photos[0] || ""
  return {
    ...j,
    id: String(j._id),
    _id: String(j._id),
    note,
    content: note,
    author: j.postedBy || j.author || "",
    postedBy: j.postedBy || j.author || "",
    photos,
    media,
    tags: Array.isArray(j.tags) ? j.tags : [],
    imageUrl,
    title: j.title || media[0]?.label || "Classroom Update",
    createdAt: j.createdAt,
    date: j.date,
    className: j.className || "",
  }
}

export async function listJournalsForUser(user: JwtPayload, className?: string | null) {
  const student = await loadStudentForParent(user)
  const tenantIds = await expandTenantIds(
    [user.tenantId, student?.tenantId].filter(Boolean).map(String)
  )

  const query: Record<string, any> = {}
  if (user.role !== "super_admin" && tenantIds.length > 0) {
    query.tenantId = { $in: tenantIds }
  }

  let rows = await Journal.find(query).sort({ createdAt: -1 }).limit(80).lean()

  if (rows.length === 0 && tenantIds.length > 0 && user.role !== "super_admin") {
    const all = await Journal.find({}).sort({ createdAt: -1 }).limit(80).lean()
    const allowed = new Set(tenantIds.map((id) => id.toLowerCase()))
    rows = all.filter((item: any) => {
      const tenant = String(item.tenantId || "").trim()
      return !tenant || allowed.has(tenant.toLowerCase())
    })
  }

  if (user.role !== "student") {
    if (className) {
      rows = rows.filter((item: any) => journalVisibleToClass(item.className, [className]))
    }
    return rows.map(serializeJournal)
  }

  const aliases = [className, student?.className, student?.section, student?.classId]
    .filter(Boolean)
    .map(String)

  return rows
    .filter((item: any) => journalVisibleToClass(item.className, aliases))
    .map(serializeJournal)
}
