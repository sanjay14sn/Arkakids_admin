"use client"

import * as React from "react"
import { ArrowLeftRight, Plus, Check, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { useStore } from "@/store/useStore"
import { formatDate } from "@/lib/utils"
import { AccessRestricted } from "@/components/shared/AccessRestricted"
import {
  BRANCHES,
  CHILDREN,
  CLASSES,
  childById,
  usePreschoolOps,
  type BranchTransfer,
} from "@/lib/preschoolOps"

function statusBadge(status: BranchTransfer["status"]) {
  if (status === "approved") return <Badge variant="success">Approved</Badge>
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>
  return <Badge variant="warning">Pending Head Office</Badge>
}

export default function BranchTransferPage() {
  const { user, addNotification } = useStore()
  const canView = user?.role === "super_admin" || user?.role === "owner"
  const canApprove = user?.role === "super_admin"
  const { state, update, ready } = usePreschoolOps()
  const [open, setOpen] = React.useState(false)
  const [childId, setChildId] = React.useState(CHILDREN[0].id)
  const [toBranch, setToBranch] = React.useState<string>(BRANCHES[1])
  const [toClass, setToClass] = React.useState<string>(CLASSES[1])
  const [reason, setReason] = React.useState("")

  const child = childById(childId)
  const fromBranch = child?.branch || BRANCHES[0]

  const submit = () => {
    if (!reason.trim() || toBranch === fromBranch) return
    const transfer: BranchTransfer = {
      id: `tr-${Date.now()}`,
      childId,
      fromBranch,
      toBranch,
      toClass,
      reason: reason.trim(),
      status: canApprove ? "approved" : "pending",
      requestedBy: user?.name || "Franchise Owner",
      createdAt: new Date().toISOString(),
    }
    update((prev) => ({ ...prev, transfers: [transfer, ...prev.transfers] }))
    addNotification({
      title: canApprove ? "Child transferred" : "Transfer requested",
      description: `${child?.name} ${canApprove ? "moved to" : "awaiting move to"} ${toBranch}.`,
      type: "admissions",
    })
    setReason("")
    setOpen(false)
  }

  const decide = (id: string, status: "approved" | "rejected") => {
    update((prev) => ({
      ...prev,
      transfers: prev.transfers.map((row) => (row.id === id ? { ...row, status } : row)),
    }))
  }

  if (!canView) {
    return (
      <AccessRestricted
        title="Branch transfer is a Head Office action"
        description="Franchise Owners can request a move. Super Admin approves the child into the destination branch and class."
      />
    )
  }

  if (!ready) {
    return <p className="text-xs text-muted-foreground py-16 text-center">Loading transfers...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Head Office</p>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 mt-1">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
            Branch Transfer
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Move a child between ARKA KIDS branches. Super Admin confirms class allocation at the destination.
          </p>
        </div>
        <Button size="sm" icon={Plus} onClick={() => setOpen(true)}>
          {canApprove ? "Transfer child" : "Request transfer"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm">Transfer register</CardTitle>
          <CardDescription>Pending requests wait for Head Office. Approved moves update the child’s home branch.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left uppercase font-semibold text-muted-foreground">
                <th className="p-4">Child</th>
                <th className="p-4">From → To</th>
                <th className="p-4">Class</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                {canApprove && <th className="p-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {state.transfers.map((row) => {
                const record = childById(row.childId)
                return (
                  <tr key={row.id}>
                    <td className="p-4">
                      <p className="font-bold">{record?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(row.createdAt)} • {row.requestedBy}</p>
                    </td>
                    <td className="p-4">{row.fromBranch} → {row.toBranch}</td>
                    <td className="p-4">{row.toClass}</td>
                    <td className="p-4 max-w-xs">{row.reason}</td>
                    <td className="p-4">{statusBadge(row.status)}</td>
                    {canApprove && (
                      <td className="p-4 text-right">
                        {row.status === "pending" ? (
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" icon={Check} onClick={() => decide(row.id, "approved")}>Approve</Button>
                            <Button size="sm" variant="outline" icon={X} onClick={() => decide(row.id, "rejected")}>Reject</Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Done</span>
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

      <Dialog isOpen={open} onClose={() => setOpen(false)} title={canApprove ? "Transfer child" : "Request branch transfer"} description="Child record, fees, and documents stay linked after the move.">
        <div className="space-y-3">
          <Select value={childId} onChange={(e) => setChildId(e.target.value)} className="h-9 text-xs">
            {CHILDREN.map((item) => (
              <option key={item.id} value={item.id}>{item.name} — {item.branch}</option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">From {fromBranch}</p>
          <Select value={toBranch} onChange={(e) => setToBranch(e.target.value)} className="h-9 text-xs">
            {BRANCHES.filter((item) => item !== fromBranch).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
          <Select value={toClass} onChange={(e) => setToClass(e.target.value)} className="h-9 text-xs">
            {CLASSES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for transfer"
            className="w-full min-h-20 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={!reason.trim()}>Submit</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
