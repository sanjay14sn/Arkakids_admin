"use client"

import * as React from "react"
import { ClipboardList, Plus, CalendarCheck, Clock, CheckCircle2, Hourglass, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { KPICard } from "@/components/dashboard/KPICard"
import { useStore } from "@/store/useStore"
import { PARENT_CHILD_ID, childById } from "@/lib/preschoolOps"
import { todayIso } from "@/lib/preschoolAttendance"
import { DatePicker } from "@/components/ui/DatePicker"
import { api } from "@/lib/api"
import {
  HOMEWORK_ACTIVITIES,
  dashboardCounts,
  formatHomeworkDate,
  homeworkStats,
  parentHomework,
  rosterForBatch,
  usePreschoolHomework,
  type HomeworkActivity,
  type HomeworkCompletion,
  type HomeworkItem,
  type ParentVisibility,
} from "@/lib/preschoolHomework"

function attachmentKind(file: File): "image" | "pdf" | "worksheet" {
  if (file.type.startsWith("image/")) return "image"
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf"
  return "worksheet"
}

function liveTodayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/** Searchable single-select: type to filter, click to pick. Options are shown as given. */
function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  emptyText,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  emptyText?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const filtered = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div ref={ref} className="relative">
      <Input
        value={open ? query : value}
        placeholder={value || placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        className="h-9 text-xs"
        autoComplete="off"
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">{options.length === 0 ? emptyText || "No options" : "No matches"}</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o)
                  setOpen(false)
                  setQuery("")
                }}
                className={`block w-full px-3 py-2 text-left text-xs hover:bg-muted ${o === value ? "font-bold text-primary" : "text-foreground"}`}
              >
                {o}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function HomeworkPage() {
  const { user, addNotification } = useStore()
  const isParent = user?.role === "student"
  const { state, refetch, ready } = usePreschoolHomework()
  const today = todayIso()
  const liveToday = liveTodayIso()
  const child = childById(PARENT_CHILD_ID)

  const PAGE_SIZE = 10
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [saving, setSaving] = React.useState(false)
  const [detail, setDetail] = React.useState<HomeworkItem | null>(null)
  const [realBatches, setRealBatches] = React.useState<{ id: string; label: string; studentNames: string[] }[]>([])
  const [realStudents, setRealStudents] = React.useState<{ id: string; name: string; parentName: string }[]>([])
  const [batch, setBatch] = React.useState<string>("")

  // Load real class batches + students (same source as Classes & Programs)
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [batchData, studentData] = await Promise.all([
          api.getBatches().catch(() => []),
          api.getStudents().catch(() => []),
        ])
        if (cancelled) return
        const batchList: any[] = Array.isArray(batchData) ? batchData : []
        const studentList: any[] = Array.isArray(studentData) ? studentData : []
        setRealBatches(
          batchList
            .filter((b) => b.status !== "inactive" && b.status !== "completed")
            .map((b) => ({
              id: String(b._id || b.id),
              label: b.section ? `${b.courseName || "Class"} - ${b.section}` : String(b.code || b.courseName || "Batch"),
              studentNames: Array.isArray(b.studentNames) ? b.studentNames : [],
            }))
            .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" }))
        )
        setRealStudents(
          studentList.map((s) => ({
            id: String(s._id || s.id),
            name: String(s.name || ""),
            parentName: String(s.parentName || ""),
          }))
        )
      } catch (err) {
        console.error("Failed to load batches for homework:", err)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Default the selection to the first real batch
  React.useEffect(() => {
    if (!batch && realBatches.length > 0) setBatch(realBatches[0].label)
  }, [batch, realBatches])

  // Roster for a batch label: real enrolled students if the batch exists, else legacy sample roster
  const rosterFor = React.useCallback(
    (label: string) => {
      const real = realBatches.find((b) => b.label === label)
      if (!real) return rosterForBatch(label)
      return realStudents.filter((s) => real.studentNames.includes(s.name)).map((s) => ({ ...s }))
    },
    [realBatches, realStudents]
  )
  const [activity, setActivity] = React.useState<HomeworkActivity>("English")
  const [title, setTitle] = React.useState("")
  const [instructions, setInstructions] = React.useState("")
  const [assignedDate, setAssignedDate] = React.useState(liveToday)
  const [dueDate, setDueDate] = React.useState("")
  const [visibleFrom, setVisibleFrom] = React.useState("")
  const [visibility, setVisibility] = React.useState<ParentVisibility>("immediate")
  const [submittable, setSubmittable] = React.useState(false)
  const [fileName, setFileName] = React.useState("")
  const [fileKind, setFileKind] = React.useState<"image" | "pdf" | "worksheet">("worksheet")
  const [fileSrc, setFileSrc] = React.useState("")
  const [completePhoto, setCompletePhoto] = React.useState<Record<string, string>>({})

  const counts = dashboardCounts(state, today, rosterFor)
  const parentItems = parentHomework(state, PARENT_CHILD_ID, today)
  const todayParent = parentItems.filter((item) => item.assignedDate === today || (item.dueDate >= today && item.status === "active"))
  const totalPages = Math.max(1, Math.ceil(state.items.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedItems = state.items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const paginationStart = state.items.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const paginationEnd = Math.min(safePage * PAGE_SIZE, state.items.length)

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const resetCreate = () => {
    setEditingId(null)
    setBatch(realBatches[0]?.label || "")
    setActivity("English")
    setTitle("")
    setInstructions("")
    setAssignedDate(liveTodayIso())
    setDueDate("")
    setVisibility("immediate")
    setVisibleFrom("")
    setSubmittable(false)
    setFileName("")
    setFileKind("worksheet")
    setFileSrc("")
  }

  const openCreate = () => {
    resetCreate()
    setCreateOpen(true)
  }

  const openEdit = (item: HomeworkItem) => {
    setEditingId(item.id)
    setBatch(item.batch)
    setActivity(item.activity || "English")
    setTitle(item.title)
    setInstructions(item.instructions || "")
    setAssignedDate(item.assignedDate || liveTodayIso())
    setDueDate(item.dueDate || "")
    setVisibility(item.visibility || "immediate")
    setVisibleFrom(item.visibleFrom || "")
    setSubmittable(Boolean(item.submittable))
    setFileName(item.attachment?.name || "")
    setFileKind(item.attachment?.kind || "worksheet")
    setFileSrc(item.attachment?.src || "")
    setCreateOpen(true)
  }

  const dateMin = !editingId || assignedDate >= liveToday ? liveToday : assignedDate
  const dueMin = assignedDate && assignedDate > liveToday ? assignedDate : liveToday

  const assignHomework = async () => {
    if (!batch || !activity.trim() || !title.trim()) return
    if (!assignedDate || !dueDate) {
      addNotification({ title: "Date and Due Date are required", type: "system" })
      return
    }
    if (!editingId && assignedDate < liveToday) {
      addNotification({ title: "Date cannot be in the past", type: "system" })
      return
    }
    if (dueDate < assignedDate) {
      addNotification({ title: "Due Date cannot be before Date", type: "system" })
      return
    }
    if (visibility === "scheduled" && !visibleFrom) return

    const item = {
      tenantId: user?.tenantId || "arka-kids",
      title: title.trim(),
      batch,
      className: batch,
      activity: activity.trim(),
      instructions: instructions.trim(),
      assignedDate,
      dueDate,
      visibility,
      visibleFrom: visibility === "scheduled" ? visibleFrom : undefined,
      submittable,
      status: "active" as const,
      createdBy: user?.name || "Classroom Coordinator",
      attachment: fileName
        ? { name: fileName, kind: fileKind, src: fileSrc || undefined }
        : undefined,
    }

    setSaving(true)
    try {
      if (editingId) {
        await api.updateHomework(editingId, item)
        addNotification({
          title: "Homework updated",
          description: `${item.title} was saved.`,
          type: "system",
        })
      } else {
        await api.createHomework(item)
        addNotification({
          title: "Homework assigned",
          description: `${item.title} is assigned to ${item.batch}.`,
          type: "system",
        })
      }
      refetch()
      resetCreate()
      setCreateOpen(false)
    } catch (err) {
      console.error(err)
      addNotification({
        title: "Error",
        description: editingId ? "Failed to update homework" : "Failed to assign homework",
        type: "system",
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteHomework = async (item: HomeworkItem) => {
    if (!window.confirm(`Delete homework "${item.title}"? Parents will no longer see it.`)) return
    try {
      await api.deleteHomework(item.id)
      if (detail?.id === item.id) setDetail(null)
      refetch()
      addNotification({
        title: "Homework deleted",
        description: `${item.title} was removed.`,
        type: "system",
      })
    } catch (err) {
      console.error(err)
      addNotification({ title: "Error", description: "Failed to delete homework", type: "system" })
    }
  }

  const markCompleted = async (homeworkId: string) => {
    const already = state.completions.some(
      (row) => row.homeworkId === homeworkId && row.childId === PARENT_CHILD_ID
    )
    if (already) return
    
    try {
      await api.submitHomework(homeworkId, {
        studentId: PARENT_CHILD_ID,
        studentName: child?.name || "Student",
        fileUrl: completePhoto[homeworkId]
      })
      refetch()
      addNotification({
        title: "Homework completed",
        description: "Marked as completed for your child.",
        type: "system",
      })
    } catch (err) {
      console.error(err)
      addNotification({ title: "Error", description: "Failed to submit homework", type: "system" })
    }
  }

  if (!ready) {
    return <p className="text-xs text-muted-foreground py-16 text-center">Loading homework...</p>
  }

  if (isParent) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Homework</p>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 mt-1">
            <ClipboardList className="h-6 w-6 text-primary" />
            Today&apos;s Homework
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Activities for {child?.name} · {child?.className}
          </p>
        </div>

        {todayParent.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No homework for today.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayParent.map((item) => {
              const done = state.completions.find(
                (row) => row.homeworkId === item.id && row.childId === PARENT_CHILD_ID
              )
              return (
                <Card key={item.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-foreground">📝 {item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.batch} · {item.activity}
                        </p>
                      </div>
                      <Badge variant={done ? "success" : "secondary"}>
                        {done ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                    {item.instructions ? (
                      <p className="text-sm leading-relaxed">{item.instructions}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">Due: {formatHomeworkDate(item.dueDate)}</p>
                    {item.attachment?.src && item.attachment.kind === "image" ? (
                      <img
                        src={item.attachment.src}
                        alt={item.attachment.name}
                        className="h-28 w-40 rounded-lg object-cover border border-border"
                      />
                    ) : item.attachment ? (
                      <p className="text-xs text-muted-foreground">Attachment: {item.attachment.name}</p>
                    ) : null}
                    {!done && (
                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Upload a photo (optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setCompletePhoto((prev) => ({ ...prev, [item.id]: URL.createObjectURL(file) }))
                          }}
                        />
                        {completePhoto[item.id] ? (
                          <img
                            src={completePhoto[item.id]}
                            alt="Completed activity"
                            className="h-24 w-32 rounded-lg object-cover border border-border"
                          />
                        ) : null}
                        <Button size="sm" onClick={() => markCompleted(item.id)}>
                          Mark as Completed
                        </Button>
                      </div>
                    )}
                    {done?.photoSrc ? (
                      <img
                        src={done.photoSrc}
                        alt="Submitted activity"
                        className="h-24 w-32 rounded-lg object-cover border border-border"
                      />
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Homework</p>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 mt-1">
            <ClipboardList className="h-6 w-6 text-primary" />
            Homework
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Assign class activities and track what parents have completed.
          </p>
        </div>
        <Button size="sm" icon={Plus} onClick={openCreate}>
          Create Homework
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Assigned today" value={counts.today} subtext="Sent to a class today" icon={CalendarCheck} delay={0.05} />
        <KPICard title="Pending" value={counts.pending} subtext="Waiting on parents" icon={Hourglass} delay={0.1} />
        <KPICard title="Completed" value={counts.completed} subtext="All children done" icon={CheckCircle2} delay={0.15} />
        <KPICard title="Upcoming" value={counts.upcoming} subtext="Scheduled for later" icon={Clock} delay={0.2} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold">Homework</h2>
        {state.items.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No homework yet. Create the first activity for a class batch.
            </CardContent>
          </Card>
        ) : (
          <>
            {pagedItems.map((item) => {
              const stats = homeworkStats(item, state.completions, rosterFor)
              return (
                <div
                  key={item.id}
                  className="w-full text-left rounded-xl border border-border bg-card px-4 py-3.5 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setDetail(item)}>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{item.title}</p>
                        {item.submittable ? (
                          <Badge variant="secondary" className="text-[10px]">Parents upload</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.batch} • {item.activity}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Assigned: {formatHomeworkDate(item.assignedDate)} • Due: {formatHomeworkDate(item.dueDate)}
                      </p>
                    </button>
                    <div className="flex items-center shrink-0 gap-0.5">
                      <Badge variant={item.status === "completed" ? "secondary" : "success"}>
                        {item.status === "completed" ? "Completed" : "Active"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(item)}
                        aria-label="Edit homework"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteHomework(item)}
                        aria-label="Delete homework"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <button type="button" className="w-full text-left" onClick={() => setDetail(item)}>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {stats.total} students · {stats.completed} completed · {stats.pending} pending
                    </p>
                  </button>
                </div>
              )
            })}
            {state.items.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-2">
                <div className="text-[11px] text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{paginationStart}</span> to{" "}
                  <span className="font-semibold text-foreground">{paginationEnd}</span> of{" "}
                  <span className="font-semibold text-foreground">{state.items.length}</span> homework
                  <span className="text-muted-foreground/80"> · {PAGE_SIZE} per page</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronLeft}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={safePage === 1}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-medium text-foreground px-1">
                    Page {safePage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={safePage === totalPages}
                    className="h-8 text-xs"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        isOpen={createOpen}
        onClose={() => !saving && (setCreateOpen(false), resetCreate())}
        title={editingId ? "Edit Homework" : "Create Homework"}
        description={editingId ? "Update this class activity." : "Assign an activity to a class batch."}
        className="max-w-xl"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Class / Batch *</label>
            <SearchableSelect
              value={batch}
              onChange={setBatch}
              options={realBatches.map((b) => b.label)}
              placeholder="Search class / batch"
              emptyText="No class batches found"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Activity *</label>
            <Input
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              list="homework-activity-suggestions"
              placeholder="Type an activity, e.g. English, Maths, Drawing"
              className="h-9 text-xs"
              required
            />
            <datalist id="homework-activity-suggestions">
              {HOMEWORK_ACTIVITIES.map((item) => (
                <option key={`activity-${item}`} value={item} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-xs" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full min-h-20 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Date *</label>
              <Input
                type="date"
                value={assignedDate}
                min={dateMin}
                onChange={(e) => {
                  const next = e.target.value
                  setAssignedDate(next)
                  if (dueDate && next && dueDate < next) setDueDate("")
                }}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Due Date *</label>
              <Input
                type="date"
                value={dueDate}
                min={assignedDate && assignedDate > dueMin ? assignedDate : dueMin}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Parent Visibility</label>
            <Select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as ParentVisibility)}
              className="h-9 text-xs"
            >
              <option value="immediate">Immediately</option>
              <option value="scheduled">Scheduled</option>
            </Select>
          </div>
          {visibility === "scheduled" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Show to parents on *</label>
              <DatePicker
                value={visibleFrom}
                onChange={setVisibleFrom}
                min={liveToday}
                placeholder="Select date"
                className="text-xs"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setSubmittable((v) => !v)}
            className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left ${
              submittable ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                submittable ? "border-primary bg-primary text-white" : "border-border-strong bg-card"
              }`}
            >
              {submittable ? "✓" : ""}
            </span>
            <span>
              <span className="block text-xs font-semibold text-foreground">Submittable activity</span>
              <span className="block text-[11px] text-muted-foreground mt-0.5">
                Parents will see an Upload homework button in the mobile app.
              </span>
            </span>
          </button>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Attachment</label>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) {
                  setFileName("")
                  setFileSrc("")
                  return
                }
                setFileName(file.name)
                setFileKind(attachmentKind(file))
                setFileSrc(URL.createObjectURL(file))
              }}
            />
            {fileName ? <p className="text-[11px] text-muted-foreground">{fileName}</p> : null}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => (setCreateOpen(false), resetCreate())} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={assignHomework} isLoading={saving} disabled={!title.trim() || !batch || !activity.trim() || !assignedDate || !dueDate || (visibility === "scheduled" && !visibleFrom)}>
              {editingId ? "Save changes" : "Assign Homework"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.title || "Homework"}
        description={detail ? `${detail.batch} • ${detail.activity}` : ""}
        className="max-w-lg"
      >
        {detail ? (
          <TeacherHomeworkDetail
            item={detail}
            completions={state.completions}
            roster={rosterFor(detail.batch)}
            onEdit={() => {
              setDetail(null)
              openEdit(detail)
            }}
            onDelete={() => deleteHomework(detail)}
          />
        ) : null}
      </Dialog>
    </div>
  )
}

function TeacherHomeworkDetail({
  item,
  completions,
  roster,
  onEdit,
  onDelete,
}: {
  item: HomeworkItem
  completions: HomeworkCompletion[]
  roster: { id: string; name: string; parentName?: string }[]
  onEdit?: () => void
  onDelete?: () => void
}) {
  const stats = homeworkStats(item, completions, () => roster)
  const doneIds = new Set(completions.filter((row) => row.homeworkId === item.id).map((row) => row.childId))

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" icon={Pencil} onClick={onEdit}>Edit</Button>
        <Button variant="destructive" size="sm" icon={Trash2} onClick={onDelete}>Delete</Button>
      </div>
      <p className="text-sm text-muted-foreground">{item.instructions}</p>
      <p className="text-xs text-muted-foreground">
        Assigned {formatHomeworkDate(item.assignedDate)} · Due {formatHomeworkDate(item.dueDate)}
        {item.submittable ? " · Parents can upload a photo" : ""}
      </p>
      <div className="rounded-xl border border-border p-4 space-y-2">
        <p className="text-sm font-bold">{stats.total} Students</p>
        <p className="text-sm">🟢 Completed: {stats.completed}</p>
        <p className="text-sm">🟡 Pending: {stats.pending}</p>
      </div>
      <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border/60">
        {roster.map((child) => {
          const done = doneIds.has(child.id)
          return (
            <div key={`hw-child-${item.id}-${child.id}`} className="flex items-center justify-between px-3 py-2">
              <div>
                <p className="text-xs font-semibold">{child.name}</p>
                <p className="text-[10px] text-muted-foreground">{child.parentName}</p>
              </div>
              <Badge variant={done ? "success" : "outline"} className="text-[10px]">
                {done ? "Completed" : "Pending"}
              </Badge>
            </div>
          )
        })}
      </div>
    </div>
  )
}
