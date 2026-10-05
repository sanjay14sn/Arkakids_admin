import { useCallback, useEffect, useState } from "react"
import { CHILDREN, type ChildRecord, type LeaveRequest } from "@/lib/preschoolOps"

export const ATTENDANCE_KEY = "arka_preschool_attendance_v1"

export type AttendanceStatus = "present" | "absent" | "leave"
export type AbsenceReason = "Sick" | "Personal" | "Family" | "No Information" | "Other"
export type NotifyChannel = "app" | "whatsapp" | "sms" | "email"

export type AttendanceChild = ChildRecord & {
  admissionNo: string
  initials: string
  tone: string
  section: string
  klass: string
}

export type AttendanceSettings = {
  arrivalTime: string
  teachersCanEdit: boolean
  submitDeadline: string
  notifyAbsent: boolean
  notifyLeave: boolean
  notifyDailySummary: boolean
  channels: NotifyChannel[]
}

export type ChildMark = {
  childId: string
  status: AttendanceStatus
  remarks?: string
  absenceReason?: AbsenceReason
  parentInformed?: boolean
  arrivalTime?: string
}

export type AttendanceSession = {
  id: string
  date: string
  className: string
  submitted: boolean
  submittedAt?: string
  submittedBy?: string
  marks: ChildMark[]
}

export type AttendanceAudit = {
  id: string
  date: string
  className: string
  childId: string
  fromStatus: AttendanceStatus
  toStatus: AttendanceStatus
  changedBy: string
  changedAt: string
  reason: string
}

export type AttendanceNotice = {
  id: string
  childId: string
  date: string
  channel: NotifyChannel
  title: string
  body: string
  createdAt: string
}

export type AttendanceState = {
  settings: AttendanceSettings
  sessions: AttendanceSession[]
  audits: AttendanceAudit[]
  notices: AttendanceNotice[]
}

const TONES = [
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-lime-100 text-lime-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
  "bg-orange-100 text-orange-800",
  "bg-indigo-100 text-indigo-800",
]

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function splitClass(className: string) {
  const match = className.match(/^(.*)\s([A-Z])$/)
  if (match) return { klass: match[1], section: match[2] }
  return { klass: className, section: "-" }
}

function extra(
  id: string,
  name: string,
  parentName: string,
  className: string,
  branch: string,
  ageBand: ChildRecord["ageBand"],
  admissionNo: string,
  tone: string
): AttendanceChild {
  const { klass, section } = splitClass(className)
  return { id, name, parentName, className, branch, ageBand, admissionNo, initials: initials(name), tone, section, klass }
}

const NURSERY_A_EXTRAS: AttendanceChild[] = [
  extra("att-diya", "Diya Kumar", "Ritu Kumar", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2402", TONES[1]),
  extra("att-rahul", "Rahul Kumar", "Sanjay Kumar", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2403", TONES[2]),
  extra("att-aarav", "Aarav Mehta", "Nisha Mehta", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2404", TONES[3]),
  extra("att-ananya", "Ananya Rao", "Sneha Rao", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2405", TONES[4]),
  extra("att-kabir", "Kabir Joshi", "Amit Joshi", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2406", TONES[5]),
  extra("att-ishaan", "Ishaan Patel", "Hetal Patel", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2407", TONES[6]),
  extra("att-myra", "Myra Singh", "Pooja Singh", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2408", TONES[7]),
  extra("att-advait", "Advait Nair", "Leena Nair", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2409", TONES[0]),
  extra("att-kiara", "Kiara Shah", "Dev Shah", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2410", TONES[1]),
  extra("att-reyansh", "Reyansh Gupta", "Anu Gupta", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2411", TONES[2]),
  extra("att-anvi", "Anvi Desai", "Kavita Desai", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2412", TONES[3]),
  extra("att-saanvi", "Saanvi Iyer", "Ravi Iyer", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2413", TONES[4]),
  extra("att-arnav", "Arnav Reddy", "Deepa Reddy", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2414", TONES[5]),
  extra("att-zara", "Zara Khan", "Farah Khan", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2415", TONES[6]),
  extra("att-dhruv", "Dhruv Malhotra", "Rhea Malhotra", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2416", TONES[7]),
  extra("att-avni", "Avni Sharma", "Rohit Sharma", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2417", TONES[0]),
  extra("att-tara", "Tara Bose", "Mita Bose", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2418", TONES[1]),
  extra("att-neil", "Neil Fernandes", "Lisa Fernandes", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2419", TONES[2]),
  extra("att-pia", "Pia Krishnan", "Anita Krishnan", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2420", TONES[3]),
  extra("att-yash", "Yash Agarwal", "Meenal Agarwal", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2421", TONES[4]),
  extra("att-meera", "Meera Pillai", "Suresh Pillai", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2422", TONES[5]),
  extra("att-rohan", "Rohan Das", "Isha Das", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2423", TONES[6]),
  extra("att-vivaan", "Vivaan Bhat", "Nandini Bhat", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2424", TONES[7]),
  extra("att-aisha", "Aisha Qureshi", "Imran Qureshi", "Nursery A", "ARKA KIDS Koramangala", "Nursery", "AK-N-2425", TONES[0]),
]

function fromChild(child: ChildRecord, index: number): AttendanceChild {
  const { klass, section } = splitClass(child.className)
  const prefix = child.ageBand === "Nursery" ? "N" : child.ageBand === "LKG" ? "L" : child.ageBand === "UKG" ? "U" : "P"
  return {
    ...child,
    admissionNo: `AK-${prefix}-${2400 + index}`,
    initials: initials(child.name),
    tone: TONES[index % TONES.length],
    section,
    klass,
  }
}

export const ATTENDANCE_CHILDREN: AttendanceChild[] = [
  ...CHILDREN.map((child, index) => fromChild(child, index + 1)),
  ...NURSERY_A_EXTRAS,
]

export const CLASS_GROUPS = Array.from(
  new Map(
    ATTENDANCE_CHILDREN.map((child) => [
      child.className,
      { className: child.className, klass: child.klass, section: child.section, branch: child.branch },
    ])
  ).values()
)

export const DEFAULT_SETTINGS: AttendanceSettings = {
  arrivalTime: "09:00",
  teachersCanEdit: true,
  submitDeadline: "10:00",
  notifyAbsent: true,
  notifyLeave: true,
  notifyDailySummary: false,
  channels: ["app"],
}

const HOLIDAYS = new Set(["2026-08-15", "2026-10-02"])

export function todayIso() {
  return "2026-08-24"
}

export function isWorkingDay(date: string) {
  const day = new Date(`${date}T00:00:00`).getDay()
  if (day === 0 || day === 6) return false
  if (HOLIDAYS.has(date)) return false
  return true
}

export function workingDaysInMonth(year: number, month: number) {
  const days: string[] = []
  const last = new Date(year, month, 0).getDate()
  for (let day = 1; day <= last; day += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    if (isWorkingDay(date)) days.push(date)
  }
  return days
}

export function childrenInClass(className: string) {
  return ATTENDANCE_CHILDREN.filter((child) => child.className === className)
}

export function childAttendanceById(id: string) {
  return ATTENDANCE_CHILDREN.find((child) => child.id === id)
}

export function sessionKey(date: string, className: string) {
  return `${date}::${className}`
}

export function findSession(sessions: AttendanceSession[], date: string, className: string) {
  return sessions.find((session) => session.date === date && session.className === className)
}

export function countMarks(marks: ChildMark[]) {
  const present = marks.filter((mark) => mark.status === "present").length
  const absent = marks.filter((mark) => mark.status === "absent").length
  const leave = marks.filter((mark) => mark.status === "leave").length
  const total = marks.length
  const rate = total ? Math.round((present / total) * 100) : 0
  return { total, present, absent, leave, rate }
}

export function coveringLeave(leaves: LeaveRequest[], childId: string, date: string) {
  return leaves.find(
    (leave) =>
      leave.childId === childId &&
      leave.status === "approved" &&
      leave.fromDate <= date &&
      leave.toDate >= date
  )
}

function seedSessions(): AttendanceSession[] {
  const nursery = childrenInClass("Nursery A")
  const days = workingDaysInMonth(2026, 8).filter((date) => date < todayIso())
  return days.map((date, dayIndex) => {
    const marks: ChildMark[] = nursery.map((child, childIndex) => {
      const slot = (dayIndex + childIndex) % 17
      if (child.id === "att-diya" && date === "2026-08-21") {
        return { childId: child.id, status: "leave", remarks: "Approved family leave" }
      }
      if (slot === 0) return { childId: child.id, status: "absent", absenceReason: "Sick", parentInformed: true }
      if (slot === 1 && childIndex % 9 === 0) return { childId: child.id, status: "leave", remarks: "Informed leave" }
      return { childId: child.id, status: "present" }
    })
    return {
      id: `sess-${date}-nursery-a`,
      date,
      className: "Nursery A",
      submitted: true,
      submittedAt: `${date}T09:18:00.000Z`,
      submittedBy: "Classroom Coordinator",
      marks,
    }
  })
}

export const DEFAULT_ATTENDANCE: AttendanceState = {
  settings: DEFAULT_SETTINGS,
  sessions: seedSessions(),
  audits: [
    {
      id: "aud-1",
      date: "2026-08-21",
      className: "Nursery A",
      childId: "att-rahul",
      fromStatus: "absent",
      toStatus: "present",
      changedBy: "Classroom Coordinator",
      changedAt: "2026-08-21T10:32:00.000Z",
      reason: "Student arrived after roll call",
    },
  ],
  notices: [
    {
      id: "nt-1",
      childId: "att-rahul",
      date: "2026-08-21",
      channel: "app",
      title: "Absent notice",
      body: "Dear Parent, Rahul Kumar was marked absent today, 21 August 2026. Please contact the school if this was unexpected.",
      createdAt: "2026-08-21T09:20:00.000Z",
    },
  ],
}

export function loadAttendance(): AttendanceState {
  if (typeof window === "undefined") return DEFAULT_ATTENDANCE
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY)
    if (!raw) return DEFAULT_ATTENDANCE
    const parsed = JSON.parse(raw) as AttendanceState
    return {
      ...DEFAULT_ATTENDANCE,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      sessions: parsed.sessions?.length ? parsed.sessions : DEFAULT_ATTENDANCE.sessions,
    }
  } catch {
    return DEFAULT_ATTENDANCE
  }
}

export function saveAttendance(state: AttendanceState) {
  if (typeof window === "undefined") return
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(state))
}

export function usePreschoolAttendance() {
  const [state, setState] = useState<AttendanceState>(DEFAULT_ATTENDANCE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setState(loadAttendance())
    setReady(true)
  }, [])

  const update = useCallback((patch: Partial<AttendanceState> | ((prev: AttendanceState) => AttendanceState)) => {
    setState((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
      saveAttendance(next)
      return next
    })
  }, [])

  return { state, update, ready }
}

export function studentMonthStats(sessions: AttendanceSession[], childId: string, year: number, month: number) {
  const days = workingDaysInMonth(year, month)
  let present = 0
  let absent = 0
  let leave = 0
  let marked = 0
  const byDate: Record<string, AttendanceStatus> = {}
  days.forEach((date) => {
    const session = sessions.find((item) => item.date === date && item.marks.some((mark) => mark.childId === childId))
    const mark = session?.marks.find((item) => item.childId === childId)
    if (!mark) return
    marked += 1
    byDate[date] = mark.status
    if (mark.status === "present") present += 1
    if (mark.status === "absent") absent += 1
    if (mark.status === "leave") leave += 1
  })
  const rate = marked ? Math.round((present / marked) * 100) : 0
  return { workingDays: days.length, present, absent, leave, marked, rate, byDate, days }
}

export function classMonthStats(sessions: AttendanceSession[], className: string, year: number, month: number) {
  const kids = childrenInClass(className)
  return kids.map((child) => ({
    child,
    ...studentMonthStats(sessions, child.id, year, month),
  }))
}

export function formatLongDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function nowTime() {
  const date = new Date()
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

export const ABSENCE_REASONS: AbsenceReason[] = ["Sick", "Personal", "Family", "No Information", "Other"]

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadReportHtml(title: string, body: string) {
  const html = `<!doctype html><html><head><title>${title}</title>
<style>body{font-family:ui-sans-serif,system-ui;padding:32px;color:#111}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}h1{margin:0 0 12px}</style>
</head><body><h1>ARKA KIDS</h1><h2>${title}</h2>${body}</body></html>`
  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.html`
  link.click()
  URL.revokeObjectURL(url)
}

export function noticeForMark(child: AttendanceChild, date: string, status: AttendanceStatus): AttendanceNotice | null {
  if (status === "present") return null
  const label = formatLongDate(date)
  if (status === "absent") {
    return {
      id: `nt-${child.id}-${date}`,
      childId: child.id,
      date,
      channel: "app",
      title: "Absent notice",
      body: `Dear Parent, ${child.name} was marked absent today, ${label}. Please contact the school if this was unexpected.`,
      createdAt: new Date().toISOString(),
    }
  }
  if (status === "leave") {
    return {
      id: `nt-leave-${child.id}-${date}`,
      childId: child.id,
      date,
      channel: "app",
      title: "Leave confirmation",
      body: `Dear Parent, ${child.name}'s leave for ${label} is recorded.`,
      createdAt: new Date().toISOString(),
    }
  }
  return null
}
