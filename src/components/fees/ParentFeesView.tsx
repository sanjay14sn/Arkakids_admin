"use client"

import * as React from "react"
import { CreditCard, Download, History } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { KPICard } from "@/components/dashboard/KPICard"
import { formatCurrency } from "@/lib/utils"
import { PARENT_CHILD_ID } from "@/lib/preschoolOps"
import {
  downloadReceipt,
  FEE_TODAY,
  formatFeeDate,
  methodLabel,
  recordPayment,
  statusLabel,
  statusVariant,
  studentPayments,
  studentSummary,
  usePreschoolFees,
} from "@/lib/preschoolFees"

export function ParentFeesView() {
  const { state, update, ready } = usePreschoolFees()
  const [history, setHistory] = React.useState(false)
  const summary = studentSummary(state, PARENT_CHILD_ID)
  const payments = studentPayments(state, PARENT_CHILD_ID).filter((item) => item.status === "paid")

  if (!ready || !summary) {
    return <p className="text-xs text-muted-foreground py-16 text-center">Loading fees...</p>
  }

  const { student } = summary

  const payNow = () => {
    const amount = summary.nextDueAmount || summary.outstanding
    if (amount <= 0) return
    const result = recordPayment(state, {
      studentId: PARENT_CHILD_ID,
      amount,
      date: FEE_TODAY,
      method: "online",
      txnId: `PARENT${Date.now()}`,
      remarks: "Paid from parent portal",
      createdBy: student.parentName,
    })
    if (result.ok) update(result.state)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Parent portal</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">My Fees</h1>
        <p className="text-sm text-muted-foreground">
          {student.name} · {student.className} · {student.academicYear}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard title="Total fee" value={formatCurrency(summary.payable)} subtext="After concession" icon={CreditCard} />
        <KPICard title="Paid" value={formatCurrency(summary.paid)} subtext={statusLabel(summary.status)} icon={CreditCard} delay={0.05} />
        <KPICard title="Outstanding" value={formatCurrency(summary.outstanding)} subtext={summary.nextDueDate ? `Next due ${formatFeeDate(summary.nextDueDate)}` : "No dues"} icon={CreditCard} delay={0.1} />
      </div>

      {summary.outstanding > 0 && summary.nextDueLabel && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Upcoming payment</CardTitle>
            <CardDescription>Pay from the parent app. School can also collect at the branch.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{summary.nextDueLabel}</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(summary.nextDueAmount || 0)}</p>
              <p className="text-xs text-muted-foreground">Due: {formatFeeDate(summary.nextDueDate || "")}</p>
            </div>
            <Badge variant={statusVariant(summary.status)}>{statusLabel(summary.status)}</Badge>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={payNow} disabled={summary.outstanding <= 0}>
          Pay now
        </Button>
        <Button size="sm" variant="outline" icon={History} onClick={() => setHistory((open) => !open)}>
          {history ? "Hide history" : "View payment history"}
        </Button>
        {payments[0] && (
          <Button size="sm" variant="outline" icon={Download} onClick={() => downloadReceipt(state, payments[0])}>
            Download receipt
          </Button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">Pay now records an online preview payment for the next due amount.</p>

      {history && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Payment history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payments.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
                <div>
                  <p className="text-xs font-bold">{item.receiptNo} · {formatCurrency(item.amount)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatFeeDate(item.date)} · {methodLabel(item.method)} · {item.txnId || "—"}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => downloadReceipt(state, item)}>
                  Receipt
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
