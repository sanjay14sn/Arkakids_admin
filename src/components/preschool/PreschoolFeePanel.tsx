"use client"

import * as React from "react"
import { CreditCard, Download, IndianRupee } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { useStore } from "@/store/useStore"
import {
  PAYMENT_PLANS,
  downloadFeeReceipt,
  feeTotal,
  planAmount,
  useParentPortal,
  type PayMethod,
  type PaymentPlanId,
  type ParentReceipt,
} from "@/lib/parentPortal"

const METHODS: { id: PayMethod; label: string }[] = [
  { id: "upi", label: "UPI" },
  { id: "card", label: "Card" },
  { id: "netbanking", label: "Net banking" },
]

export function PreschoolFeePanel() {
  const { user, addNotification } = useStore()
  const { state, update, ready } = useParentPortal()
  const staff = user?.role !== "student"
  const [plan, setPlan] = React.useState<PaymentPlanId>("term")
  const [method, setMethod] = React.useState<PayMethod>("upi")
  const [paying, setPaying] = React.useState(false)

  if (!ready) return null

  const total = feeTotal(state.feeHeads)
  const siblingCut = Math.round(total * (state.siblingDiscountPercent / 100))
  const payable = Math.max(0, total - siblingCut)
  const due = Math.max(0, payable - state.paidAmount)
  const installment = planAmount(payable, state.paidAmount, plan)
  const lateFee = Math.round(due * (state.lateFeePercent / 100))

  const payNow = () => {
    if (installment <= 0) return
    setPaying(true)
    const receipt: ParentReceipt = {
      id: `RCP-AK-${1040 + state.receipts.length + 1}`,
      txnId: `pay_preview_${Math.random().toString(36).slice(2, 8)}`,
      studentName: "Aanya Sharma",
      className: "Nursery",
      amount: installment,
      plan,
      method,
      paidAt: new Date().toISOString(),
      heads: state.feeHeads,
    }
    update((prev) => ({
      ...prev,
      paidAmount: prev.paidAmount + installment,
      receipts: [receipt, ...prev.receipts],
    }))
    addNotification({
      title: "Payment recorded (preview)",
      description: `${receipt.id} · ₹${installment.toLocaleString("en-IN")} via ${method.toUpperCase()}`,
      type: "fees",
    })
    setTimeout(() => setPaying(false), 400)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-primary" />
            Preschool fee breakup
          </CardTitle>
          <CardDescription>
            Registration, admission, books, uniform, and activity kit. Preview pay uses a fake transaction id.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-border/60 rounded-lg border border-border/60">
            {state.feeHeads.map((head) => (
              <div key={`fee-head-${head.key}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
                <span className="font-medium">{head.label}</span>
                {staff ? (
                  <Input
                    type="number"
                    className="h-8 w-28 text-right"
                    value={head.amount}
                    onChange={(e) =>
                      update({
                        feeHeads: state.feeHeads.map((item) =>
                          item.key === head.key ? { ...item, amount: Number(e.target.value) || 0 } : item
                        ),
                      })
                    }
                  />
                ) : (
                  <span>₹{head.amount.toLocaleString("en-IN")}</span>
                )}
              </div>
            ))}
          </div>

          {staff && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Sibling discount %</label>
                <Input
                  type="number"
                  value={state.siblingDiscountPercent}
                  onChange={(e) => update({ siblingDiscountPercent: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Late fee %</label>
                <Input
                  type="number"
                  value={state.lateFeePercent}
                  onChange={(e) => update({ lateFeePercent: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">Total</p>
              <p className="text-base font-bold">₹{total.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">Sibling discount</p>
              <p className="text-base font-bold">₹{siblingCut.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">Paid</p>
              <p className="text-base font-bold text-emerald-600">₹{state.paidAmount.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-muted-foreground">Due {due > 0 ? `+ late ₹${lateFee}` : ""}</p>
              <p className="text-base font-bold text-amber-600">₹{due.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Select value={plan} onChange={(e) => setPlan(e.target.value as PaymentPlanId)}>
              {PAYMENT_PLANS.map((item) => (
                <option key={`plan-${item.id}`} value={item.id}>
                  {item.label} · ₹{planAmount(payable, state.paidAmount, item.id).toLocaleString("en-IN")}
                </option>
              ))}
            </Select>
            <Select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
              {METHODS.map((item) => (
                <option key={`pay-${item.id}`} value={item.id}>{item.label}</option>
              ))}
            </Select>
            <Button onClick={payNow} disabled={paying || installment <= 0} icon={CreditCard}>
              {installment <= 0 ? "Fully paid" : `Pay ₹${installment.toLocaleString("en-IN")}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Receipts</CardTitle>
          <CardDescription>Download a preview HTML receipt with transaction id.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border/60 p-0">
          {state.receipts.map((receipt) => (
            <div key={receipt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 py-3 text-xs">
              <div>
                <p className="font-bold">{receipt.id}</p>
                <p className="text-muted-foreground">
                  {receipt.txnId} · {new Date(receipt.paidAt).toLocaleString("en-IN")} · {receipt.method.toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">₹{receipt.amount.toLocaleString("en-IN")}</Badge>
                <Button size="sm" variant="outline" icon={Download} onClick={() => downloadFeeReceipt(receipt)}>
                  Receipt
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
