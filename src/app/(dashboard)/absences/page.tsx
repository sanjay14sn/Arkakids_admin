"use client"

import * as React from "react"
import { CalendarOff, Plus, Check, X, Loader2, RefreshCw, AlertTriangle, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { useStore } from "@/store/useStore"
import { formatDate } from "@/lib/utils"
import { api } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────
export type LeaveStatus = "pending" | "approved" | "rejected"

export interface LeaveRequest {
  id: string
  childId: string
  childName: string
  className: string
  parentName: string
  fromDate: string
  toDate: string
  reason: string
  status: LeaveStatus
  requestedBy: string
  decidedBy?: string
  createdAt: string
}

interface BatchOption {
  id: string
  name: string
  className: string
  studentNames: string[] // names of students in this batch
}

interface ChildOption {
  id: string
  name: string
  className: string
  parentName: string
  batchId?: string
  batchName?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapApiLeave(r: any): LeaveRequest {
  return {
    id: r._id ?? r.id ?? "",
    childId: r.childId ?? r.child?._id ?? r.child?.id ?? "",
    childName: r.childName ?? r.child?.name ?? r.studentName ?? "Unknown Child",
    className: r.className ?? r.child?.className ?? r.child?.batch ?? "—",
    parentName: r.parentName ?? r.child?.parentName ?? r.requestedBy ?? "Parent",
    fromDate: r.fromDate ?? r.startDate ?? "",
    toDate: r.toDate ?? r.endDate ?? "",
    reason: r.reason ?? "",
    status: r.status ?? "pending",
    requestedBy: r.requestedBy ?? r.parentName ?? "Parent",
    decidedBy: r.decidedBy ?? r.approvedBy ?? undefined,
    createdAt: r.createdAt ?? new Date().toISOString(),
  }
}

function mapApiBatch(b: any): BatchOption {
  return {
    id: b._id ?? b.id ?? "",
    // Mirror the batchTitle() logic from courses page
    name: b.courseName
      ? (b.section ? `${b.courseName} - ${b.section}` : b.courseName)
      : (b.code ?? b.name ?? b.batchName ?? ""),
    className: b.courseName ?? b.code ?? b.name ?? "",
    // Keep raw studentNames for matching
    studentNames: Array.isArray(b.studentNames) ? b.studentNames as string[] : [],
  }
}

function mapApiStudent(s: any, batchId?: string, batchName?: string): ChildOption {
  return {
    id: s._id ?? s.id ?? "",
    name: s.name ?? s.studentName ?? "",
    className: s.className ?? s.batch ?? s.class ?? "—",
    parentName: s.parentName ?? s.guardianName ?? s.fatherName ?? "Parent",
    batchId,
    batchName,
  }
}

function isLeaveCompleted(toDateStr?: string): boolean {
  if (!toDateStr) return false
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  
  const leaveEnd = new Date(toDateStr.includes("T") ? toDateStr : toDateStr + "T23:59:59").getTime()
  if (isNaN(leaveEnd)) return false

  return leaveEnd < todayStart
}

function statusBadge(status: LeaveStatus) {
  if (status === "approved") return <Badge variant="success">Approved</Badge>
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>
  return <Badge variant="warning">Pending</Badge>
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChildLeavePage() {
  const { user, fetchPendingLeavesCount } = useStore()
  const isParent = user?.role === "student"
  const canDecide =
    user?.role === "trainer" ||
    user?.role === "owner" ||
    user?.role === "super_admin" ||
    user?.role === "bde"

  // ── Page State ────────────────────────────────────────────────────────────
  const [leaves, setLeaves] = React.useState<LeaveRequest[]>([])
  const [allChildren, setAllChildren] = React.useState<ChildOption[]>([])
  const [batches, setBatches] = React.useState<BatchOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  // ── Dialog State ─────────────────────────────────────────────────────────
  const [open, setOpen] = React.useState(false)
  const [selectedBatchId, setSelectedBatchId] = React.useState("")
  const [studentSearch, setStudentSearch] = React.useState("")
  const [childId, setChildId] = React.useState("")
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [submitErr, setSubmitErr] = React.useState("")

  // Decide state (per-row loading)
  const [decidingId, setDecidingId] = React.useState<string | null>(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [leavesRes, studentsRes, batchesRes] = await Promise.all([
        api.getChildLeaves().catch(() => null),
        api.getStudents().catch(() => null),
        api.getBatches().catch(() => null),
      ])

      // Leaves
      const rawLeaves: any[] = Array.isArray(leavesRes)
        ? leavesRes
        : (leavesRes?.leaves ?? leavesRes?.data ?? [])
      setLeaves(rawLeaves.map(mapApiLeave).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))

      // Batches — plain array returned directly by /batches
      const rawBatches: any[] = Array.isArray(batchesRes) ? batchesRes : []
      const batchOpts = rawBatches
        .map(mapApiBatch)
        .filter(b => b.id && b.name)
      setBatches(batchOpts)
      if (batchOpts.length > 0) setSelectedBatchId(batchOpts[0].id)

      // Students — plain array from /students
      const rawStudents: any[] = Array.isArray(studentsRes)
        ? studentsRes
        : (studentsRes?.students ?? studentsRes?.data ?? [])

      const studentOpts = rawStudents
        .map(s => {
          // Match student to batch by checking each batch's studentNames[]
          const matchedBatch = batchOpts.find(b =>
            b.studentNames.some(sn =>
              sn.trim().toLowerCase() === (s.name ?? s.studentName ?? "").trim().toLowerCase()
            )
          )
          return mapApiStudent(
            s,
            matchedBatch?.id ?? "",
            matchedBatch?.name ?? ""
          )
        })
        .filter(c => c.id && c.name)
      setAllChildren(studentOpts)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load leave requests.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchData() }, [fetchData])

  // ── Derived: students filtered by selected batch + search ─────────────────
  const studentsInBatch = React.useMemo(() => {
    if (!selectedBatchId) return allChildren
    return allChildren.filter(c => c.batchId === selectedBatchId)
  }, [allChildren, selectedBatchId])

  const filteredStudents = React.useMemo(() => {
    if (!studentSearch.trim()) return studentsInBatch
    const q = studentSearch.toLowerCase()
    return studentsInBatch.filter(c =>
      c.name.toLowerCase().includes(q) || c.parentName.toLowerCase().includes(q)
    )
  }, [studentsInBatch, studentSearch])

  // Reset child selection when batch changes
  React.useEffect(() => {
    setChildId("")
    setStudentSearch("")
  }, [selectedBatchId])

  // Auto-select first student in list
  React.useEffect(() => {
    if (filteredStudents.length > 0 && !childId) {
      setChildId(filteredStudents[0].id)
    }
  }, [filteredStudents, childId])

  // ── Filtered leave rows (Completed leave dates are automatically removed) ──
  const activeLeaves = React.useMemo(() => {
    return leaves.filter(r => !isLeaveCompleted(r.toDate))
  }, [leaves])

  const filteredLeaves = React.useMemo(() => {
    return activeLeaves.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!r.childName.toLowerCase().includes(q) && !r.parentName.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [activeLeaves, statusFilter, searchQuery])

  const pendingCount = activeLeaves.filter(r => r.status === "pending").length
  const approvedCount = activeLeaves.filter(r => r.status === "approved").length
  const rejectedCount = activeLeaves.filter(r => r.status === "rejected").length

  // ── Submit new leave ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!fromDate || !toDate || !reason.trim()) return
    setSubmitting(true)
    setSubmitErr("")
    try {
      const selectedChild = allChildren.find(c => c.id === childId)
      const selectedBatch = batches.find(b => b.id === selectedBatchId)
      const payload = {
        childId: childId || "unknown",
        childName: selectedChild?.name,
        className: selectedChild?.className ?? selectedBatch?.className ?? selectedBatch?.name,
        parentName: selectedChild?.parentName,
        fromDate,
        toDate,
        reason: reason.trim(),
        requestedBy: user?.name || selectedChild?.parentName || "Parent",
      }
      const res = await api.createChildLeave(payload)
      const newLeave = mapApiLeave(res?.leave ?? res)
      setLeaves(prev => [newLeave, ...prev])
      setReason("")
      setFromDate("")
      setToDate("")
      setChildId("")
      setOpen(false)
    } catch (e: any) {
      setSubmitErr(e?.message ?? "Failed to submit leave request.")
    } finally {
      setSubmitting(false)
    }
  }

  const closeDialog = () => {
    setOpen(false)
    setSubmitErr("")
    setStudentSearch("")
  }

  // ── Approve / Reject ───────────────────────────────────────────────────────
  const decide = async (id: string, status: "approved" | "rejected") => {
    setDecidingId(id)
    setLeaves(prev =>
      prev.map(r => r.id === id ? { ...r, status, decidedBy: user?.name || "Coordinator" } : r)
    )
    try {
      await api.reviewChildLeave(id, status, user?.name || "Coordinator")
      void fetchPendingLeavesCount()
    } catch {
      fetchData()
    } finally {
      setDecidingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Attendance</p>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 mt-1">
            <CalendarOff className="h-6 w-6 text-primary" />
            Child Leave
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Parent absentee requests. Approved leave marks the child absent on the attendance register. This is not staff HR leave.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
          <Button size="sm" icon={Plus} onClick={() => setOpen(true)}>
            {isParent ? "Apply for leave" : "Log parent request"}
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
          <button onClick={fetchData} className="ml-auto underline underline-offset-2 font-semibold hover:opacity-80">Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-muted/10 border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Pending</p>
              <p className="text-3xl font-extrabold mt-1 text-warning">
                {pendingCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
              <CalendarOff className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/10 border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Approved</p>
              <p className="text-3xl font-extrabold mt-1 text-success">
                {approvedCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/10 border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Rejected</p>
              <p className="text-3xl font-extrabold mt-1 text-destructive">
                {rejectedCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <X className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave table */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Leave Requests</CardTitle>
              <CardDescription>Coordinator approval updates classroom attendance for those dates.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Input
                placeholder="Search child..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[180px] h-9 text-xs"
              />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto text-xs">
          {loading && leaves.length === 0 ? (
            <div className="divide-y divide-border/30">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-32" />
                    <div className="h-2.5 bg-muted/60 rounded w-44" />
                  </div>
                  <div className="h-3 bg-muted rounded w-36" />
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-5 bg-muted rounded-full w-16" />
                </div>
              ))}
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No leave requests found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/10">
                <tr className="border-b border-border text-left uppercase font-semibold text-muted-foreground text-[10px] tracking-wider">
                  <th className="py-3 px-4">Child</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  {canDecide && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredLeaves.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/5 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm">{row.childName}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {row.className} • {row.parentName}
                      </p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground font-medium">
                      {row.fromDate ? formatDate(row.fromDate) : "—"}
                      <span className="text-muted-foreground/50 mx-1">–</span>
                      {row.toDate ? formatDate(row.toDate) : "—"}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-xs">{row.reason}</td>
                    <td className="py-3 px-4">{statusBadge(row.status)}</td>
                    {canDecide && (
                      <td className="py-3 px-4 text-right">
                        {row.status === "pending" ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="success"
                              icon={decidingId === row.id ? Loader2 : Check}
                              className="h-7 px-2 text-xs"
                              disabled={decidingId === row.id}
                              onClick={() => decide(row.id, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              icon={decidingId === row.id ? Loader2 : X}
                              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-transparent border-transparent"
                              disabled={decidingId === row.id}
                              onClick={() => decide(row.id, "rejected")}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic font-medium">
                            by {row.decidedBy || "—"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ── Submit / Log Dialog ─────────────────────────────────────────────── */}
      <Dialog
        isOpen={open}
        onClose={closeDialog}
        title="Child leave request"
        description="Select a batch and child, then fill in the dates and reason."
      >
        <div className="space-y-4">
          {submitErr && (
            <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{submitErr}
            </div>
          )}

          {!isParent && (
            <>
              {/* Step 1 — Batch */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Batch / Class</label>
                {loading ? (
                  <div className="h-9 rounded-lg border border-border bg-muted/20 flex items-center px-3 gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading batches…</span>
                  </div>
                ) : (
                  <Select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="h-9 text-xs"
                    disabled={batches.length === 0}
                  >
                    {batches.length === 0 ? (
                      <option value="">No batches available</option>
                    ) : (
                      batches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))
                    )}
                  </Select>
                )}
              </div>

              {/* Step 2 — Search + pick student */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Child
                  {studentsInBatch.length > 0 && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                      ({studentsInBatch.length} in batch)
                    </span>
                  )}
                </label>

                {/* Search box */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name or parent…"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Student list */}
                {batches.length > 0 && (
                  filteredStudents.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic px-1">
                      {studentSearch ? "No students match your search." : "No students in this batch."}
                    </p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto rounded-lg border border-border divide-y divide-border/50">
                      {filteredStudents.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setChildId(c.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            childId === c.id
                              ? "bg-primary/10 border-l-2 border-primary"
                              : "hover:bg-muted/40"
                          }`}
                        >
                          {/* Avatar initials */}
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                            childId === c.id
                              ? "bg-primary text-white"
                              : "bg-primary/10 text-primary"
                          }`}>
                            {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{c.className} • {c.parentName}</p>
                          </div>
                          {childId === c.id && (
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
            </>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">From</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">To</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for leave"
              className="w-full min-h-20 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              size="sm"
              icon={submitting ? Loader2 : Plus}
              onClick={handleSubmit}
              disabled={
                !fromDate || !toDate || !reason.trim() || submitting ||
                (!isParent && !childId)
              }
            >
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
