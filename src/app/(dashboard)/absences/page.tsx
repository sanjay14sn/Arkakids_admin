"use client"

import * as React from "react"
import { CalendarOff, Plus, Check, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { useStore } from "@/store/useStore"
import { formatDate } from "@/lib/utils"
import {
  CHILDREN,
  PARENT_CHILD_ID,
  childById,
  parentChildFilter,
  usePreschoolOps,
  type LeaveRequest,
  type LeaveStatus,
} from "@/lib/preschoolOps"
import { childAttendanceById } from "@/lib/preschoolAttendance"

function childName(id: string) {
  return childById(id)?.name || childAttendanceById(id)?.name || id
}

function statusBadge(status: LeaveStatus) {
  if (status === "approved") return <Badge variant="success">Approved</Badge>
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>
  return <Badge variant="warning">Pending</Badge>
}

export default function ChildLeavePage() {
  const { user, addNotification } = useStore()
  const isParent = user?.role === "student"
  const canDecide = user?.role === "trainer" || user?.role === "owner" || user?.role === "super_admin" || user?.role === "bde"
  const { state, update, ready } = usePreschoolOps()
  const [open, setOpen] = React.useState(false)
  const [childId, setChildId] = React.useState(isParent ? PARENT_CHILD_ID : CHILDREN[0].id)
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")
  const [reason, setReason] = React.useState("")

  const rows = parentChildFilter(state.leaves, isParent).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const pending = rows.filter((row) => row.status === "pending").length

  const apply = () => {
    if (!fromDate || !toDate || !reason.trim()) return
    const request: LeaveRequest = {
      id: `lv-${Date.now()}`,
      childId,
      fromDate,
      toDate,
      reason: reason.trim(),
      status: "pending",
      requestedBy: user?.name || "Parent",
      createdAt: new Date().toISOString(),
    }
    update((prev) => ({ ...prev, leaves: [request, ...prev.leaves] }))
    addNotification({
      title: "Leave request submitted",
      description: `${childById(childId)?.name} leave is waiting for coordinator approval.`,
      type: "attendance",
    })
    setReason("")
    setOpen(false)
  }

  const decide = (id: string, status: "approved" | "rejected") => {
    update((prev) => ({
      ...prev,
      leaves: prev.leaves.map((row) =>
        row.id === id ? { ...row, status, decidedBy: user?.name || "Coordinator" } : row
      ),
    }))
    const row = state.leaves.find((item) => item.id === id)
    addNotification({
      title: status === "approved" ? "Leave approved" : "Leave rejected",
      description: `${childById(row?.childId || "")?.name || "Child"} will ${status === "approved" ? "be marked absent for these dates" : "need to attend as scheduled"}.`,
      type: "attendance",
    })
  }

  if (!ready) {
    return <p className="text-xs text-muted-foreground py-16 text-center">Loading leave requests...</p>
  }

  return (
    <div className="space-y-6">
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
        <Button size="sm" icon={Plus} onClick={() => setOpen(true)}>
          {isParent ? "Apply for leave" : "Log parent request"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Pending</p><p className="text-2xl font-extrabold mt-1">{pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Approved</p><p className="text-2xl font-extrabold mt-1">{rows.filter((r) => r.status === "approved").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[10px] uppercase text-muted-foreground font-bold">Rejected</p><p className="text-2xl font-extrabold mt-1">{rows.filter((r) => r.status === "rejected").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm">Requests</CardTitle>
          <CardDescription>Coordinator approval updates classroom attendance for those dates.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left uppercase font-semibold text-muted-foreground">
                <th className="p-4">Child</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                {canDecide && <th className="p-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row) => {
                const child = childById(row.childId) || childAttendanceById(row.childId)
                return (
                  <tr key={row.id}>
                    <td className="p-4">
                      <p className="font-bold">{childName(row.childId)}</p>
                      <p className="text-[10px] text-muted-foreground">{child?.className} • {row.requestedBy}</p>
                    </td>
                    <td className="p-4">{formatDate(row.fromDate)} – {formatDate(row.toDate)}</td>
                    <td className="p-4 max-w-xs">{row.reason}</td>
                    <td className="p-4">{statusBadge(row.status)}</td>
                    {canDecide && (
                      <td className="p-4 text-right">
                        {row.status === "pending" ? (
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" icon={Check} onClick={() => decide(row.id, "approved")}>Approve</Button>
                            <Button size="sm" variant="outline" icon={X} onClick={() => decide(row.id, "rejected")}>Reject</Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{row.decidedBy || "—"}</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog isOpen={open} onClose={() => setOpen(false)} title="Child leave request" description="Submit dates and a reason. Coordinator will approve or reject.">
        <div className="space-y-3">
          {!isParent && (
            <Select value={childId} onChange={(e) => setChildId(e.target.value)} className="h-9 text-xs">
              {CHILDREN.map((child) => (
                <option key={child.id} value={child.id}>{child.name} — {child.className}</option>
              ))}
            </Select>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 text-xs" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 text-xs" />
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for leave"
            className="w-full min-h-24 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={apply} disabled={!fromDate || !toDate || !reason.trim()}>Submit</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
