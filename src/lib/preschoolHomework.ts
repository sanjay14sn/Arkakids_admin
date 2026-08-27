import { useCallback, useEffect, useState } from "react"
import { ATTENDANCE_CHILDREN, childrenInClass, todayIso } from "@/lib/preschoolAttendance"
import { CHILDREN, PARENT_CHILD_ID, childById } from "@/lib/preschoolOps"

export const HOMEWORK_KEY = "arka_preschool_homework_v1"

export const HOMEWORK_ACTIVITIES = ["English", "Maths", "Drawing", "Rhymes", "General Activity"] as const
export type HomeworkActivity = (typeof HOMEWORK_ACTIVITIES)[number]

export const HOMEWORK_BATCHES = ["Play Group", "Nursery - A", "LKG - A", "LKG - B", "UKG - A"] as const

export type ParentVisibility = "immediate" | "scheduled"
export type HomeworkStatus = "active" | "completed"

export type HomeworkAttachment = {
  name: string
  kind: "image" | "pdf" | "worksheet"
  src?: string
}

export type HomeworkItem = {
  id: string
  batch: string
  activity: HomeworkActivity
  title: string
  instructions: string
  assignedDate: string
  dueDate: string
  visibility: ParentVisibility
  status: HomeworkStatus
  createdBy: string
  attachment?: HomeworkAttachment
}

export type HomeworkCompletion = {
  id: string
  homeworkId: string
  childId: string
  completedAt: string
  photoSrc?: string
}

export type HomeworkState = {
  items: HomeworkItem[]
  completions: HomeworkCompletion[]
}

export function classToBatch(className: string) {
  if (className === "Playgroup") return "Play Group"
  const match = className.match(/^(.*)\s([A-Z])$/)
  if (match) return `${match[1]} - ${match[2]}`
  return className
}

export function batchToClassName(batch: string) {
  if (batch === "Play Group") return "Playgroup"
  return batch.replace(" - ", " ")
}

export function formatHomeworkDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return iso
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function rosterForBatch(batch: string) {
  const className = batchToClassName(batch)
  const fromAttendance = childrenInClass(className)
  if (fromAttendance.length > 0) return fromAttendance
  const fromChildren = CHILDREN.filter((child) => child.className === className)
  if (fromChildren.length > 0) return fromChildren
  return ATTENDANCE_CHILDREN.filter((child) => classToBatch(child.className) === batch)
}

export function isVisibleToParent(item: HomeworkItem, today = todayIso()) {
  if (item.visibility === "scheduled" && item.assignedDate > today) return false
  return item.assignedDate <= today
}

const NURSERY_IDS = ATTENDANCE_CHILDREN.filter((child) => child.className === "Nursery A").map((child) => child.id)
const PENDING_NURSERY = new Set([PARENT_CHILD_ID, "att-vivaan", "att-aisha", "att-rohan", "att-meera"])

export const DEFAULT_HOMEWORK: HomeworkState = {
  items: [
    {
      id: "hw-letter-a",
      batch: "LKG - A",
      activity: "English",
      title: "Practice Letter A",
      instructions: "Trace letter A and colour the pictures.",
      assignedDate: "2026-08-24",
      dueDate: "2026-08-26",
      visibility: "immediate",
      status: "active",
      createdBy: "Classroom Coordinator",
    },
    {
      id: "hw-animals",
      batch: "Nursery - A",
      activity: "Drawing",
      title: "Colour the Animals",
      instructions: "Colour the animals on the worksheet and name two of them.",
      assignedDate: "2026-08-24",
      dueDate: "2026-08-27",
      visibility: "immediate",
      status: "active",
      createdBy: "Classroom Coordinator",
    },
    {
      id: "hw-count",
      batch: "Nursery - A",
      activity: "Maths",
      title: "Count to 10",
      instructions: "Count objects around the house up to 10 and tell a parent.",
      assignedDate: "2026-08-18",
      dueDate: "2026-08-20",
      visibility: "immediate",
      status: "completed",
      createdBy: "Classroom Coordinator",
    },
    {
      id: "hw-rhymes",
      batch: "UKG - A",
      activity: "Rhymes",
      title: "Monsoon Rhymes",
      instructions: "Practice the monsoon rhyme we sang in circle time.",
      assignedDate: "2026-08-26",
      dueDate: "2026-08-28",
      visibility: "scheduled",
      status: "active",
      createdBy: "Classroom Coordinator",
    },
  ],
  completions: [
    ...NURSERY_IDS.filter((id) => !PENDING_NURSERY.has(id)).map((childId) => ({
      id: `done-animals-${childId}`,
      homeworkId: "hw-animals",
      childId,
      completedAt: "2026-08-24T10:00:00.000Z",
    })),
    ...NURSERY_IDS.map((childId) => ({
      id: `done-count-${childId}`,
      homeworkId: "hw-count",
      childId,
      completedAt: "2026-08-19T09:00:00.000Z",
    })),
  ],
}

export function homeworkStats(item: HomeworkItem, completions: HomeworkCompletion[]) {
  const roster = rosterForBatch(item.batch)
  const doneIds = new Set(
    completions.filter((row) => row.homeworkId === item.id).map((row) => row.childId)
  )
  const completed = roster.filter((child) => doneIds.has(child.id)).length
  const total = roster.length
  const pending = Math.max(0, total - completed)
  return { total, completed, pending }
}

export function dashboardCounts(state: HomeworkState, today = todayIso()) {
  const todayItems = state.items.filter((item) => item.assignedDate === today)
  const upcoming = state.items.filter(
    (item) => item.assignedDate > today || (item.visibility === "scheduled" && item.assignedDate > today)
  )
  const pending = state.items.filter((item) => {
    if (item.assignedDate > today) return false
    if (item.status === "completed") return false
    const stats = homeworkStats(item, state.completions)
    return stats.pending > 0
  })
  const completed = state.items.filter((item) => {
    if (item.status === "completed") return true
    const stats = homeworkStats(item, state.completions)
    return stats.total > 0 && stats.pending === 0 && item.assignedDate <= today
  })
  return {
    today: todayItems.length,
    pending: pending.length,
    completed: completed.length,
    upcoming: upcoming.length,
  }
}

export function parentHomework(state: HomeworkState, childId = PARENT_CHILD_ID, today = todayIso()) {
  const child = childById(childId)
  if (!child) return []
  const batch = classToBatch(child.className)
  return state.items
    .filter((item) => item.batch === batch)
    .filter((item) => isVisibleToParent(item, today))
    .slice()
    .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate) || a.dueDate.localeCompare(b.dueDate))
}

export function loadHomework(): HomeworkState {
  if (typeof window === "undefined") return DEFAULT_HOMEWORK
  try {
    const raw = localStorage.getItem(HOMEWORK_KEY)
    if (!raw) return DEFAULT_HOMEWORK
    const parsed = JSON.parse(raw) as HomeworkState
    return {
      items: Array.isArray(parsed.items) ? parsed.items : DEFAULT_HOMEWORK.items,
      completions: Array.isArray(parsed.completions) ? parsed.completions : DEFAULT_HOMEWORK.completions,
    }
  } catch {
    return DEFAULT_HOMEWORK
  }
}

export function saveHomework(state: HomeworkState) {
  if (typeof window === "undefined") return
  localStorage.setItem(HOMEWORK_KEY, JSON.stringify(state))
}

export function usePreschoolHomework() {
  const [state, setState] = useState<HomeworkState>(DEFAULT_HOMEWORK)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setState(loadHomework())
    setReady(true)
  }, [])

  const update = useCallback((patch: Partial<HomeworkState> | ((prev: HomeworkState) => HomeworkState)) => {
    setState((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
      saveHomework(next)
      return next
    })
  }, [])

  return { state, update, ready }
}
