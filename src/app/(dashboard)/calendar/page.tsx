"use client"

import * as React from "react"
import {
  CalendarDays,
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Bell,
  MapPin,
  Clock,
  Sparkles,
  PartyPopper,
  GraduationCap,
  Users,
  AlertTriangle,
  X,
  Trash2,
  CheckCircle2,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { useStore } from "@/store/useStore"
import { formatDate, cn } from "@/lib/utils"
import {
  usePreschoolOps,
  type CalendarEvent,
  type CalendarKind,
  weeklyOffDays,
  localIsoDate,
} from "@/lib/preschoolOps"
import { useBranches } from "@/hooks/useBranches"

const KIND_LABEL: Record<CalendarKind, string> = {
  holiday: "Holiday",
  event: "Event",
  ptm: "PTM",
  annual_day: "Annual Day",
  assessment: "Assessment",
  special: "Special activity",
}

const KIND_COLORS: Record<CalendarKind, { bg: string; text: string; border: string; dot: string }> = {
  holiday: { bg: "bg-red-500/10", text: "text-red-700 dark:text-red-400", border: "border-red-500/20", dot: "bg-red-500" },
  event: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", dot: "bg-primary" },
  ptm: { bg: "bg-sky-500/10", text: "text-sky-700 dark:text-sky-400", border: "border-sky-500/20", dot: "bg-sky-500" },
  annual_day: { bg: "bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", border: "border-purple-500/20", dot: "bg-purple-500" },
  assessment: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-500/20", dot: "bg-amber-500" },
  special: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-500" },
}

function kindBadge(kind: CalendarKind) {
  const c = KIND_COLORS[kind]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${c.bg} ${c.text} ${c.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {KIND_LABEL[kind]}
    </span>
  )
}

function monthDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const count = new Date(year, month + 1, 0).getDate()
  return { startPad, count }
}

export default function SchoolCalendarPage() {
  const { user, addNotification } = useStore()
  const canEdit = user?.role !== "student"
  const { state, update, ready } = usePreschoolOps()
  const { branches, isMultiBranch, myBranchName } = useBranches()
  
  const today = new Date()
  const [cursor, setCursor] = React.useState({ year: today.getFullYear(), month: today.getMonth() })
  const [openAdd, setOpenAdd] = React.useState(false)
  const [selectedDayEvents, setSelectedDayEvents] = React.useState<{ day: number; iso: string; events: CalendarEvent[] } | null>(null)
  
  // Filters
  const [filterKind, setFilterKind] = React.useState<string>("all")
  const [filterBranch, setFilterBranch] = React.useState<string>("all")
  
  // Settings (persisted in shared store so Attendance honours it)
  const weeklyOffRule = state.weeklyOffRule ?? "sun"
  const setWeeklyOffRule = (rule: "sun" | "sat_sun" | "none") =>
    update((prev) => ({ ...prev, weeklyOffRule: rule }))

  // Add Event Form State
  const [title, setTitle] = React.useState("")
  const [date, setDate] = React.useState("")
  const [kind, setKind] = React.useState<CalendarKind>("event")
  const [detail, setDetail] = React.useState("")

  const { startPad, count } = monthDays(cursor.year, cursor.month)
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  
  const allEvents = state.events.slice().sort((a, b) => a.date.localeCompare(b.date))

  const filteredEvents = allEvents.filter((e) => {
    if (filterKind !== "all" && e.kind !== filterKind) return false
    // Branch-scoped users only see their own branch's events (plus all-branch ones)
    if (!isMultiBranch && myBranchName && e.branch !== "All branches" && e.branch !== myBranchName) return false
    if (filterBranch !== "all" && e.branch !== "All branches" && e.branch !== filterBranch) return false
    return true
  })
  
  const todayISO = localIsoDate(today)
  const upcomingFilteredEvents = filteredEvents.filter(e => e.date >= todayISO)

  const eventsOn = (day: number) => {
    const iso = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return filteredEvents.filter((event) => event.date === iso)
  }

  const handleAddEvent = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!title.trim() || !date) return
    const event: CalendarEvent = {
      id: `ev-${Date.now()}`,
      date,
      title: title.trim(),
      kind,
      branch: myBranchName || "All branches",
      detail: detail.trim() || KIND_LABEL[kind],
    }
    update((prev) => ({ ...prev, events: [...prev.events, event] }))
    addNotification({
      title: "Calendar event added",
      description: `"${event.title}" scheduled for ${formatDate(event.date)}.`,
      type: "system",
    })
    setTitle("")
    setDetail("")
    setDate("")
    setOpenAdd(false)
  }

  const handleDeleteEvent = (id: string, eventTitle: string) => {
    update((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }))
    if (selectedDayEvents) {
      setSelectedDayEvents((prev) =>
        prev ? { ...prev, events: prev.events.filter((e) => e.id !== id) } : null
      )
    }
    addNotification({
      title: "Event removed",
      description: `"${eventTitle}" deleted from calendar.`,
      type: "system",
    })
  }

  const handleNotifyParents = (event: CalendarEvent) => {
    addNotification({
      title: `Notice Sent: ${event.title}`,
      description: `Parents of ${event.branch} notified about "${event.title}" on ${formatDate(event.date)}.`,
      type: "system",
    })
    alert(`Broadcast notification dispatched to parents for "${event.title}"!`)
  }

  const downloadICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ARKA KIDS//Preschool Calendar//EN\n"
    allEvents.forEach((ev) => {
      const cleanDate = ev.date.replace(/-/g, "")
      icsContent += `BEGIN:VEVENT\nSUMMARY:${ev.title}\nDESCRIPTION:${ev.detail} (${ev.branch})\nDTSTART;VALUE=DATE:${cleanDate}\nEND:VEVENT\n`
    })
    icsContent += "END:VCALENDAR"

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `ARKA_KIDS_School_Calendar_${cursor.year}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Next major event calculation
  const nextMajorEvent = allEvents.find((e) => e.date >= todayISO)

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading school calendar...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="border-b border-border/60 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">School</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/15 shrink-0">
              <CalendarDays className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
                School Calendar & Schedule
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Holidays, events, PTMs, annual day celebrations, and term assessments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" icon={Download} onClick={downloadICS} className="h-9 text-xs">
              Export iCal (.ics)
            </Button>
            {canEdit && (
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setOpenAdd(true)} className="h-9 text-xs">
                Add Date
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Feature Card: Next Milestone Highlight */}
      {nextMajorEvent && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Next Major Milestone</span>
              <p className="text-sm font-bold text-foreground">{nextMajorEvent.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(nextMajorEvent.date)} · {nextMajorEvent.branch}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {kindBadge(nextMajorEvent.kind)}
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                icon={Bell}
                onClick={() => handleNotifyParents(nextMajorEvent)}
                className="h-8 text-xs text-primary border-primary/30"
              >
                Notify Parents
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Calendar Month View + Upcoming Events */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Month View (4 cols) */}
        <Card className="lg:col-span-4 bg-card">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-primary/10 p-2 flex items-center justify-center shrink-0 border border-primary/20">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base font-bold text-foreground leading-none">{monthLabel}</CardTitle>
                <CardDescription className="text-xs leading-none">Click any date to view or add events.</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Select 
                value={weeklyOffRule} 
                onChange={e => setWeeklyOffRule(e.target.value as any)}
                className="h-8 text-[10px] w-auto bg-muted/20 mr-1"
              >
                <option value="none">No Weekly Off</option>
                <option value="sun">Sunday Off</option>
                <option value="sat_sun">Sat & Sun Off</option>
              </Select>
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                onClick={() =>
                  setCursor((c) => {
                    const d = new Date(c.year, c.month - 1, 1)
                    return { year: d.getFullYear(), month: d.getMonth() }
                  })
                }
                className="h-8 w-8 p-0"
              />
              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                onClick={() =>
                  setCursor((c) => {
                    const d = new Date(c.year, c.month + 1, 1)
                    return { year: d.getFullYear(), month: d.getMonth() }
                  })
                }
                className="h-8 w-8 p-0"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-[10px] uppercase font-bold text-muted-foreground mb-2 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-16 rounded-xl bg-muted/20 border border-transparent" />
              ))}
              {Array.from({ length: count }).map((_, i) => {
                const day = i + 1
                const iso = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const isToday = iso === todayISO
                const realDayEvents = eventsOn(day)
                
                const dayOfWeek = new Date(cursor.year, cursor.month, day).getDay()
                const offDays = weeklyOffDays(weeklyOffRule)
                const isWeeklyOff = offDays.includes(dayOfWeek)
                
                const dayEvents = isWeeklyOff && !realDayEvents.some((e: any) => e.kind === "holiday")
                  ? [{ id: `off-${day}`, title: "Weekly Off", date: iso, kind: "holiday" as CalendarKind, branch: "All branches", detail: "" }, ...realDayEvents]
                  : realDayEvents

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      if (dayEvents.length > 0) {
                        setSelectedDayEvents({ day, iso, events: dayEvents })
                      } else if (canEdit) {
                        setDate(iso)
                        setOpenAdd(true)
                      }
                    }}
                    className={cn(
                      "min-h-16 rounded-xl border p-1.5 text-left transition-all flex flex-col justify-between group cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                      isToday
                        ? "border-primary bg-primary/10 shadow-xs"
                        : dayEvents.length > 0
                        ? "border-border bg-card"
                        : "border-border/50 bg-card/60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs font-extrabold h-5 min-w-[20px] rounded-full flex items-center justify-center px-1",
                        isToday ? "bg-primary text-white" : "text-foreground"
                      )}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <p
                          key={event.id}
                          className={cn(
                            "text-[9px] font-semibold truncate rounded px-1 py-0.5",
                            KIND_COLORS[event.kind]?.bg || "bg-primary/10 text-primary"
                          )}
                        >
                          {event.title}
                        </p>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[8px] font-bold text-muted-foreground pl-1">
                          +{dayEvents.length - 2} more
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Feed (3 cols) */}
        <Card className="lg:col-span-3 bg-card flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold text-foreground">Upcoming Dates</CardTitle>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                {upcomingFilteredEvents.length} scheduled
              </span>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 pt-2">
              <Select
                value={filterKind}
                onChange={(e) => setFilterKind(e.target.value)}
                className="h-8 text-xs"
              >
                <option value="all">All Types</option>
                {Object.entries(KIND_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
              <Select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="h-8 text-xs"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b} value={b}>{b.replace("ARKA KIDS ", "")}</option>
                ))}
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-y-auto divide-y divide-border/50 max-h-[500px]">
            {upcomingFilteredEvents.length === 0 ? (
              <div className="p-10 text-center text-xs text-muted-foreground space-y-2">
                <CalendarDays className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p>No upcoming calendar events match the filters.</p>
              </div>
            ) : (
              upcomingFilteredEvents.map((event) => (
                <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors space-y-2 group">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                        {event.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {formatDate(event.date)} · <MapPin className="h-3 w-3 shrink-0 ml-1" /> {event.branch}
                      </p>
                    </div>
                    {kindBadge(event.kind)}
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed bg-muted/40 p-2 rounded-lg border border-border/40">
                    {event.detail}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleNotifyParents(event)}
                        className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Bell className="h-3 w-3" /> Notify Parents
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(event.id, event.title)}
                        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer ml-auto"
                        title="Delete Event"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Selected Day Events Drawer */}
      <Dialog
        isOpen={Boolean(selectedDayEvents)}
        onClose={() => setSelectedDayEvents(null)}
        title={selectedDayEvents ? `Events for ${formatDate(selectedDayEvents.iso)}` : ""}
      >
        <div className="space-y-4 pt-1">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {selectedDayEvents?.events.map((event) => (
              <div key={event.id} className="p-3 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> {event.title}
                  </p>
                  {kindBadge(event.kind)}
                </div>
                <p className="text-xs text-muted-foreground">{event.detail}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">Target: {event.branch}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-border/50 flex justify-between gap-2">
            {canEdit && selectedDayEvents && (
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setDate(selectedDayEvents.iso)
                  setSelectedDayEvents(null)
                  setOpenAdd(true)
                }}
              >
                Add Another Event
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => setSelectedDayEvents(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Add Calendar Date */}
      <Dialog
        isOpen={openAdd}
        onClose={() => setOpenAdd(false)}
        title="Add Calendar Date"
        description="Schedule holidays, PTMs, annual day, or assessment milestones."
      >
        <form onSubmit={handleAddEvent} className="space-y-4 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Event Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs"
              placeholder="e.g. Independence Day Flag Hoisting"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Date *</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Event Type</label>
              <Select
                value={kind}
                onChange={(e) => setKind(e.target.value as CalendarKind)}
                className="h-9 text-xs"
              >
                {Object.entries(KIND_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
          </div>


          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Details & Notes</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="How this date affects attendance, classes, or parent communication..."
              rows={3}
              className="w-full rounded-xl border border-border bg-card p-3 text-xs focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenAdd(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={CalendarDays} disabled={!title.trim() || !date}>
              Save Date
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
