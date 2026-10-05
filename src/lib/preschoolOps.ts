import { useCallback, useEffect, useState } from "react"

export const PRESCHOOL_OPS_KEY = "arka_preschool_ops_v1"

export const BRANCHES = [
  "ARKA KIDS Koramangala",
  "ARKA KIDS Whitefield",
  "ARKA KIDS Indiranagar",
] as const

export const CLASSES = ["Playgroup", "Nursery A", "LKG A", "LKG B", "UKG A"] as const

export type ChildRecord = {
  id: string
  name: string
  parentName: string
  className: string
  branch: string
  ageBand: "Playgroup" | "Nursery" | "LKG" | "UKG"
}

export const CHILDREN: ChildRecord[] = [
  { id: "child-aanya", name: "Aanya Sharma", parentName: "Neha Sharma", className: "Nursery A", branch: "ARKA KIDS Koramangala", ageBand: "Nursery" },
  { id: "child-vihaan", name: "Vihaan Reddy", parentName: "Kiran Reddy", className: "LKG B", branch: "ARKA KIDS Whitefield", ageBand: "LKG" },
  { id: "child-mira", name: "Mira Iyer", parentName: "Anjali Iyer", className: "UKG A", branch: "ARKA KIDS Koramangala", ageBand: "UKG" },
  { id: "child-arjun", name: "Arjun Menon", parentName: "Priya Menon", className: "Playgroup", branch: "ARKA KIDS Indiranagar", ageBand: "Playgroup" },
  { id: "child-sara", name: "Sara Khan", parentName: "Imran Khan", className: "LKG A", branch: "ARKA KIDS Whitefield", ageBand: "LKG" },
]

export const PARENT_CHILD_ID = "child-aanya"

export type JournalMedia = { id: string; kind: "photo" | "video"; label: string; tone: string; src?: string }
export type JournalEntry = {
  id: string
  date: string
  className: string
  branch: string
  author: string
  note: string
  tags: string[]
  media: JournalMedia[]
}

export type LeaveStatus = "pending" | "approved" | "rejected"
export type LeaveRequest = {
  id: string
  childId: string
  fromDate: string
  toDate: string
  reason: string
  status: LeaveStatus
  requestedBy: string
  decidedBy?: string
  createdAt: string
}

export type SkillLevel = "emerging" | "developing" | "secure"
export type AssessmentDomain = {
  key: "communication" | "motor" | "cognitive" | "social" | "participation"
  label: string
  level: SkillLevel
}
export type AssessmentReport = {
  id: string
  childId: string
  term: "Term 1" | "Term 2" | "Term 3"
  date: string
  teacher: string
  remarks: string
  domains: AssessmentDomain[]
}

export type CalendarKind = "holiday" | "event" | "ptm" | "annual_day" | "assessment" | "special"
export type CalendarEvent = {
  id: string
  date: string
  title: string
  kind: CalendarKind
  branch: string
  detail: string
}

export const DOCUMENT_TYPES = [
  { key: "birth_certificate", label: "Birth certificate" },
  { key: "aadhaar", label: "Aadhaar" },
  { key: "parent_id", label: "Parent ID" },
  { key: "child_photo", label: "Child photo" },
  { key: "medical_form", label: "Medical form" },
] as const

export type DocumentTypeKey = (typeof DOCUMENT_TYPES)[number]["key"]
export type ChildDocument = {
  id: string
  childId: string
  type: DocumentTypeKey
  fileName?: string
  uploadedAt?: string
  status: "missing" | "uploaded" | "verified"
}

export type TransferStatus = "pending" | "approved" | "rejected"
export type BranchTransfer = {
  id: string
  childId: string
  fromBranch: string
  toBranch: string
  toClass: string
  reason: string
  status: TransferStatus
  requestedBy: string
  createdAt: string
}

export type WeeklyOffRule = "sun" | "sat_sun" | "none"

/** Today's (or any Date's) calendar date in the user's LOCAL timezone as YYYY-MM-DD. */
export function localIsoDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export type PreschoolOpsState = {
  journals: JournalEntry[]
  leaves: LeaveRequest[]
  assessments: AssessmentReport[]
  events: CalendarEvent[]
  documents: ChildDocument[]
  transfers: BranchTransfer[]
  weeklyOffRule?: WeeklyOffRule
}

/** Returns the weekly-off day numbers (0 = Sunday) for a rule. */
export function weeklyOffDays(rule: WeeklyOffRule = "sun"): number[] {
  return rule === "sun" ? [0] : rule === "sat_sun" ? [0, 6] : []
}

/**
 * Why school is closed on `iso` (YYYY-MM-DD), or "" if it is a working day.
 * A holiday event applies if it targets all branches or the given branch/name.
 */
export function closureReason(
  state: Pick<PreschoolOpsState, "events" | "weeklyOffRule">,
  iso: string,
  branch?: string
): string {
  if (!iso) return ""
  const holiday = state.events.find(
    (e) =>
      e.date === iso &&
      e.kind === "holiday" &&
      (e.branch === "All branches" || (!!branch && e.branch === branch))
  )
  if (holiday) return `Holiday: ${holiday.title}`
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return ""
  const dow = new Date(y, m - 1, d).getDay()
  if (weeklyOffDays(state.weeklyOffRule ?? "sun").includes(dow)) {
    return dow === 0 ? "Weekly Off (Sunday)" : "Weekly Off (Saturday)"
  }
  return ""
}

const DOMAIN_LABELS: AssessmentDomain[] = [
  { key: "communication", label: "Communication", level: "developing" },
  { key: "motor", label: "Motor skills", level: "developing" },
  { key: "cognitive", label: "Cognitive development", level: "developing" },
  { key: "social", label: "Social behaviour", level: "developing" },
  { key: "participation", label: "Activity participation", level: "developing" },
]

function seedDocuments(): ChildDocument[] {
  return CHILDREN.flatMap((child, childIndex) =>
    DOCUMENT_TYPES.map((doc, docIndex) => {
      const uploaded = childIndex === 0 || docIndex < 3
      const verified = childIndex === 0 && docIndex < 2
      return {
        id: `doc-${child.id}-${doc.key}`,
        childId: child.id,
        type: doc.key,
        status: verified ? "verified" : uploaded ? "uploaded" : "missing",
        fileName: uploaded ? `${doc.key}-${child.name.split(" ")[0].toLowerCase()}.pdf` : undefined,
        uploadedAt: uploaded ? "2026-06-14T09:00:00.000Z" : undefined,
      }
    })
  )
}

export const DEFAULT_OPS: PreschoolOpsState = {
  journals: [
    {
      id: "j-1",
      date: "2026-08-24",
      className: "Nursery A",
      branch: "ARKA KIDS Koramangala",
      author: "Classroom Coordinator",
      note: "Circle time with monsoon rhymes, fruit snack, and outdoor play in the sand pit.",
      tags: ["circle time", "snack", "outdoor play"],
      media: [
        { id: "m1", kind: "photo", label: "Circle time", tone: "from-amber-200 to-orange-300", src: "https://res.cloudinary.com/dn98ovhm7/image/upload/v1790830239/arka_kids/daily_journal/journal-circle-time.png" },
        { id: "m2", kind: "photo", label: "Snack table", tone: "from-lime-200 to-emerald-300", src: "https://res.cloudinary.com/dn98ovhm7/image/upload/v1790830254/arka_kids/daily_journal/journal-snack-table.png" },
        { id: "m3", kind: "video", label: "Outdoor play", tone: "from-sky-200 to-indigo-300", src: "https://res.cloudinary.com/dn98ovhm7/image/upload/v1790830252/arka_kids/daily_journal/journal-outdoor-play.png" },
      ],
    },
    {
      id: "j-2",
      date: "2026-08-22",
      className: "LKG B",
      branch: "ARKA KIDS Whitefield",
      author: "Classroom Coordinator",
      note: "Number matching trays indoors, then water play. Quiet time with picture books.",
      tags: ["learning", "water play", "story"],
      media: [
        { id: "m4", kind: "photo", label: "Number trays", tone: "from-violet-200 to-fuchsia-300", src: "https://res.cloudinary.com/dn98ovhm7/image/upload/v1790830249/arka_kids/daily_journal/journal-number-trays.png" },
        { id: "m5", kind: "photo", label: "Story corner", tone: "from-rose-200 to-pink-300", src: "https://res.cloudinary.com/dn98ovhm7/image/upload/v1790830258/arka_kids/daily_journal/journal-story-corner.png" },
      ],
    },
    {
      id: "j-3",
      date: "2026-08-21",
      className: "UKG A",
      branch: "ARKA KIDS Koramangala",
      author: "Classroom Coordinator",
      note: "Independence Day craft, group song practice, and garden walk.",
      tags: ["craft", "music", "garden"],
      media: [
        { id: "m6", kind: "photo", label: "Flag craft", tone: "from-orange-200 to-amber-300", src: "https://res.cloudinary.com/dn98ovhm7/image/upload/v1790830242/arka_kids/daily_journal/journal-flag-craft.png" },
        { id: "m7", kind: "video", label: "Group song", tone: "from-teal-200 to-cyan-300", src: "https://res.cloudinary.com/dn98ovhm7/image/upload/v1790830246/arka_kids/daily_journal/journal-group-song.png" },
      ],
    },
  ],
  leaves: [
    {
      id: "lv-1",
      childId: "child-aanya",
      fromDate: "2026-08-26",
      toDate: "2026-08-27",
      reason: "Family function in Mysuru.",
      status: "pending",
      requestedBy: "Neha Sharma",
      createdAt: "2026-08-23T08:10:00.000Z",
    },
    {
      id: "lv-2",
      childId: "child-vihaan",
      fromDate: "2026-08-20",
      toDate: "2026-08-20",
      reason: "Mild fever. Doctor advised rest.",
      status: "approved",
      requestedBy: "Kiran Reddy",
      decidedBy: "Classroom Coordinator",
      createdAt: "2026-08-19T11:00:00.000Z",
    },
    {
      id: "lv-3",
      childId: "child-arjun",
      fromDate: "2026-08-18",
      toDate: "2026-08-19",
      reason: "Travel with grandparents.",
      status: "rejected",
      requestedBy: "Priya Menon",
      decidedBy: "Classroom Coordinator",
      createdAt: "2026-08-17T09:40:00.000Z",
    },
    {
      id: "lv-4",
      childId: "att-diya",
      fromDate: "2026-08-24",
      toDate: "2026-08-24",
      reason: "Family travel.",
      status: "approved",
      requestedBy: "Ritu Kumar",
      decidedBy: "Classroom Coordinator",
      createdAt: "2026-08-23T16:00:00.000Z",
    },
  ],
  assessments: [
    {
      id: "as-1",
      childId: "child-aanya",
      term: "Term 1",
      date: "2026-08-10",
      teacher: "Classroom Coordinator",
      remarks: "Aanya settles quickly at circle time and is beginning to share toys. Fine-motor work with crayons is improving.",
      domains: [
        { key: "communication", label: "Communication", level: "developing" },
        { key: "motor", label: "Motor skills", level: "developing" },
        { key: "cognitive", label: "Cognitive development", level: "secure" },
        { key: "social", label: "Social behaviour", level: "emerging" },
        { key: "participation", label: "Activity participation", level: "secure" },
      ],
    },
    {
      id: "as-2",
      childId: "child-mira",
      term: "Term 1",
      date: "2026-08-08",
      teacher: "Classroom Coordinator",
      remarks: "Mira leads group songs and helps younger peers during tidy-up.",
      domains: DOMAIN_LABELS.map((d) => ({ ...d, level: d.key === "social" ? "secure" : "developing" })),
    },
  ],
  events: [
    { id: "ev-1", date: "2026-08-15", title: "Independence Day", kind: "holiday", branch: "All branches", detail: "School closed. Flag assembly at 8:30 AM for those attending the celebration." },
    { id: "ev-2", date: "2026-08-28", title: "Parent–Teacher Meeting", kind: "ptm", branch: "ARKA KIDS Koramangala", detail: "Nursery and UKG slots from 9:00 AM to 1:00 PM." },
    { id: "ev-3", date: "2026-09-05", title: "Teacher’s Day", kind: "event", branch: "All branches", detail: "Special assembly and class performances." },
    { id: "ev-4", date: "2026-09-12", title: "Term 1 assessments", kind: "assessment", branch: "All branches", detail: "Observation checklists close for Term 1." },
    { id: "ev-5", date: "2026-10-02", title: "Gandhi Jayanti", kind: "holiday", branch: "All branches", detail: "School closed." },
    { id: "ev-6", date: "2026-12-19", title: "Annual Day", kind: "annual_day", branch: "ARKA KIDS Whitefield", detail: "Costume rehearsal in the morning; performance at 4:00 PM." },
    { id: "ev-7", date: "2026-08-29", title: "Farm visit", kind: "special", branch: "ARKA KIDS Indiranagar", detail: "Playgroup outdoor learning trip. Consent already collected." },
  ],
  documents: seedDocuments(),
  transfers: [
    {
      id: "tr-1",
      childId: "child-sara",
      fromBranch: "ARKA KIDS Whitefield",
      toBranch: "ARKA KIDS Koramangala",
      toClass: "LKG A",
      reason: "Family moved closer to Koramangala.",
      status: "pending",
      requestedBy: "Franchise Owner",
      createdAt: "2026-08-21T10:00:00.000Z",
    },
  ],
}

export const SKILL_LEVELS: { id: SkillLevel; label: string }[] = [
  { id: "emerging", label: "Emerging" },
  { id: "developing", label: "Developing" },
  { id: "secure", label: "Secure" },
]

export function emptyDomains(): AssessmentDomain[] {
  return DOMAIN_LABELS.map((d) => ({ ...d }))
}

export function childById(id: string) {
  return CHILDREN.find((child) => child.id === id)
}

function hydrateJournalMedia(state: PreschoolOpsState): PreschoolOpsState {
  const srcById = new Map(
    DEFAULT_OPS.journals.flatMap((entry) => entry.media).map((item) => [item.id, item.src])
  )
  return {
    ...state,
    journals: state.journals.map((entry) => ({
      ...entry,
      media: entry.media.map((item) => ({
        ...item,
        src: item.src || srcById.get(item.id),
      })),
    })),
  }
}

export function loadPreschoolOps(): PreschoolOpsState {
  if (typeof window === "undefined") return DEFAULT_OPS
  try {
    const raw = localStorage.getItem(PRESCHOOL_OPS_KEY)
    if (!raw) return DEFAULT_OPS
    return hydrateJournalMedia({ ...DEFAULT_OPS, ...JSON.parse(raw) } as PreschoolOpsState)
  } catch {
    return DEFAULT_OPS
  }
}

export function savePreschoolOps(state: PreschoolOpsState) {
  if (typeof window === "undefined") return
  localStorage.setItem(PRESCHOOL_OPS_KEY, JSON.stringify(state))
}

export function usePreschoolOps() {
  const [state, setState] = useState<PreschoolOpsState>(DEFAULT_OPS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setState(loadPreschoolOps())
    setReady(true)
  }, [])

  const update = useCallback((patch: Partial<PreschoolOpsState> | ((prev: PreschoolOpsState) => PreschoolOpsState)) => {
    setState((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
      savePreschoolOps(next)
      return next
    })
  }, [])

  return { state, update, ready }
}

export function parentChildFilter<T extends { childId?: string; className?: string }>(
  items: T[],
  isParent: boolean
) {
  if (!isParent) return items
  const child = childById(PARENT_CHILD_ID)
  return items.filter((item) => {
    if ("childId" in item && item.childId) return item.childId === PARENT_CHILD_ID
    if ("className" in item && item.className) return item.className === child?.className
    return true
  })
}
