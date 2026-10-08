"use client"

import * as React from "react"
import {
  CalendarCheck, Users, UserX, CalendarOff, Percent, History, ClipboardList,
  BarChart3, Settings, Lock, Download, Bell, Check, Unlock, X, Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { DatePicker } from "@/components/ui/DatePicker"
import { KPICard } from "@/components/dashboard/KPICard"
import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import {
  ABSENCE_REASONS,
  downloadCsv,
  formatLongDate,
  nowTime,
  type AbsenceReason,
  type AttendanceStatus,
} from "@/lib/preschoolAttendance"
import { usePreschoolOps, closureReason, localIsoDate } from "@/lib/preschoolOps"

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "today" | "take" | "history" | "student" | "reports" | "settings"

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Overview" },
  { id: "take", label: "Take Attendance" },
  { id: "history", label: "History" },
  { id: "student", label: "Student" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
]

interface StudentRecord {
  id: string
  name: string
  parentName?: string
  batch?: string    // batchId
  batchName?: string
  courseName?: string
}

interface ChildMark {
  entityId: string
  name: string
  status: AttendanceStatus
  note?: string
  absenceReason?: string
  parentInformed?: boolean
  arrivalTime?: string
}

interface AttendanceSession {
  _id?: string
  date: string
  className: string
  batchId?: string
  submitted: boolean
  submittedBy?: string
  submittedAt?: string
  records: ChildMark[]
}

interface BatchGroup {
  id: string
  name: string        // display: "Toddler Program - A"
  courseName: string
  section: string
  students: StudentRecord[]
}

function todayIso() {
  return localIsoDate()
}

function formatDateDDMMYYYY(dateStr: string) {
  if (!dateStr) return dateStr
  const parts = dateStr.split("-")
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`
  }
  return dateStr
}

function countMarks(records: ChildMark[]) {
  const present = records.filter(r => r.status === "present").length
  const absent = records.filter(r => r.status === "absent").length
  const leave = records.filter(r => r.status === "leave").length
  const total = records.length
  const rate = total ? Math.round((present / total) * 100) : 0
  return { total, present, absent, leave, rate }
}

function statusBadge(status: AttendanceStatus) {
  if (status === "present") return <Badge variant="success">Present</Badge>
  if (status === "absent") return <Badge variant="destructive">Absent</Badge>
  if (status === "leave") return <Badge variant="warning">Leave</Badge>
  return null
}

function statusIcon(status: AttendanceStatus) {
  if (status === "present") return <Check className="h-3.5 w-3.5 mr-1.5" />
  if (status === "absent") return <X className="h-3.5 w-3.5 mr-1.5" />
  if (status === "leave") return <CalendarOff className="h-3.5 w-3.5 mr-1.5" />
  return null
}

function statusStyle(status: AttendanceStatus, active: boolean) {
  const map: Record<AttendanceStatus, string> = {
    present: active ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-transparent border-transparent text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700",
    absent: active ? "bg-rose-500 text-white border-rose-500 shadow-sm" : "bg-transparent border-transparent text-muted-foreground hover:bg-rose-50 hover:text-rose-700",
    leave: active ? "bg-amber-500 text-white border-amber-500 shadow-sm" : "bg-transparent border-transparent text-muted-foreground hover:bg-amber-50 hover:text-amber-700",
  }
  return map[status] || ""
}

const VISIBLE_STATUSES: AttendanceStatus[] = ["present", "absent", "leave"]

function dateKey(value?: string) {
  return String(value || "").slice(0, 10)
}

function findApprovedLeave(leaves: any[], student: { id?: string; entityId?: string; name?: string }, date: string) {
  const day = dateKey(date)
  const studentId = String(student.id || student.entityId || "")
  const studentName = String(student.name || "").trim().toLowerCase()
  return leaves.find((l) => {
    if (String(l.status || "").toLowerCase() !== "approved") return false
    const from = dateKey(l.fromDate)
    const to = dateKey(l.toDate || l.fromDate)
    if (!from || day < from || day > to) return false
    if (studentId && String(l.childId || "") === studentId) return true
    const leaveName = String(l.childName || l.studentName || "").trim().toLowerCase()
    return Boolean(studentName && leaveName && studentName === leaveName)
  })
}

// ─── Main Module ──────────────────────────────────────────────────────────────
export function AttendanceModule() {
  const { user, activeTenant, addNotification } = useStore()
  const myBranchName = String(activeTenant?.name ?? user?.tenantId ?? "").trim()
  const [tab, setTab] = React.useState<Tab>("today")
  const { state: opsState } = usePreschoolOps()

  // Real data from DB
  const [batches, setBatches] = React.useState<BatchGroup[]>([])
  const [sessions, setSessions] = React.useState<AttendanceSession[]>([])
  const [leaves, setLeaves] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Overview (Today) state
  const [viewDate, setViewDate] = React.useState(todayIso())

  // Take Attendance state
  const [selectedBatchId, setSelectedBatchId] = React.useState<string>("")
  const [takeDate, setTakeDate] = React.useState(todayIso())
  const [marks, setMarks] = React.useState<ChildMark[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editReason, setEditReason] = React.useState("")
  const [successMsg, setSuccessMsg] = React.useState("")

  // History filters
  const [historyFromDate, setHistoryFromDate] = React.useState("")
  const [historyToDate, setHistoryToDate] = React.useState("")
  const [historyBatch, setHistoryBatch] = React.useState("all")
  const [historyStatus, setHistoryStatus] = React.useState("all")
  const [historyPage, setHistoryPage] = React.useState(1)

  // Student tab
  const [studentId, setStudentId] = React.useState("")

  // Settings
  const [notifyAbsent, setNotifyAbsent] = React.useState(true)

  const role = user?.role
  const canTake = role === "trainer" || role === "owner" || role === "super_admin"
  const canSettings = role === "owner" || role === "super_admin"
  const canCorrect = role === "owner" || role === "super_admin"

  const tabs = TABS.filter(t => {
    if (!canSettings && t.id === "settings") return false
    return true
  })

  // ─── Load data ─────────────────────────────────────────────────────────────
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [studentsData, batchesData, attendanceData, leavesData] = await Promise.all([
        api.getStudents(),
        api.getBatches(),
        api.getStudentAttendance(),
        api.getChildLeaves().catch(() => []),
      ])

      const studentList: any[] = Array.isArray(studentsData) ? studentsData : []
      const batchList: any[] = Array.isArray(batchesData) ? batchesData : []

      // Build batch groups with students
      // Batches link to students via batch.studentNames (array of student names)
      const groups: BatchGroup[] = batchList
        .filter((b: any) => b.status !== "inactive")
        .map((b: any) => {
          const bId = b._id || b.id
          const studentNames: string[] = b.studentNames || []
          const batchStudents = studentList
            .filter((s: any) => studentNames.includes(s.name))
            .map((s: any) => ({
              id: s._id || s.id,
              name: s.name,
              parentName: s.parentName,
              batch: bId,
              batchName: `${b.courseName || "Batch"} — ${b.section || b.code || "A"}`,
              courseName: b.courseName || "",
            }))

          return {
            id: bId,
            name: `${b.courseName || "Batch"} — ${b.section || b.code || "A"}`,
            courseName: b.courseName || "",
            section: b.section || "",
            students: batchStudents,
          }
        })
        .filter(g => g.students.length > 0)

      setBatches(groups)
      if (groups.length > 0) {
        setSelectedBatchId(prev => prev || groups[0].id)
      }

      // Normalise sessions from DB
      const dbSessions: AttendanceSession[] = Array.isArray(attendanceData)
        ? attendanceData.map((a: any) => ({
            _id: a._id,
            date: a.date,
            className: a.className || "",
            batchId: a.batchId || "",
            submitted: a.submitted || false,
            submittedBy: a.submittedBy || "",
            submittedAt: a.submittedAt || "",
            records: (a.records || []).map((r: any) => ({
              entityId: r.entityId,
              name: r.name,
              status: r.status,
              note: r.note,
              absenceReason: r.absenceReason,
              parentInformed: r.parentInformed,
              arrivalTime: r.arrivalTime,
            })),
          }))
        : []

      setSessions(dbSessions)
      
      const leavesList = Array.isArray(leavesData) ? leavesData : (leavesData?.leaves ?? leavesData?.data ?? [])
      setLeaves(leavesList)
    } catch (err) {
      console.error("Failed to load attendance data", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { void loadData() }, [])

  // ─── Current session for take-attendance ───────────────────────────────────
  const selectedBatch = batches.find(b => b.id === selectedBatchId)
  const currentSession = sessions.find(
    s => s.date === takeDate && s.batchId === selectedBatchId
  )
  const locked = Boolean(currentSession?.submitted)
  // School closed (holiday / weekly off) on the selected date → no attendance
  const takeClosure = closureReason(opsState, takeDate, myBranchName)
  const viewClosure = closureReason(opsState, viewDate, myBranchName)
  const isClosed = Boolean(takeClosure)

  React.useEffect(() => {
    if (!selectedBatch) return
    const withLeave = (row: { entityId: string; name: string; status?: AttendanceStatus; note?: string; absenceReason?: string; parentInformed?: boolean; arrivalTime?: string }) => {
      const approvedLeave = findApprovedLeave(leaves, { id: row.entityId, name: row.name }, takeDate)
      if (!approvedLeave) return { ...row, status: (row.status || "present") as AttendanceStatus }
      return {
        ...row,
        status: "leave" as AttendanceStatus,
        absenceReason: approvedLeave.reason || row.absenceReason,
        note: approvedLeave.reason || row.note,
      }
    }
    if (currentSession) {
      setMarks(currentSession.records.map((r) => withLeave({ ...r })))
    } else {
      setMarks(selectedBatch.students.map((st) => withLeave({
        entityId: st.id,
        name: st.name,
        status: "present",
      })))
    }
  }, [selectedBatchId, takeDate, sessions, leaves])

  // ─── Overview ──────────────────────────────────────────────────────────────
  const viewBatchSession = sessions.find(s => s.date === viewDate && s.batchId === selectedBatchId)
  const viewCounts = countMarks(viewBatchSession?.records || [])
  const absentees = (viewBatchSession?.records || []).filter(r => r.status === "absent")
  const onLeaveToday = (viewBatchSession?.records || []).filter(r => r.status === "leave")

  // ─── History ───────────────────────────────────────────────────────────────
  const historyRows = sessions
    .flatMap(s =>
      s.records.map(r => ({
        key: `${s.date}-${s.batchId}-${r.entityId}`,
        date: s.date,
        batchId: s.batchId,
        batchName: batches.find(b => b.id === s.batchId)?.name || s.className,
        record: r,
        submitted: s.submitted,
      }))
    )
    .filter(row => {
      if (historyFromDate && row.date < historyFromDate) return false
      if (historyToDate && row.date > historyToDate) return false
      if (historyBatch !== "all" && row.batchId !== historyBatch) return false
      if (historyStatus !== "all" && row.record.status !== historyStatus) return false
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const historyPerPage = 20
  const historyTotalPages = Math.max(1, Math.ceil(historyRows.length / historyPerPage))
  const pagedHistory = historyRows.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage)

  // ─── Student stats ─────────────────────────────────────────────────────────
  const allStudents = batches.flatMap(b => b.students)
  const selectedStudent = allStudents.find(s => s.id === studentId) || allStudents[0]

  const studentSessions = sessions.filter(s =>
    s.records.some(r => r.entityId === selectedStudent?.id)
  )
  const studentPresent = studentSessions.filter(s => s.records.find(r => r.entityId === selectedStudent?.id)?.status === "present").length
  const studentAbsent = studentSessions.filter(s => s.records.find(r => r.entityId === selectedStudent?.id)?.status === "absent").length
  const studentLeave = studentSessions.filter(s => s.records.find(r => r.entityId === selectedStudent?.id)?.status === "leave").length
  const studentRate = studentSessions.length ? Math.round((studentPresent / studentSessions.length) * 100) : 0

  // ─── Submit attendance ─────────────────────────────────────────────────────
  const persistAttendance = async (submitted: boolean, reason?: string) => {
    if (!selectedBatch || isClosed) return
    setSubmitting(true)
    try {
      const payload = {
        date: takeDate,
        className: selectedBatch.name,
        batchId: selectedBatch.id,
        submitted,
        submittedBy: user?.name || "Coordinator",
        submittedAt: new Date().toISOString(),
        records: marks.map((mark) => {
          const approvedLeave = findApprovedLeave(leaves, mark, takeDate)
          if (!approvedLeave) return mark
          return {
            ...mark,
            status: "leave" as AttendanceStatus,
            absenceReason: approvedLeave.reason || mark.absenceReason,
            note: approvedLeave.reason || mark.note,
          }
        }),
      }
      const saved = await api.saveAttendance(payload)
      // Update local sessions
      setSessions(prev => {
        const filtered = prev.filter(s => !(s.date === takeDate && s.batchId === selectedBatchId))
        return [{ ...payload, _id: saved._id }, ...filtered]
      })
      addNotification({
        title: "Attendance submitted",
        description: `${selectedBatch.name} · ${formatDateDDMMYYYY(takeDate)}`,
        type: "attendance",
      })
      setSuccessMsg("Attendance submitted successfully.")
      setConfirmOpen(false)
      setEditOpen(false)
      setEditReason("")
    } catch (err) {
      console.error("Save attendance failed", err)
      addNotification({ title: "Save failed", description: "Could not save attendance. Please try again.", type: "system" })
    } finally {
      setSubmitting(false)
    }
  }

  const markAllPresent = () => {
    setMarks(prev => prev.map(m => {
      if (m.status === "leave") return m
      return { ...m, status: "present" as AttendanceStatus }
    }))
    setSuccessMsg("")
  }

  const setMark = (entityId: string, patch: Partial<ChildMark>) => {
    setMarks(prev => prev.map(m => m.entityId === entityId ? { ...m, ...patch } : m))
    setSuccessMsg("")
  }

  const exportHistory = () => {
    const rows = historyRows.map(row => [
      formatDateDDMMYYYY(row.date),
      row.record.name,
      row.batchName || "",
      row.record.status,
      row.record.absenceReason || row.record.note || "",
    ])
    downloadCsv("attendance-history.csv", [["Date", "Student", "Batch", "Status", "Remarks"], ...rows])
    addNotification({ title: "History exported", description: `Downloaded ${historyRows.length} records.`, type: "attendance" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground animate-pulse">Loading classroom attendance...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          Classroom Attendance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mark attendance for your classes. Mark All Present, then change only absences and leave.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={`att-tab-${t.id}`}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3 h-9 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer",
              tab === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ──────────────────────────────────────────────────────── */}
      {tab === "today" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {batches.length > 1 && (
              <Select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="h-9 text-xs sm:max-w-xs w-full"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            )}
            <div className="w-full sm:max-w-[200px]">
              <DatePicker 
                value={viewDate} 
                onChange={val => setViewDate(val)} 
              />
            </div>
          </div>

          {batches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No batches with enrolled students found. Please enroll students in a batch first.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <KPICard title="Total students" value={selectedBatch?.students.length || 0} icon={Users} />
                <KPICard title="Present" value={viewCounts.present} icon={CalendarCheck} />
                <KPICard title="Absent" value={viewCounts.absent} icon={UserX} />
                <KPICard title="Leave" value={viewCounts.leave} icon={CalendarOff} />
                <KPICard title="Attendance rate" value={viewBatchSession ? `${viewCounts.rate}%` : "—"} icon={Percent} />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Absentees on {formatDateDDMMYYYY(viewDate)}</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {absentees.length === 0
                      ? <p className="text-muted-foreground">{viewBatchSession ? "No absentees." : viewClosure ? `${viewClosure} — no attendance required.` : "Attendance not submitted yet."}</p>
                      : absentees.map(r => <p key={`abs-${r.entityId}`}>{r.name}</p>)
                    }
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Leave on {formatDateDDMMYYYY(viewDate)}</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {onLeaveToday.length === 0
                      ? <p className="text-muted-foreground">No leave recorded.</p>
                      : onLeaveToday.map(r => <p key={`lv-${r.entityId}`}>{r.name}</p>)
                    }
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Submission status ({formatDateDDMMYYYY(viewDate)})</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {batches.map(b => {
                      const s = sessions.find(sess => sess.date === viewDate && sess.batchId === b.id)
                      return (
                        <div key={`sub-${b.id}`} className="flex items-center justify-between gap-2">
                          <span>{b.name}</span>
                          {s?.submitted
                            ? <Badge variant="success"><Lock className="h-3 w-3 mr-1" />Submitted</Badge>
                            : viewClosure
                              ? <Badge variant="destructive">Closed</Badge>
                              : <Badge variant="warning">Pending</Badge>
                          }
                        </div>
                      )
                    })}
                    {batches.length === 0 && <p className="text-muted-foreground">No batches found.</p>}
                  </CardContent>
                </Card>
              </div>
              {canTake && (
                <Button size="sm" onClick={() => setTab("take")}>Take attendance</Button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Take Attendance Tab ────────────────────────────────────────────── */}
      {tab === "take" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="grid gap-3 sm:grid-cols-2 bg-card border border-border rounded-xl p-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Batch / Class</label>
              <Select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)}>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Date</label>
              <DatePicker value={takeDate} onChange={val => setTakeDate(val)} />
            </div>
          </div>

          {!selectedBatch ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No batches available. Please create a batch and enroll students first.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  {marks.length} children · {formatLongDate(takeDate)}
                  {locked
                    ? <Badge variant="success"><Lock className="h-3 w-3 mr-1" />Submitted</Badge>
                    : <Badge variant="warning">Not submitted</Badge>
                  }
                </p>
                {canTake && (
                  <Button size="sm" variant="primary" icon={Check} onClick={markAllPresent} disabled={takeDate > todayIso() || isClosed}>
                    Mark All Present
                  </Button>
                )}
              </div>

              {isClosed && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-700 flex items-center gap-2">
                  <CalendarOff className="h-4 w-4 shrink-0" />
                  {takeClosure} — school is closed on {formatLongDate(takeDate)}. Attendance cannot be taken. Please choose a working day.
                </div>
              )}

              {successMsg && <p className="text-sm font-medium text-emerald-600">{successMsg}</p>}

              {marks.some((mark) => findApprovedLeave(leaves, mark, takeDate)) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900 flex items-center gap-2">
                  <CalendarOff className="h-4 w-4 shrink-0" />
                  Approved parent leave is auto-marked as Leave for this date. Those rows stay locked to Leave.
                </div>
              )}

              {marks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground text-sm">
                    No students enrolled in this batch.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {marks.map(mark => {
                    const approvedLeave = findApprovedLeave(leaves, mark, takeDate)
                    const rowLocked = !canTake || isClosed || (locked && !canCorrect) || Boolean(approvedLeave)
                    return (
                    <div key={`take-row-${mark.entityId}`} className="rounded-xl border border-border bg-card p-3 sm:p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 border border-primary/10">
                            {mark.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{mark.name}</p>
                            <p className="text-[11px] text-muted-foreground">{selectedBatch.name}</p>
                            {approvedLeave && (
                              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                <CalendarOff className="h-3 w-3" />
                                Approved leave{approvedLeave.reason ? ` · ${approvedLeave.reason}` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex bg-muted/40 p-1 rounded-xl border border-border/80 gap-1 w-full lg:w-auto">
                          {VISIBLE_STATUSES.map(status => (
                            <button
                              key={`st-${mark.entityId}-${status}`}
                              type="button"
                              disabled={rowLocked}
                              onClick={() => setMark(mark.entityId, { status })}
                              className={cn(
                                "flex items-center justify-center flex-1 h-10 px-3 rounded-lg border text-[13px] font-semibold capitalize transition-all duration-200",
                                statusStyle(status, mark.status === status),
                                rowLocked && "opacity-60 cursor-not-allowed"
                              )}
                            >
                              {statusIcon(status)}
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {mark.status === "absent" && canTake && (!locked || canCorrect) && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <Select
                            value={mark.absenceReason || ""}
                            onChange={e => setMark(mark.entityId, { absenceReason: (e.target.value || undefined) as AbsenceReason | undefined })}
                          >
                            <option value="">Reason (optional)</option>
                            {ABSENCE_REASONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </Select>
                          <Select
                            value={mark.parentInformed ? "yes" : "no"}
                            onChange={e => setMark(mark.entityId, { parentInformed: e.target.value === "yes" })}
                          >
                            <option value="no">Parent informed: No</option>
                            <option value="yes">Parent informed: Yes</option>
                          </Select>
                          <Input
                            placeholder="Remarks (optional)"
                            value={mark.note || ""}
                            onChange={e => setMark(mark.entityId, { note: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
              )}

              {canTake && !isClosed && marks.length > 0 && (
                <div className="sticky bottom-3 rounded-xl border border-border bg-card/95 backdrop-blur p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  {(() => { const s = countMarks(marks); return (
                    <p className="text-xs font-medium">
                      Present {s.present} · Absent {s.absent} · Leave {s.leave}
                    </p>
                  )})()}
                  {locked
                    ? <Button size="sm" variant="outline" icon={Unlock} onClick={() => setEditOpen(true)}>Correct attendance</Button>
                    : <Button size="sm" icon={Check} onClick={() => setConfirmOpen(true)} disabled={submitting || takeDate > todayIso()}>
                        {takeDate > todayIso() ? "Cannot Submit Future Date" : "Submit Attendance"}
                      </Button>
                  }
                </div>
              )}

              {/* Confirm dialog */}
              {confirmOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4">
                    <h3 className="font-bold text-base">Submit attendance?</h3>
                    <p className="text-xs text-muted-foreground">{selectedBatch.name} · {formatLongDate(takeDate)}</p>
                    <div className="text-sm space-y-1">
                      {(() => { const s = countMarks(marks); return (<>
                        <p>Present: {s.present}</p>
                        <p>Absent: {s.absent}</p>
                        <p>Leave: {s.leave}</p>
                      </>)})()}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                      <Button size="sm" onClick={() => persistAttendance(true)} disabled={submitting}>Submit</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Correct dialog */}
              {editOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4">
                    <h3 className="font-bold text-base">Correct submitted attendance</h3>
                    <p className="text-xs text-muted-foreground">A reason is required and will be stored in the audit log.</p>
                    <Input
                      placeholder="Reason for correction"
                      value={editReason}
                      onChange={e => setEditReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
                      <Button
                        size="sm"
                        disabled={!editReason.trim() || submitting}
                        onClick={() => persistAttendance(true, editReason.trim())}
                      >
                        Save correction
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── History Tab ────────────────────────────────────────────────────── */}
      {tab === "history" && (
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />Attendance history
              </CardTitle>
              <Button size="sm" variant="outline" icon={Download} onClick={exportHistory}>Export CSV</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">From</label>
                <DatePicker value={historyFromDate} onChange={val => { setHistoryFromDate(val); setHistoryPage(1) }} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">To</label>
                <DatePicker value={historyToDate} onChange={val => { setHistoryToDate(val); setHistoryPage(1) }} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Batch</label>
                <Select value={historyBatch} onChange={e => { setHistoryBatch(e.target.value); setHistoryPage(1) }}>
                  <option value="all">All batches</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Status</label>
                <Select value={historyStatus} onChange={e => { setHistoryStatus(e.target.value); setHistoryPage(1) }}>
                  <option value="all">All</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {pagedHistory.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">No records match your filters.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border bg-muted/20">
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Student</th>
                    <th className="py-3 px-4 font-semibold">Batch</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedHistory.map(row => (
                    <tr key={row.key} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4">{formatDateDDMMYYYY(row.date)}</td>
                      <td className="py-3 px-4 font-medium">{row.record.name}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{row.batchName}</td>
                      <td className="py-3 px-4">{statusBadge(row.record.status)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{row.record.absenceReason || row.record.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
          {historyTotalPages > 1 && (
            <div className="border-t border-border p-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Showing {pagedHistory.length} of {historyRows.length}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)}>Previous</Button>
                <span className="px-2 font-medium">Page {historyPage} of {historyTotalPages}</span>
                <Button variant="outline" size="sm" disabled={historyPage === historyTotalPages} onClick={() => setHistoryPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Student Tab ────────────────────────────────────────────────────── */}
      {tab === "student" && (
        <div className="space-y-4">
          {allStudents.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No students enrolled in any batch.</CardContent></Card>
          ) : (
            <>
              <Select value={studentId || selectedStudent?.id || ""} onChange={e => setStudentId(e.target.value)} className="max-w-sm">
                {allStudents.map((s, i) => (
                  <option key={`st-${s.id || i}`} value={s.id}>{s.name} · {s.batchName}</option>
                ))}
              </Select>
              {selectedStudent && (
                <>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <KPICard title="Sessions" value={studentSessions.length} icon={ClipboardList} />
                    <KPICard title="Present" value={studentPresent} icon={CalendarCheck} />
                    <KPICard title="Absent" value={studentAbsent} icon={UserX} />
                    <KPICard title="Leave" value={studentLeave} icon={CalendarOff} />
                  </div>
                  <KPICard title="Attendance Rate" value={`${studentRate}%`} icon={Percent} />
                  {studentSessions.length === 0 && (
                    <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No attendance records yet for {selectedStudent.name}.</CardContent></Card>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Reports Tab ────────────────────────────────────────────────────── */}
      {tab === "reports" && (
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />Attendance Reports
            </CardTitle>
            <CardDescription>Export attendance data for any batch.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="max-w-xs">
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Button size="sm" variant="outline" icon={Download} onClick={exportHistory}>
              Export CSV
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Settings Tab ───────────────────────────────────────────────────── */}
      {tab === "settings" && canSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />Attendance settings
            </CardTitle>
            <CardDescription>Configure attendance options for your school.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-2"><Bell className="h-4 w-4" />Parent notifications</p>
              <label className="flex items-center justify-between gap-3 text-xs">
                <span>Absent notification</span>
                <input type="checkbox" checked={notifyAbsent} onChange={e => setNotifyAbsent(e.target.checked)} />
              </label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
