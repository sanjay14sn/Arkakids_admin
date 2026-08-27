export const ACADEMIC_YEARS = ["2025–26", "2026–27", "2027–28"] as const
export const GRADES = ["Toddler", "Nursery", "Jr KG", "Sr KG"] as const
export const SECTIONS = ["A", "B", "C"] as const
export const CLASSROOMS = ["Room 101", "Room 102", "Room 103", "Activity Room 2", "Sand Pit Classroom"] as const
export const WEEKDAYS = [
  { id: "Mon", label: "Mon" },
  { id: "Tue", label: "Tue" },
  { id: "Wed", label: "Wed" },
  { id: "Thu", label: "Thu" },
  { id: "Fri", label: "Fri" },
  { id: "Sat", label: "Sat" },
  { id: "Sun", label: "Sun" },
] as const

export const PREVIEW_STAFF = [
  { id: "staff-priya", name: "Priya Kumar", kind: "coordinator" },
  { id: "staff-anitha", name: "Anitha", kind: "teacher" },
  { id: "staff-kavya", name: "Kavya", kind: "assistant" },
  { id: "staff-meera", name: "Meera Nair", kind: "teacher" },
  { id: "staff-ravi", name: "Ravi Menon", kind: "coordinator" },
]

export function gradeCode(grade: string) {
  if (grade === "Toddler" || grade === "Play Group") return "TOD"
  if (grade === "Nursery") return "NUR"
  if (grade === "Jr KG" || grade === "LKG") return "JKG"
  if (grade === "Sr KG" || grade === "UKG") return "SKG"
  return grade
}

export function yearCode(year: string) {
  const parts = year.split(/[–-]/).map((part) => part.trim())
  if (parts.length < 2) return year.replace(/\D/g, "").slice(-4)
  return `${parts[0].slice(-2)}${parts[1].slice(-2)}`
}

export function makeBatchCode(grade: string, section: string, year: string) {
  return `${gradeCode(grade)}-${section}-${yearCode(year)}`
}

export function formatClock(value: string) {
  if (!value) return ""
  const [hours, minutes] = value.split(":").map(Number)
  if (Number.isNaN(hours)) return value
  const suffix = hours >= 12 ? "PM" : "AM"
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes || 0).padStart(2, "0")} ${suffix}`
}

export function weekdayRange(days: string[]) {
  const order = WEEKDAYS.map((day) => day.id)
  const selected = order.filter((day) => days.includes(day))
  if (selected.length === 5 && selected[0] === "Mon" && selected[4] === "Fri") return "Monday–Friday"
  if (selected.length === 6 && selected[0] === "Mon" && selected[5] === "Sat") return "Monday–Saturday"
  return selected.join(", ")
}

export function buildSchedule(days: string[], startTime: string, endTime: string) {
  return `${weekdayRange(days)} · ${formatClock(startTime)} – ${formatClock(endTime)}`
}
