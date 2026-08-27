export const CLASS_PROGRAMS_KEY = "arka_class_programs_v1"

export type ProgramStatus = "active" | "inactive"

export type SavedClassProgram = {
  id: string
  _id?: string
  name: string
  code: string
  duration?: string
  fees?: number
  ageFrom?: number
  ageTo?: number
  ageGroup?: string
  description?: string
  startTime?: string
  endTime?: string
  capacity?: number
  status?: ProgramStatus
}

export function makeProgramCode(name: string) {
  const letters = name.replace(/[^A-Za-z]/g, "").toUpperCase()
  if (letters.length >= 3) return letters.slice(0, 3)
  const compact = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
  return (compact.slice(0, 3) || "PRG").padEnd(3, "X")
}

export function programKey(program: { id?: string; _id?: string; code?: string; name?: string }) {
  return program.id || program._id || `${program.code || "prg"}-${program.name || "program"}`
}

export function uniqueProgramNames(programs: { name?: string }[]) {
  return Array.from(new Set(programs.map((program) => program.name?.trim()).filter(Boolean) as string[]))
}

export function formatAgeGroup(from?: number | string, to?: number | string) {
  const start = Number(from)
  const end = Number(to)
  const hasStart = Number.isFinite(start) && start > 0
  const hasEnd = Number.isFinite(end) && end > 0
  if (hasStart && hasEnd) return `${start}–${end} years`
  if (hasStart) return `${start}+ years`
  if (hasEnd) return `Up to ${end} years`
  return ""
}

export function parseAgeRange(program: { ageFrom?: number; ageTo?: number; ageGroup?: string }) {
  if (program.ageFrom != null || program.ageTo != null) {
    return {
      from: program.ageFrom != null ? String(program.ageFrom) : "",
      to: program.ageTo != null ? String(program.ageTo) : "",
    }
  }
  const text = program.ageGroup || ""
  const range = text.match(/(\d+(?:\.\d+)?)\s*(?:–|-|to)\s*(\d+(?:\.\d+)?)/i)
  if (range) return { from: range[1], to: range[2] }
  const plus = text.match(/(\d+(?:\.\d+)?)\s*\+/)
  if (plus) return { from: plus[1], to: "" }
  const single = text.match(/(\d+(?:\.\d+)?)/)
  return { from: single?.[1] || "", to: "" }
}

export function uniqueAgeGroups(programs: { ageGroup?: string; ageFrom?: number; ageTo?: number }[]) {
  return Array.from(
    new Set(
      programs
        .map((program) => formatAgeGroup(program.ageFrom, program.ageTo) || program.ageGroup?.trim())
        .filter(Boolean) as string[]
    )
  )
}

export function uniqueDurations(programs: { duration?: string }[]) {
  return Array.from(new Set(programs.map((program) => program.duration?.trim()).filter(Boolean) as string[]))
}

export function loadSavedPrograms(): SavedClassProgram[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem(CLASS_PROGRAMS_KEY) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function persistPrograms(programs: SavedClassProgram[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(CLASS_PROGRAMS_KEY, JSON.stringify(programs))
}

export function mergeProgramLists(apiList: SavedClassProgram[] | unknown) {
  const fromApi = Array.isArray(apiList) ? (apiList as SavedClassProgram[]) : []
  if (fromApi.length > 0) {
    persistPrograms(fromApi)
    return fromApi
  }
  return loadSavedPrograms()
}
