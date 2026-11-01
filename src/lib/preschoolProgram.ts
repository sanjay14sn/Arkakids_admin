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

export const DEFAULT_PROGRAMS: SavedClassProgram[] = [
  {
    id: "prog-toddler",
    name: "Toddler",
    code: "TOD",
    duration: "1 Year",
    fees: 48000,
    ageFrom: 2,
    ageTo: 3,
    ageGroup: "2–3 years",
    description: "Foundational sensory learning, fine motor skills, and early play exploration.",
    startTime: "09:00",
    endTime: "12:00",
    capacity: 20,
    status: "active",
  },
  {
    id: "prog-nursery",
    name: "Nursery",
    code: "NUR",
    duration: "1 Year",
    fees: 54000,
    ageFrom: 3,
    ageTo: 4,
    ageGroup: "3–4 years",
    description: "Language development, pre-math concepts, creativity, and phonics.",
    startTime: "09:00",
    endTime: "12:30",
    capacity: 25,
    status: "active",
  },
  {
    id: "prog-junior",
    name: "Junior (JR)",
    code: "JR",
    duration: "1 Year",
    fees: 60000,
    ageFrom: 4,
    ageTo: 5,
    ageGroup: "4–5 years",
    description: "Introductory abacus arithmetic, reading, writing, and mathematical reasoning.",
    startTime: "09:00",
    endTime: "13:00",
    capacity: 25,
    status: "active",
  },
  {
    id: "prog-senior",
    name: "Senior (SR)",
    code: "SR",
    duration: "1 Year",
    fees: 66000,
    ageFrom: 5,
    ageTo: 6,
    ageGroup: "5–6 years",
    description: "Advanced abacus calculations, speed math, and primary school readiness.",
    startTime: "09:00",
    endTime: "13:30",
    capacity: 30,
    status: "active",
  },
]

export function deduplicatePrograms(programs: SavedClassProgram[]): SavedClassProgram[] {
  const seen = new Set<string>()
  const result: SavedClassProgram[] = []
  for (const prog of programs) {
    const key = (prog.name || "").trim().toLowerCase()
    if (!key) continue
    if (!seen.has(key)) {
      seen.add(key)
      result.push(prog)
    }
  }
  return result
}

export function loadSavedPrograms(): SavedClassProgram[] {
  if (typeof window === "undefined") return DEFAULT_PROGRAMS
  try {
    const parsed = JSON.parse(localStorage.getItem(CLASS_PROGRAMS_KEY) || "[]")
    if (Array.isArray(parsed) && parsed.length > 0) return deduplicatePrograms(parsed)
    return DEFAULT_PROGRAMS
  } catch {
    return DEFAULT_PROGRAMS
  }
}

export function persistPrograms(programs: SavedClassProgram[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(CLASS_PROGRAMS_KEY, JSON.stringify(deduplicatePrograms(programs)))
}

export function mergeProgramLists(apiList: SavedClassProgram[] | unknown) {
  const fromApi = Array.isArray(apiList) ? (apiList as SavedClassProgram[]) : []
  if (fromApi.length > 0) {
    const deduped = deduplicatePrograms(fromApi)
    persistPrograms(deduped)
    return deduped
  }
  return deduplicatePrograms(loadSavedPrograms())
}

