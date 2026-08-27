"use client"

import * as React from "react"
import {
  CalendarCheck, Users, UserX, CalendarOff, Percent, History, ClipboardList,
  BarChart3, Settings, Lock, Download, Bell,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { KPICard } from "@/components/dashboard/KPICard"
import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import { PARENT_CHILD_ID, usePreschoolOps } from "@/lib/preschoolOps"
import {
  ATTENDANCE_CHILDREN,
  CLASS_GROUPS,
  childAttendanceById,
  childrenInClass,
  classMonthStats,
  countMarks,
  downloadCsv,
  downloadReportHtml,
  findSession,
  studentMonthStats,
  todayIso,
  usePreschoolAttendance,
  type AttendanceStatus,
} from "@/lib/preschoolAttendance"
import { TakeAttendancePanel } from "./TakeAttendancePanel"

type Tab = "today" | "take" | "history" | "student" | "class" | "leave" | "reports" | "settings"

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "take", label: "Take Attendance" },
  { id: "history", label: "History" },
  { id: "student", label: "Student" },
  { id: "class", label: "Class" },
  { id: "leave", label: "Leave" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
]

function statusBadge(status: AttendanceStatus) {
  if (status === "present") return <Badge variant="success">Present</Badge>
  if (status === "absent") return <Badge variant="destructive">Absent</Badge>
  if (status === "leave") return <Badge variant="warning">Leave</Badge>
  return <Badge variant="info">Late</Badge>
}

export function ParentAttendanceView() {
  const { state, ready } = usePreschoolAttendance()
  const child = childAttendanceById(PARENT_CHILD_ID) || ATTENDANCE_CHILDREN.find((item) => item.id === PARENT_CHILD_ID)
  const stats = studentMonthStats(state.sessions, PARENT_CHILD_ID, 2026, 8)
  const todaySession = state.sessions.find((session) => session.date === todayIso() && session.marks.some((mark) => mark.childId === PARENT_CHILD_ID))
  const todayMark = todaySession?.marks.find((mark) => mark.childId === PARENT_CHILD_ID)

  if (!ready || !child) return <p className="text-xs text-muted-foreground py-16 text-center">Loading attendance...</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">My child</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">{child.name}</h1>
        <p className="text-sm text-muted-foreground">{child.klass}{child.section !== "-" ? ` - ${child.section}` : ""} · {child.admissionNo}</p>
      </div>
      <Card>
        <CardContent className="p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Today’s attendance</p>
            <p className="text-lg font-bold mt-1">{todayMark ? todayMark.status : "Not marked yet"}</p>
          </div>
          {todayMark ? statusBadge(todayMark.status) : <Badge variant="outline">Pending</Badge>}
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Present" value={stats.present} icon={CalendarCheck} />
        <KPICard title="Absent" value={stats.absent} icon={UserX} />
        <KPICard title="Leave" value={stats.leave} icon={CalendarOff} />
        <KPICard title="Attendance" value={`${stats.rate}%`} icon={Percent} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">August 2026</CardTitle>
          <CardDescription>Only {child.name}’s days are shown.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-7 gap-1 text-center text-[11px]">
          {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
            <div key={`wd-${index}`} className="font-semibold text-muted-foreground py-1">{label}</div>
          ))}
          {Array.from({ length: new Date(2026, 7, 1).getDay() }).map((_, index) => (
            <div key={`pad-${index}`} />
          ))}
          {Array.from({ length: 31 }).map((_, index) => {
            const day = index + 1
            const date = `2026-08-${String(day).padStart(2, "0")}`
            const status = stats.byDate[date]
            return (
              <div
                key={`cal-${date}`}
                className={cn(
                  "h-9 rounded-md flex items-center justify-center",
                  status === "present" && "bg-emerald-100 text-emerald-800",
                  status === "absent" && "bg-rose-100 text-rose-800",
                  status === "leave" && "bg-amber-100 text-amber-800",
                  status === "late" && "bg-sky-100 text-sky-800",
                  !status && "text-muted-foreground"
                )}
              >
                {day}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

export function AttendanceModule() {
  const { user, addNotification } = useStore()
  const { state, update, ready } = usePreschoolAttendance()
  const { state: ops, ready: opsReady } = usePreschoolOps()
  const [tab, setTab] = React.useState<Tab>("today")
  const [historyDate, setHistoryDate] = React.useState("")
  const [historyClass, setHistoryClass] = React.useState("all")
  const [historyStatus, setHistoryStatus] = React.useState("all")
  const [studentId, setStudentId] = React.useState(ATTENDANCE_CHILDREN[0]?.id || "")
  const [className, setClassName] = React.useState("Nursery A")
  const [reportType, setReportType] = React.useState("daily")

  const role = user?.role
  const isParent = role === "student"
  const canTake = role === "trainer" || role === "owner" || role === "super_admin"
  const canSettings = role === "owner" || role === "super_admin"
  const canCorrect = role === "owner" || role === "super_admin" || (role === "trainer" && state.settings.teachersCanEdit)
  const tabs = TABS.filter((item) => {
    if (isParent) return item.id === "today" || item.id === "student"
    if (!canSettings && item.id === "settings") return false
    if (role === "bde" && (item.id === "take" || item.id === "settings")) return false
    return true
  })

  if (!ready || !opsReady) {
    return <p className="text-xs text-muted-foreground py-16 text-center">Loading classroom attendance...</p>
  }

  if (isParent) return <ParentAttendanceView />

  const today = todayIso()
  const watchClass = "Nursery A"
  const todaySession = findSession(state.sessions, today, watchClass)
  const todayMarks = todaySession?.marks || []
  const todayCounts = countMarks(todayMarks)
  const absentees = todayMarks.filter((mark) => mark.status === "absent")
  const onLeave = todayMarks.filter((mark) => mark.status === "leave")
  const classRows = CLASS_GROUPS.map((group) => {
    const session = findSession(state.sessions, today, group.className)
    return { group, session, counts: countMarks(session?.marks || []) }
  })
  const student = childAttendanceById(studentId)
  const studentStats = studentMonthStats(state.sessions, studentId, 2026, 8)
  const classStats = classMonthStats(state.sessions, className, 2026, 8)

  const historyRows = state.sessions
    .flatMap((session) =>
      session.marks.map((mark) => ({
        key: `${session.id}-${mark.childId}`,
        date: session.date,
        className: session.className,
        mark,
        child: childAttendanceById(mark.childId),
        submitted: session.submitted,
      }))
    )
    .filter((row) => {
      if (historyDate && row.date !== historyDate) return false
      if (historyClass !== "all" && row.className !== historyClass) return false
      if (historyStatus !== "all" && row.mark.status !== historyStatus) return false
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date) || (a.child?.name || "").localeCompare(b.child?.name || ""))
    .slice(0, 80)

  const exportReport = (kind: "csv" | "html") => {
    const rows = classStats.map((row) => [
      row.child.name,
      String(row.present),
      String(row.absent),
      String(row.leave),
      state.settings.lateEnabled ? String(row.late) : "—",
      `${row.rate}%`,
    ])
    const header = ["Student", "Present", "Absent", "Leave", "Late", "Attendance %"]
    if (kind === "csv") downloadCsv(`attendance-${className}.csv`, [header, ...rows])
    else {
      const table = `<table><thead><tr>${header.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
        .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`
      downloadReportHtml(`${reportType} attendance ${className}`, table)
    }
    addNotification({ title: "Report exported", description: `${className} ${kind.toUpperCase()} downloaded.`, type: "attendance" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          Classroom attendance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {role === "super_admin"
            ? "Branch roll-call status across classes. Open Take Attendance to inspect a class."
            : "Mark 20–30 children in under a minute. Mark All Present, then change only absences and leave."}
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={`att-tab-${item.id}`}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "px-3 h-9 rounded-lg text-xs font-semibold whitespace-nowrap border cursor-pointer",
              tab === item.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <KPICard title="Total students" value={todayCounts.total || childrenInClass(watchClass).length} icon={Users} />
            <KPICard title="Present" value={todayCounts.present} icon={CalendarCheck} />
            <KPICard title="Absent" value={todayCounts.absent} icon={UserX} />
            <KPICard title="Leave" value={todayCounts.leave} icon={CalendarOff} />
            <KPICard title="Attendance rate" value={todaySession ? `${todayCounts.rate}%` : "—"} icon={Percent} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Today’s absentees</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                {absentees.length === 0 && <p className="text-muted-foreground">{todaySession ? "No absentees." : "Attendance not submitted yet."}</p>}
                {absentees.map((mark) => (
                  <p key={`abs-${mark.childId}`}>{childAttendanceById(mark.childId)?.name}</p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Today’s leave</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                {onLeave.length === 0 && <p className="text-muted-foreground">No leave recorded today.</p>}
                {onLeave.map((mark) => (
                  <p key={`lv-${mark.childId}`}>{childAttendanceById(mark.childId)?.name}</p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Submission status</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                {classRows.map((row) => (
                  <div key={`sub-${row.group.className}`} className="flex items-center justify-between gap-2">
                    <span>{row.group.className}</span>
                    {row.session?.submitted ? (
                      <Badge variant="success"><Lock className="h-3 w-3 mr-1" />Submitted</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          {canTake && (
            <Button size="sm" onClick={() => setTab("take")}>Take attendance</Button>
          )}
        </div>
      )}

      {tab === "take" && (
        <TakeAttendancePanel
          state={state}
          leaves={ops.leaves}
          actorName={user?.name || "Coordinator"}
          canTake={canTake}
          canCorrect={canCorrect}
          onSave={(next, message) => {
            update(next)
            addNotification({ title: message, description: "Roll call saved for the selected class.", type: "attendance" })
          }}
        />
      )}

      {tab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" />Attendance history</CardTitle>
            <div className="grid gap-2 sm:grid-cols-4 pt-2">
              <Input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} />
              <Select value={historyClass} onChange={(e) => setHistoryClass(e.target.value)}>
                <option value="all">All classes</option>
                {CLASS_GROUPS.map((item) => (
                  <option key={`h-class-${item.className}`} value={item.className}>{item.className}</option>
                ))}
              </Select>
              <Select value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
                {state.settings.lateEnabled && <option value="late">Late</option>}
              </Select>
              <Select value="all" disabled>
                <option>Student filter in Student tab</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2">Date</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={row.key} className="border-b border-border/50">
                    <td className="py-2">{row.date}</td>
                    <td>{row.child?.name}</td>
                    <td>{row.className}</td>
                    <td className="capitalize">{row.mark.status}</td>
                    <td className="text-muted-foreground">{row.mark.remarks || row.mark.absenceReason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "student" && student && (
        <div className="space-y-4">
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            {ATTENDANCE_CHILDREN.map((child) => (
              <option key={`st-sel-${child.id}`} value={child.id}>{child.name} · {child.className}</option>
            ))}
          </Select>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <KPICard title="Working days" value={studentStats.workingDays} icon={ClipboardList} />
            <KPICard title="Present" value={studentStats.present} icon={CalendarCheck} />
            <KPICard title="Absent" value={studentStats.absent} icon={UserX} />
            <KPICard title="Leave" value={studentStats.leave} icon={CalendarOff} />
            <KPICard title="Attendance" value={`${studentStats.rate}%`} icon={Percent} />
          </div>
          {state.settings.lateEnabled && <p className="text-xs text-muted-foreground">Late days: {studentStats.late}</p>}
          <Card>
            <CardHeader><CardTitle className="text-sm">{student.name} · August calendar</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {Array.from({ length: 31 }).map((_, index) => {
                const date = `2026-08-${String(index + 1).padStart(2, "0")}`
                const status = studentStats.byDate[date]
                return (
                  <div key={`stu-cal-${date}`} className={cn("h-9 rounded-md flex items-center justify-center", status === "present" && "bg-emerald-100", status === "absent" && "bg-rose-100", status === "leave" && "bg-amber-100", status === "late" && "bg-sky-100")}>
                    {index + 1}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "class" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Class attendance · August</CardTitle>
            <Select value={className} onChange={(e) => setClassName(e.target.value)}>
              {CLASS_GROUPS.map((item) => (
                <option key={`cls-${item.className}`} value={item.className}>{item.className}</option>
              ))}
            </Select>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2">Student</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Leave</th>
                  {state.settings.lateEnabled && <th>Late</th>}
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {classStats.map((row) => (
                  <tr key={`cls-row-${row.child.id}`} className="border-b border-border/50">
                    <td className="py-2">{row.child.name}</td>
                    <td>{row.present}</td>
                    <td>{row.absent}</td>
                    <td>{row.leave}</td>
                    {state.settings.lateEnabled && <td>{row.late}</td>}
                    <td>{row.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "leave" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Leave on roll call</CardTitle>
            <CardDescription>Approved parent leave auto-fills as Leave when you take attendance. Manage requests on Child Leave.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {ops.leaves.map((leave) => {
              const child = childAttendanceById(leave.childId)
              return (
                <div key={leave.id} className="rounded-lg border border-border/60 px-3 py-2 flex justify-between gap-2">
                  <div>
                    <p className="font-semibold">{child?.name || leave.childId}</p>
                    <p className="text-muted-foreground">{leave.fromDate} → {leave.toDate} · {leave.reason}</p>
                  </div>
                  <Badge variant={leave.status === "approved" ? "success" : leave.status === "rejected" ? "destructive" : "warning"} className="capitalize">{leave.status}</Badge>
                </div>
              )
            })}
            <Button size="sm" variant="outline" onClick={() => (window.location.href = "/absences")}>Open leave management</Button>
          </CardContent>
        </Card>
      )}

      {tab === "reports" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Attendance reports</CardTitle>
            <CardDescription>Preview exports a CSV (Excel) or HTML (print/PDF).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="daily">Daily attendance report</option>
                <option value="monthly">Monthly attendance report</option>
                <option value="student">Student attendance report</option>
                <option value="class">Class attendance report</option>
                <option value="percent">Attendance percentage report</option>
                <option value="frequent">Frequent absentee report</option>
                <option value="low">Low attendance report</option>
              </Select>
              <Select value={className} onChange={(e) => setClassName(e.target.value)}>
                {CLASS_GROUPS.map((item) => (
                  <option key={`rep-${item.className}`} value={item.className}>{item.className}</option>
                ))}
              </Select>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" icon={Download} onClick={() => exportReport("csv")}>Excel</Button>
                <Button size="sm" variant="outline" icon={Download} onClick={() => exportReport("html")}>PDF</Button>
              </div>
            </div>
            {reportType === "frequent" || reportType === "low" ? (
              <div className="space-y-1 text-xs">
                {classStats
                  .filter((row) => (reportType === "low" ? row.rate < 90 : row.absent >= 2))
                  .map((row) => (
                    <p key={`low-${row.child.id}`}>{row.child.name} · {row.absent} absent · {row.rate}%</p>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{classStats.length} students in {className} for August. Export to download.</p>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "settings" && canSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" />Attendance settings</CardTitle>
            <CardDescription>Late attendance is off by default for flexible play-school timings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <label className="flex items-center justify-between gap-3">
              <span>Enable late attendance</span>
              <input
                type="checkbox"
                checked={state.settings.lateEnabled}
                onChange={(e) => update({ settings: { ...state.settings, lateEnabled: e.target.checked } })}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">School arrival time</p>
                <Input type="time" value={state.settings.arrivalTime} onChange={(e) => update({ settings: { ...state.settings, arrivalTime: e.target.value } })} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Submission deadline</p>
                <Input type="time" value={state.settings.submitDeadline} onChange={(e) => update({ settings: { ...state.settings, submitDeadline: e.target.value } })} />
              </div>
            </div>
            <label className="flex items-center justify-between gap-3">
              <span>Allow classroom coordinators to correct attendance</span>
              <input
                type="checkbox"
                checked={state.settings.teachersCanEdit}
                onChange={(e) => update({ settings: { ...state.settings, teachersCanEdit: e.target.checked } })}
              />
            </label>
            <div className="pt-2 border-t space-y-2">
              <p className="font-semibold flex items-center gap-2"><Bell className="h-4 w-4" />Parent notifications (preview)</p>
              <label className="flex items-center justify-between gap-3 text-xs">
                <span>Absent notification</span>
                <input type="checkbox" checked={state.settings.notifyAbsent} onChange={(e) => update({ settings: { ...state.settings, notifyAbsent: e.target.checked } })} />
              </label>
              <label className="flex items-center justify-between gap-3 text-xs">
                <span>Leave confirmation</span>
                <input type="checkbox" checked={state.settings.notifyLeave} onChange={(e) => update({ settings: { ...state.settings, notifyLeave: e.target.checked } })} />
              </label>
              {state.settings.lateEnabled && (
                <label className="flex items-center justify-between gap-3 text-xs">
                  <span>Late notification</span>
                  <input type="checkbox" checked={state.settings.notifyLate} onChange={(e) => update({ settings: { ...state.settings, notifyLate: e.target.checked } })} />
                </label>
              )}
              <label className="flex items-center justify-between gap-3 text-xs">
                <span>Daily attendance summary</span>
                <input type="checkbox" checked={state.settings.notifyDailySummary} onChange={(e) => update({ settings: { ...state.settings, notifyDailySummary: e.target.checked } })} />
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {(["app", "whatsapp", "sms", "email"] as const).map((channel) => (
                  <button
                    key={`ch-${channel}`}
                    type="button"
                    onClick={() => {
                      const channels = state.settings.channels.includes(channel)
                        ? state.settings.channels.filter((item) => item !== channel)
                        : [...state.settings.channels, channel]
                      update({ settings: { ...state.settings, channels } })
                    }}
                    className={cn("px-2 py-1 rounded-md text-[11px] border capitalize cursor-pointer", state.settings.channels.includes(channel) ? "bg-primary text-primary-foreground border-primary" : "border-border")}
                  >
                    {channel === "app" ? "App notification" : channel}
                  </button>
                ))}
              </div>
            </div>
            {state.audits.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <p className="font-semibold">Audit log</p>
                {state.audits.map((audit) => (
                  <p key={audit.id} className="text-xs text-muted-foreground">
                    {childAttendanceById(audit.childId)?.name} · {audit.fromStatus} → {audit.toStatus} · {audit.changedBy} · {new Date(audit.changedAt).toLocaleString("en-IN")} · {audit.reason}
                  </p>
                ))}
              </div>
            )}
            {state.notices[0] && (
              <p className="text-xs text-muted-foreground border-t pt-2">{state.notices[0].body}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
