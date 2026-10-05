"use client"

import * as React from "react"
import { Check, Lock, Unlock, X, CalendarOff, Clock } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { Dialog } from "@/components/ui/Dialog"
import { cn } from "@/lib/utils"
import {
  ABSENCE_REASONS,
  CLASS_GROUPS,
  childrenInClass,
  childAttendanceById,
  countMarks,
  coveringLeave,
  findSession,
  formatLongDate,
  noticeForMark,
  nowTime,
  sessionKey,
  todayIso,
  type AbsenceReason,
  type AttendanceChild,
  type AttendanceSession,
  type AttendanceState,
  type AttendanceStatus,
  type ChildMark,
} from "@/lib/preschoolAttendance"
import { usePreschoolOps, closureReason, type LeaveRequest } from "@/lib/preschoolOps"

const STATUSES: AttendanceStatus[] = ["present", "absent", "leave"]

function statusIcon(status: AttendanceStatus) {
  if (status === "present") return <Check className="h-3.5 w-3.5 mr-1.5" />
  if (status === "absent") return <X className="h-3.5 w-3.5 mr-1.5" />
  if (status === "leave") return <CalendarOff className="h-3.5 w-3.5 mr-1.5" />
  return <Clock className="h-3.5 w-3.5 mr-1.5" />
}

function statusStyle(status: AttendanceStatus, active: boolean) {
  const map: Record<AttendanceStatus, string> = {
    present: active ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-transparent border-transparent text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400",
    absent: active ? "bg-rose-500 text-white border-rose-500 shadow-sm" : "bg-transparent border-transparent text-muted-foreground hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-400",
    leave: active ? "bg-amber-500 text-white border-amber-500 shadow-sm" : "bg-transparent border-transparent text-muted-foreground hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/10 dark:hover:text-amber-400",
  }
  return map[status]
}

function defaultMarks(kids: AttendanceChild[], date: string, leaves: LeaveRequest[]): ChildMark[] {
  return kids.map((child) => {
    const leave = coveringLeave(leaves, child.id, date)
    if (leave) return { childId: child.id, status: "leave" as const, remarks: leave.reason }
    return { childId: child.id, status: "present" as const }
  })
}

export function TakeAttendancePanel({
  state,
  leaves,
  actorName,
  canTake,
  canCorrect,
  onSave,
}: {
  state: AttendanceState
  leaves: LeaveRequest[]
  actorName: string
  canTake: boolean
  canCorrect: boolean
  onSave: (next: AttendanceState, message: string) => void
}) {
  const { settings } = state
  const [className, setClassName] = React.useState("Nursery A")
  const [date, setDate] = React.useState(todayIso())
  const [marks, setMarks] = React.useState<ChildMark[]>([])
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editReason, setEditReason] = React.useState("")
  const [success, setSuccess] = React.useState("")
  const loadedKey = React.useRef("")

  const { state: opsState } = usePreschoolOps()
  const offReason = React.useMemo(() => closureReason(opsState, date), [date, opsState])
  const isOffDay = Boolean(offReason)

  const kids = childrenInClass(className)
  const session = findSession(state.sessions, date, className)
  const locked = Boolean(session?.submitted)
  const group = CLASS_GROUPS.find((item) => item.className === className)

  React.useEffect(() => {
    const key = sessionKey(date, className)
    if (loadedKey.current === key) return
    loadedKey.current = key
    const roster = childrenInClass(className)
    const existing = findSession(state.sessions, date, className)
    if (existing) setMarks(existing.marks.map((mark) => ({ ...mark })))
    else setMarks(defaultMarks(roster, date, leaves))
  }, [date, className, state.sessions, leaves])

  const visibleStatuses = STATUSES
  const summary = countMarks(marks)
  const editable = canTake && !isOffDay && (!locked || canCorrect)

  const setMark = (childId: string, patch: Partial<ChildMark>) => {
    setMarks((prev) => prev.map((mark) => (mark.childId === childId ? { ...mark, ...patch } : mark)))
    setSuccess("")
  }

  const markAllPresent = () => {
    setMarks((prev) =>
      prev.map((mark) => {
        if (mark.status === "leave" && coveringLeave(leaves, mark.childId, date)) return mark
        return { childId: mark.childId, status: "present" }
      })
    )
    setSuccess("")
  }

  const persist = (reason?: string) => {
    const nextSession: AttendanceSession = {
      id: session?.id || `sess-${date}-${className.replace(/\s+/g, "-").toLowerCase()}`,
      date,
      className,
      submitted: true,
      submittedAt: new Date().toISOString(),
      submittedBy: actorName,
      marks,
    }
    const audits = [...state.audits]
    if (session?.submitted && reason) {
      session.marks.forEach((old) => {
        const next = marks.find((mark) => mark.childId === old.childId)
        if (next && next.status !== old.status) {
          audits.unshift({
            id: `aud-${Date.now()}-${old.childId}`,
            date,
            className,
            childId: old.childId,
            fromStatus: old.status,
            toStatus: next.status,
            changedBy: actorName,
            changedAt: new Date().toISOString(),
            reason,
          })
        }
      })
    }
    const notices = [...state.notices]
    if (settings.notifyAbsent || settings.notifyLeave) {
      marks.forEach((mark) => {
        const child = childAttendanceById(mark.childId)
        if (!child) return
        if (mark.status === "absent" && !settings.notifyAbsent) return
        if (mark.status === "leave" && !settings.notifyLeave) return
        const notice = noticeForMark(child, date, mark.status)
        if (notice) notices.unshift(notice)
      })
    }
    const sessions = [nextSession, ...state.sessions.filter((item) => !(item.date === date && item.className === className))]
    onSave({ ...state, sessions, audits, notices }, "Attendance submitted successfully.")
    setConfirmOpen(false)
    setEditOpen(false)
    setEditReason("")
    setSuccess("Attendance submitted successfully.")
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3 bg-card border border-border rounded-xl p-3">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Class</label>
          <Select value={className} onChange={(e) => setClassName(e.target.value)}>
            {CLASS_GROUPS.map((item) => (
              <option key={`take-class-${item.className}`} value={item.className}>
                {item.klass}{item.section !== "-" ? ` — Section ${item.section}` : ""}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Section</label>
          <Input value={group?.section === "-" ? "—" : group?.section || "A"} readOnly />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase text-muted-foreground">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground font-medium flex items-center">
          {kids.length} children · {formatLongDate(date)}
          {locked ? (
            <Badge variant="success" className="ml-3"><Lock className="h-3 w-3 mr-1" />Submitted</Badge>
          ) : (
            <Badge variant="warning" className="ml-3">Not submitted</Badge>
          )}
        </p>
        {editable && (
          <Button size="sm" variant="primary" icon={Check} onClick={markAllPresent}>
            Mark All Present
          </Button>
        )}
      </div>

      {isOffDay && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
          <CalendarOff className="h-4 w-4 shrink-0" />
          {offReason} — school is closed on {formatLongDate(date)}. Attendance cannot be taken. Please choose a working day.
        </div>
      )}

      {success && <p className="text-sm font-medium text-emerald-600">{success}</p>}

      <div className="space-y-2">
        {kids.map((child) => {
          const mark = marks.find((item) => item.childId === child.id) || { childId: child.id, status: "present" as const }
          const leave = coveringLeave(leaves, child.id, date)
          return (
            <div key={`take-row-${child.id}`} className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn("h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0", child.tone)}>
                    {child.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{child.name}</p>
                    <p className="text-[11px] text-muted-foreground">{child.admissionNo} · {child.className}</p>
                    {leave && <p className="text-[11px] text-amber-700">Approved leave {leave.fromDate} → {leave.toDate}</p>}
                  </div>
                </div>
                <div className="flex bg-muted/40 p-1 rounded-xl border border-border/80 gap-1 overflow-x-auto w-full lg:w-auto">
                  {visibleStatuses.map((status) => (
                    <button
                      key={`st-${child.id}-${status}`}
                      type="button"
                      disabled={!editable}
                      onClick={() =>
                        setMark(child.id, {
                          status,
                        })
                      }
                      className={cn(
                        "flex items-center justify-center flex-1 lg:flex-none min-w-[96px] h-10 px-3 rounded-lg border text-[13px] font-semibold capitalize transition-all duration-200",
                        statusStyle(status, mark.status === status),
                        !editable && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      {statusIcon(status)}
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {mark.status === "absent" && editable && (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <Select
                    value={mark.absenceReason || ""}
                    onChange={(e) => setMark(child.id, { absenceReason: (e.target.value || undefined) as AbsenceReason | undefined })}
                  >
                    <option value="">Reason (optional)</option>
                    {ABSENCE_REASONS.map((reason) => (
                      <option key={`abs-${child.id}-${reason}`} value={reason}>{reason}</option>
                    ))}
                  </Select>
                  <Select
                    value={mark.parentInformed ? "yes" : "no"}
                    onChange={(e) => setMark(child.id, { parentInformed: e.target.value === "yes" })}
                  >
                    <option value="no">Parent informed: No</option>
                    <option value="yes">Parent informed: Yes</option>
                  </Select>
                  <Input placeholder="Remarks (optional)" value={mark.remarks || ""} onChange={(e) => setMark(child.id, { remarks: e.target.value })} />
                </div>
              )}

            </div>
          )
        })}
      </div>

      {editable && (
        <div className="sticky bottom-3 rounded-xl border border-border bg-card/95 backdrop-blur p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <p className="text-xs font-medium">
            Present {summary.present} · Absent {summary.absent} · Leave {summary.leave}
          </p>
          {locked ? (
            <Button size="sm" variant="outline" icon={Unlock} onClick={() => setEditOpen(true)}>Correct attendance</Button>
          ) : (
            <Button size="sm" icon={Check} onClick={() => setConfirmOpen(true)}>Submit Attendance</Button>
          )}
        </div>
      )}

      <Dialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Submit attendance?" description={`${className} · ${formatLongDate(date)}`}>
        <div className="space-y-3 text-sm">
          <p>Present: {summary.present}</p>
          <p>Absent: {summary.absent}</p>
          <p>Leave: {summary.leave}</p>

          {settings.notifyAbsent && summary.absent > 0 && (
            <p className="text-xs text-muted-foreground">Parents of absent children will get a preview notification.</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => persist()}>Submit Attendance</Button>
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={editOpen} onClose={() => setEditOpen(false)} title="Correct submitted attendance" description="A reason is required and will be stored in the audit log.">
        <div className="space-y-3">
          <Input placeholder="Reason for correction" value={editReason} onChange={(e) => setEditReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={!editReason.trim()} onClick={() => persist(editReason.trim())}>Save correction</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
