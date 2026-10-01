"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  IndianRupee,
  Plus,
  Printer,
  Send,
  Settings,
  X,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { KPICard } from "@/components/dashboard/KPICard"
import { formatCurrency } from "@/lib/utils"
import { api } from "@/lib/api"
import { BRANCHES } from "@/lib/preschoolOps"
import { useStore } from "@/store/useStore"
import {
  ACADEMIC_YEAR,
  DISCOUNT_TYPES,
  FEE_TODAY,
  FEE_TYPES,
  FREQUENCIES,
  NOTIFY_CHANNELS,
  PAY_METHODS,
  SCHEDULES,
  applyDiscount,
  assignStructure,
  cancelPayment,
  dashboardStats,
  daysOverdue,
  downloadCsv,
  downloadReceipt,
  formatFeeDate,
  frequencyLabel,
  invoiceRemaining,
  methodLabel,
  printReceipt,
  recordPayment,
  sendFeeReminder,
  statusLabel,
  statusVariant,
  structureLines,
  structureTotal,
  studentById,
  studentDiscounts,
  studentInvoices,
  studentPayments,
  studentSummary,
  upsertStructure,
  usePreschoolFees,
  type DiscountTypeId,
  type FeeComponent,
  type FeeInvoice,
  type FeePayment,
  type FeeStructure,
  type FeeTypeId,
  type FrequencyId,
  type NotifyChannelId,
  type PayMethodId,
  type ScheduleId,
} from "@/lib/preschoolFees"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "structures", label: "Fee Structures" },
  { id: "students", label: "Student Fees" },
  { id: "dues", label: "Dues / Invoices" },
  { id: "collect", label: "Collect Payment" },
  { id: "discounts", label: "Discounts" },
  { id: "receipts", label: "Receipts" },
  { id: "reports", label: "Reports" },
] as const

type TabId = (typeof TABS)[number]["id"]

export function FeesModule() {
  const { user, addNotification } = useStore()
  const { state, update, ready } = usePreschoolFees()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const tab = (TABS.some((item) => item.id === params.get("tab")) ? params.get("tab") : "overview") as TabId
  const searchFromUrl = params.get("search") || ""
  const actor = user?.name || "Franchise Owner"

  const [studentId, setStudentId] = React.useState("")
  const [invoiceId, setInvoiceId] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [payDate, setPayDate] = React.useState(FEE_TODAY)
  const [method, setMethod] = React.useState<PayMethodId>("upi")
  const [txnId, setTxnId] = React.useState("")
  const [remarks, setRemarks] = React.useState("")
  const [receipt, setReceipt] = React.useState<FeePayment | null>(null)
  const [detailId, setDetailId] = React.useState<string | null>(null)
  const [cancelId, setCancelId] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState(searchFromUrl)
  const [branch, setBranch] = React.useState("all")
  const [klass, setKlass] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [methodFilter, setMethodFilter] = React.useState("all")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")
  const [reportRange, setReportRange] = React.useState<"daily" | "weekly" | "monthly" | "yearly">("monthly")
  const [structureOpen, setStructureOpen] = React.useState(false)
  const [editingStructure, setEditingStructure] = React.useState<FeeStructure | null>(null)
  const [assignOpen, setAssignOpen] = React.useState(false)
  const [discountOpen, setDiscountOpen] = React.useState(false)
  const [studentPage, setStudentPage] = React.useState(1)

  React.useEffect(() => {
    if (searchFromUrl) setQuery(searchFromUrl)
  }, [searchFromUrl])

  const setTab = (id: TabId, nextStudent?: string) => {
    const next = new URLSearchParams(params.toString())
    next.set("tab", id)
    if (nextStudent) next.set("student", nextStudent)
    router.replace(`${pathname}?${next.toString()}`)
    if (nextStudent) setStudentId(nextStudent)
  }

  const stats = dashboardStats(state)
  const classes = Array.from(new Set(state.students.map((item) => item.className)))

  const filteredStudents = stats.summaries.filter((item) => {
    const hay = `${item.student.name} ${item.student.studentCode} ${item.student.parentName}`.toLowerCase()
    if (query && !hay.includes(query.toLowerCase())) return false
    if (branch !== "all" && item.student.branch !== branch) return false
    if (klass !== "all" && item.student.className !== klass) return false
    if (status !== "all" && item.status !== status) return false
    return true
  })

  const STUDENT_PAGE_SIZE = 10
  const paginatedStudents = filteredStudents.slice((studentPage - 1) * STUDENT_PAGE_SIZE, studentPage * STUDENT_PAGE_SIZE)
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENT_PAGE_SIZE))

  const livePayments = state.payments.filter((item) => item.status === "paid")
  const filteredPayments = livePayments.filter((item) => {
    const student = studentById(state, item.studentId)
    if (query && student && !`${student.name} ${item.receiptNo}`.toLowerCase().includes(query.toLowerCase())) return false
    if (branch !== "all" && student?.branch !== branch) return false
    if (klass !== "all" && student?.className !== klass) return false
    if (methodFilter !== "all" && item.method !== methodFilter) return false
    if (fromDate && item.date < fromDate) return false
    if (toDate && item.date > toDate) return false
    return true
  })

  const dueInvoices = state.invoices.filter((item) => invoiceRemaining(item) > 0)
  const upcoming = dueInvoices.filter((item) => item.dueDate > FEE_TODAY).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const dueToday = dueInvoices.filter((item) => item.dueDate === FEE_TODAY)
  const overdue = dueInvoices.filter((item) => item.dueDate < FEE_TODAY).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const filteredDues = dueInvoices.filter((item) => {
    const student = studentById(state, item.studentId)
    if (query && student && !student.name.toLowerCase().includes(query.toLowerCase())) return false
    if (branch !== "all" && student?.branch !== branch) return false
    if (klass !== "all" && student?.className !== klass) return false
    if (typeFilter !== "all" && item.feeType !== typeFilter) return false
    if (status !== "all" && item.status !== status) return false
    return true
  })

  const selectedSummary = studentId ? studentSummary(state, studentId) : null
  const selectedInvoice = invoiceId ? state.invoices.find((item) => item.id === invoiceId) : null
  const amountDue = selectedInvoice ? invoiceRemaining(selectedInvoice) : selectedSummary?.outstanding || 0
  const payAmount = Number(amount) || 0
  const remainingAfter = Math.max(0, amountDue - payAmount)

  const openCollect = (id: string, inv?: string) => {
    setStudentId(id)
    setInvoiceId(inv || "")
    const found = inv ? state.invoices.find((item) => item.id === inv) : undefined
    const due = found ? invoiceRemaining(found) : studentSummary(state, id)?.outstanding || 0
    setAmount(due ? String(due) : "")
    setTab("collect", id)
  }

  const collect = () => {
    if (!studentId) return
    const result = recordPayment(state, {
      studentId,
      amount: payAmount,
      date: payDate,
      method,
      txnId,
      remarks,
      invoiceId: invoiceId || undefined,
      createdBy: actor,
    })
    if (!result.ok) {
      addNotification({ title: "Payment not recorded", description: result.error, type: "fees" })
      return
    }
    update(result.state)
    setReceipt(result.payment)
    setTxnId("")
    setRemarks("")
    setAmount("")
    addNotification({
      title: "Payment recorded",
      description: `${result.payment.receiptNo} · ${formatCurrency(result.payment.amount)}`,
      type: "fees",
    })
  }

  const confirmCancel = () => {
    if (!cancelId) return
    const result = cancelPayment(state, cancelId, actor)
    setCancelId(null)
    if (!result.ok) {
      addNotification({ title: "Could not cancel", description: result.error, type: "fees" })
      return
    }
    update(result.state)
    addNotification({ title: "Payment cancelled", description: "Balances were recalculated.", type: "fees" })
  }

  const remind = (invoice: FeeInvoice) => {
    const result = sendFeeReminder(state, invoice.id, actor)
    if (!result.ok) return
    update(result.state)
    addNotification({ title: "Reminder sent", description: result.body, type: "fees" })
  }

  if (!ready) return <p className="text-xs text-muted-foreground py-16 text-center">Loading fees & payments...</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Fees & Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fee structure → assign → generate dues → collect → receipt → parent notice
          </p>
        </div>
        <Button size="sm" onClick={() => setTab("collect")}>Collect payment</Button>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="inline-flex items-center gap-1 rounded-lg bg-secondary p-1 border border-border/40 min-w-max">
          {TABS.map((item) => (
            <button
              key={`fee-tab-${item.id}`}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${
                tab === item.id ? "bg-card text-primary shadow-xs border border-border" : "text-muted-foreground hover:text-primary hover:bg-accent/70"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Main Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col justify-between transition-all hover:bg-primary/10">
              <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2"><IndianRupee className="h-4 w-4" /> Total Fees</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight">{formatCurrency(stats.total)}</h2>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex flex-col justify-between transition-all hover:bg-emerald-500/10">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Collected</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight">{formatCurrency(stats.collected)}</h2>
              <p className="mt-1 text-[10px] text-emerald-600/80 font-bold uppercase tracking-wider">{stats.paidStudents} students fully paid</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex flex-col justify-between transition-all hover:bg-amber-500/10">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-2"><Clock className="h-4 w-4" /> Outstanding</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight">{formatCurrency(stats.outstanding)}</h2>
              <p className="mt-1 text-[10px] text-amber-600/80 font-bold uppercase tracking-wider">{stats.partialStudents} students partially paid</p>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 flex flex-col justify-between transition-all hover:bg-rose-500/10">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Overdue</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight">{formatCurrency(stats.overdue)}</h2>
              <p className="mt-1 text-[10px] text-rose-600/80 font-bold uppercase tracking-wider">{stats.pendingStudents} students pending</p>
            </div>
          </div>
          
          {/* Today Collection Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-border bg-card shadow-xs">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-semibold">
              Today's Collection <span className="text-muted-foreground ml-1 font-medium">({formatFeeDate(FEE_TODAY)})</span> <span className="mx-2 text-border">|</span> <strong className="text-foreground text-sm tracking-tight">{formatCurrency(stats.todayCollection)}</strong>
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <OverviewList
              title="Recent payments"
              rows={livePayments.slice(0, 6).map((item) => {
                const student = studentById(state, item.studentId)
                return { id: item.id, title: student?.name || item.studentId, meta: `${item.receiptNo} · ${formatFeeDate(item.date)}`, amount: item.amount }
              })}
            />
            <OverviewList
              title="Upcoming dues"
              rows={upcoming.slice(0, 6).map((item) => {
                const student = studentById(state, item.studentId)
                return { id: item.id, title: student?.name || item.studentId, meta: `${item.label} · ${formatFeeDate(item.dueDate)}`, amount: invoiceRemaining(item) }
              })}
            />
            <OverviewList
              title="Overdue payments"
              rows={overdue.slice(0, 6).map((item) => {
                const student = studentById(state, item.studentId)
                return { id: item.id, title: student?.name || item.studentId, meta: `${item.label} · ${daysOverdue(item.dueDate)} days`, amount: invoiceRemaining(item) }
              })}
            />
          </div>
        </div>
      )}

      {tab === "structures" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">Fee Structures</h3>
              <p className="text-xs font-medium text-muted-foreground">Manage templates for class-wise billing</p>
            </div>
            <Button size="sm" className="shadow-xs" onClick={() => { setEditingStructure(null); setStructureOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" /> New structure
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {state.structures.map((structure) => {
              const lines = structureLines(structure, true)
              return (
                <div key={structure.id} className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="p-6 border-b border-border/50 bg-gradient-to-br from-primary/5 to-transparent relative">
                    <div className="absolute top-6 right-6">
                      <Badge variant={structure.status === "active" ? "success" : "secondary"} className="uppercase text-[9px] tracking-wider font-bold shadow-xs">
                        {structure.status}
                      </Badge>
                    </div>
                    <h4 className="text-xl font-black tracking-tight text-foreground pr-16 truncate">{structure.className}</h4>
                    <p className="text-xs font-bold text-primary/80 mt-1 uppercase tracking-wider">{structure.academicYear} · {structure.branch}</p>
                    
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl font-black tracking-tight">{formatCurrency(structureTotal(structure, true))}</span>
                      <span className="text-xs text-muted-foreground font-bold">/ yr</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                      incl. transport <span className="opacity-70">(without: {formatCurrency(structureTotal(structure, false))})</span>
                    </p>
                  </div>
                  
                  <div className="flex-1 p-6 space-y-4 bg-card/40">
                    <div className="space-y-4">
                      {lines.map((item) => (
                        <div key={`${structure.id}-${item.id}`} className="flex items-start justify-between gap-3 text-sm">
                          <div className="flex items-start gap-2.5">
                            <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${item.required ? 'text-primary' : 'text-muted-foreground/40'}`} />
                            <div>
                              <p className="font-bold text-foreground leading-tight">{item.name}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                                {frequencyLabel(item.frequency)} {item.required ? "" : "· Opt"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-foreground">{formatCurrency(item.amount)}</p>
                            {(item.frequency === "monthly" || item.frequency === "term") && (
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{formatCurrency(item.yearly)}/yr</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-border/50 bg-muted/10">
                    <Button variant="outline" className="w-full text-xs font-bold bg-card" onClick={() => { setEditingStructure(structure); setStructureOpen(true) }}>
                      Edit Structure
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === "students" && (
        <div className="space-y-3">
          <FilterRow
            query={query} setQuery={setQuery}
            branch={branch} setBranch={setBranch}
            klass={klass} setKlass={setKlass} classes={classes}
            status={status} setStatus={setStatus}
          />
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>Assign fees</Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  {["Student", "ID", "Parent", "Class", "Total", "Discount", "Payable", "Paid", "Outstanding", "Status", ""].map((h) => (
                    <th key={`st-h-${h || "act"}`} className="text-left font-medium p-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((item) => (
                  <tr key={`st-${item.student.id}`} className="border-t border-border/60">
                    <td className="p-3 font-semibold">{item.student.name}</td>
                    <td className="p-3">{item.student.studentCode}</td>
                    <td className="p-3">{item.student.parentName}</td>
                    <td className="p-3">{item.student.className}</td>
                    <td className="p-3">{formatCurrency(item.total)}</td>
                    <td className="p-3">{formatCurrency(item.discount)}</td>
                    <td className="p-3">{formatCurrency(item.payable)}</td>
                    <td className="p-3">{formatCurrency(item.paid)}</td>
                    <td className="p-3">{formatCurrency(item.outstanding)}</td>
                    <td className="p-3"><Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDetailId(item.student.id)}>Details</Button>
                        {item.outstanding > 0 && <Button size="sm" variant="outline" onClick={() => openCollect(item.student.id)}>Collect</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalStudentPages > 1 && (
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-xs text-muted-foreground">
                Showing {((studentPage - 1) * STUDENT_PAGE_SIZE) + 1} to {Math.min(studentPage * STUDENT_PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={studentPage === 1} onClick={() => setStudentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium">Page {studentPage} of {totalStudentPages}</span>
                <Button size="sm" variant="outline" disabled={studentPage === totalStudentPages} onClick={() => setStudentPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "dues" && (
        <div className="space-y-4">
          <FilterRow query={query} setQuery={setQuery} branch={branch} setBranch={setBranch} klass={klass} setKlass={setKlass} classes={classes} status={status} setStatus={setStatus} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardContent className="p-4"><p className="text-[11px] uppercase text-muted-foreground">Upcoming</p><p className="text-xl font-bold">{upcoming.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-[11px] uppercase text-muted-foreground">Due today</p><p className="text-xl font-bold">{dueToday.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-[11px] uppercase text-muted-foreground">Overdue</p><p className="text-xl font-bold">{overdue.length}</p></CardContent></Card>
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 text-xs max-w-xs">
            <option value="all">All fee types</option>
            {FEE_TYPES.map((item) => <option key={`ft-${item.id}`} value={item.id}>{item.label}</option>)}
          </Select>
          <DuesTable
            rows={filteredDues.sort((a, b) => a.dueDate.localeCompare(b.dueDate))}
            stateStudents={state.students}
            onCollect={(inv) => openCollect(inv.studentId, inv.id)}
            onRemind={remind}
          />
        </div>
      )}

      {tab === "collect" && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-sm">Collect payment</CardTitle>
            <CardDescription>Record a full or partial collection. Amount cannot exceed outstanding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={studentId} onChange={(e) => { setStudentId(e.target.value); setInvoiceId(""); setAmount("") }} className="h-9 text-xs">
              <option value="">Select student</option>
              {state.students.map((item) => <option key={`pay-st-${item.id}`} value={item.id}>{item.name} · {item.className}</option>)}
            </Select>
            {selectedSummary && (
              <div className="rounded-lg border border-border/60 p-3 text-xs space-y-1">
                <p>Amount due: <strong>{formatCurrency(amountDue)}</strong></p>
                <p>Payable: {formatCurrency(selectedSummary.payable)} · Paid: {formatCurrency(selectedSummary.paid)} · Outstanding: {formatCurrency(selectedSummary.outstanding)}</p>
              </div>
            )}
            <Select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="h-9 text-xs" disabled={!studentId}>
              <option value="">Allocate oldest dues first</option>
              {studentId && studentInvoices(state, studentId).filter((item) => invoiceRemaining(item) > 0).map((item) => (
                <option key={`pay-inv-${item.id}`} value={item.id}>{item.label} · {formatCurrency(invoiceRemaining(item))} · {formatFeeDate(item.dueDate)}</option>
              ))}
            </Select>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Payment amount" className="h-9 text-xs" />
            {payAmount > 0 && selectedSummary && (
              <p className="text-xs text-muted-foreground">
                Total due {formatCurrency(amountDue)} · Paid {formatCurrency(payAmount)} · Remaining {formatCurrency(remainingAfter)}
                {payAmount < amountDue ? " · Status after save: Partially Paid" : payAmount === amountDue ? " · Status after save: Paid" : ""}
              </p>
            )}
            <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="h-9 text-xs" />
            <Select value={method} onChange={(e) => setMethod(e.target.value as PayMethodId)} className="h-9 text-xs">
              {PAY_METHODS.map((item) => <option key={`pm-${item.id}`} value={item.id}>{item.label}</option>)}
            </Select>
            <Input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="Transaction / reference number" className="h-9 text-xs" />
            <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks" className="h-9 text-xs" />
            <Button size="sm" onClick={collect} disabled={!studentId || payAmount <= 0}>Record payment</Button>
          </CardContent>
        </Card>
      )}


      {tab === "discounts" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" icon={Plus} onClick={() => setDiscountOpen(true)}>Apply concession</Button>
          </div>
          {state.discounts.map((item) => {
            const student = studentById(state, item.studentId)
            return (
              <Card key={item.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{student?.name} · {DISCOUNT_TYPES.find((d) => d.id === item.type)?.label}</p>
                    <p className="text-xs text-muted-foreground">{item.reason} · Approved by {item.approvedBy} on {formatFeeDate(item.approvedAt.slice(0, 10))}</p>
                  </div>
                  <p className="text-sm font-bold">{formatCurrency(item.amount)}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {tab === "receipts" && (
        <div className="space-y-2">
          {livePayments.map((item) => {
            const student = studentById(state, item.studentId)
            return (
              <Card key={`rcpt-${item.id}`}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{item.receiptNo} · {student?.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFeeDate(item.date)} · {formatCurrency(item.amount)} · {methodLabel(item.method)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" icon={Download} onClick={() => downloadReceipt(state, item)}>Download</Button>
                    <Button size="sm" variant="outline" icon={Printer} onClick={() => printReceipt(state, item)}>Print</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Send}
                      onClick={() => {
                        const result = sendFeeReminder(state, studentInvoices(state, item.studentId)[0]?.id || "", actor)
                        if (result.ok) {
                          update(result.state)
                          addNotification({ title: "Receipt sent to parent", description: `${item.receiptNo} notified on parent app.`, type: "fees" })
                        }
                      }}
                    >
                      Send to parent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {tab === "reports" && (
        <ReportsPanel
          state={state}
          stats={stats}
          range={reportRange}
          setRange={setReportRange}
          classes={classes}
        />
      )}


      <Dialog isOpen={Boolean(receipt)} onClose={() => setReceipt(null)} title="Payment receipt" description="PAID collection recorded for this child." className="max-w-lg">
        {receipt && (
          <ReceiptBody
            payment={receipt}
            studentName={studentById(state, receipt.studentId)?.name || ""}
            studentCode={studentById(state, receipt.studentId)?.studentCode || ""}
            className={studentById(state, receipt.studentId)?.className || ""}
            outstanding={studentSummary(state, receipt.studentId)?.outstanding || 0}
            onDownload={() => downloadReceipt(state, receipt)}
            onPrint={() => printReceipt(state, receipt)}
            onSend={() => {
              addNotification({ title: "Receipt sent to parent", description: `${receipt.receiptNo} notified on parent app.`, type: "fees" })
            }}
          />
        )}
      </Dialog>

      <Dialog isOpen={Boolean(cancelId)} onClose={() => setCancelId(null)} title="Cancel this payment?" description="This reverses the collection and recalculates outstanding. Use only for corrections.">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setCancelId(null)}>Keep payment</Button>
          <Button size="sm" variant="destructive" onClick={confirmCancel}>Cancel payment</Button>
        </div>
      </Dialog>

      <StudentDetail
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        studentId={detailId}
        state={state}
        onCollect={openCollect}
      />

      <StructureDialog
        open={structureOpen}
        onClose={() => setStructureOpen(false)}
        initial={editingStructure}
        onSave={(structure) => {
          update(upsertStructure(state, structure, actor))
          setStructureOpen(false)
          addNotification({ title: "Fee structure saved", description: `${structure.className} · ${structure.academicYear}`, type: "fees" })
        }}
      />

      <AssignDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        state={state}
        onAssign={(sid, structureId, transport, schedule) => {
          const result = assignStructure(state, sid, structureId, transport, schedule, actor)
          if (!result.ok) {
            addNotification({ title: "Could not assign fees", description: result.error, type: "fees" })
            return
          }
          update(result.state)
          setAssignOpen(false)
          addNotification({ title: "Fees assigned", description: "Dues were generated for this child.", type: "fees" })
        }}
      />

      <DiscountDialog
        open={discountOpen}
        onClose={() => setDiscountOpen(false)}
        state={state}
        onApply={(sid, type, mode, value, reason) => {
          const result = applyDiscount(state, { studentId: sid, type, mode, value, reason, approvedBy: actor })
          if (!result.ok) {
            addNotification({ title: "Concession not applied", description: result.error, type: "fees" })
            return
          }
          update(result.state)
          setDiscountOpen(false)
          addNotification({ title: "Concession approved", description: formatCurrency(result.discount.amount), type: "fees" })
        }}
      />

      {tab === "overview" && state.notices[0] && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Bell className="h-3 w-3" /> Latest parent notice: {state.notices[0].body}
        </p>
      )}
    </div>
  )
}

function FilterRow({
  query, setQuery, branch, setBranch, klass, setKlass, classes, status, setStatus,
}: {
  query: string
  setQuery: (v: string) => void
  branch: string
  setBranch: (v: string) => void
  klass: string
  setKlass: (v: string) => void
  classes: string[]
  status: string
  setStatus: (v: string) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student" className="h-9 text-xs" />
      <Select value={branch} onChange={(e) => setBranch(e.target.value)} className="h-9 text-xs">
        <option value="all">All branches</option>
        {BRANCHES.map((item) => <option key={`br-${item}`} value={item}>{item}</option>)}
      </Select>
      <Select value={klass} onChange={(e) => setKlass(e.target.value)} className="h-9 text-xs">
        <option value="all">All classes</option>
        {classes.map((item) => <option key={`cl-${item}`} value={item}>{item}</option>)}
      </Select>
      <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 text-xs">
        <option value="all">All statuses</option>
        <option value="paid">Paid</option>
        <option value="partial">Partially paid</option>
        <option value="pending">Pending</option>
        <option value="overdue">Overdue</option>
      </Select>
    </div>
  )
}

function OverviewList({ title, rows }: { title: string; rows: Array<{ id: string; title: string; meta: string; amount: number }> }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-xs overflow-hidden flex flex-col h-[380px]">
      <div className="px-5 py-4 border-b border-border/40 bg-muted/10">
        <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
      </div>
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        {rows.length === 0 && <p className="p-4 text-xs text-center text-muted-foreground">None right now.</p>}
        {rows.map((row) => (
          <div key={row.id} className="group flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors cursor-default">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="text-sm font-black">{row.title.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{row.title}</p>
                <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">{row.meta}</p>
              </div>
            </div>
            <span className="text-xs font-bold whitespace-nowrap text-foreground">{formatCurrency(row.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DuesTable({
  rows,
  stateStudents,
  onCollect,
  onRemind,
}: {
  rows: FeeInvoice[]
  stateStudents: { id: string; name: string; parentName: string; className: string }[]
  onCollect: (invoice: FeeInvoice) => void
  onRemind: (invoice: FeeInvoice) => void
}) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 10

  React.useEffect(() => {
    setCurrentPage(1)
  }, [rows.length])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const paginatedRows = React.useMemo(() => {
    const start = (safePage - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, safePage, pageSize])

  const paginationStart = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const paginationEnd = Math.min(safePage * pageSize, rows.length)

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            {["Student", "Parent", "Class", "Fee", "Amount", "Due", "Days overdue", "Status", ""].map((h) => (
              <th key={`due-h-${h || "act"}`} className="text-left font-medium p-3 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="p-8 text-center text-muted-foreground">
                No due invoices found matching filters.
              </td>
            </tr>
          ) : (
            paginatedRows.map((item) => {
              const student = stateStudents.find((row) => row.id === item.studentId)
              return (
                <tr key={item.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-semibold text-foreground">{student?.name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{student?.parentName || "—"}</td>
                  <td className="p-3 text-foreground">{student?.className || "—"}</td>
                  <td className="p-3 text-foreground font-medium">{item.label}</td>
                  <td className="p-3 font-semibold text-foreground">{formatCurrency(invoiceRemaining(item))}</td>
                  <td className="p-3 whitespace-nowrap font-mono text-muted-foreground">{formatFeeDate(item.dueDate)}</td>
                  <td className="p-3 text-muted-foreground">{item.dueDate < FEE_TODAY ? daysOverdue(item.dueDate) : "—"}</td>
                  <td className="p-3"><Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge></td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => onCollect(item)}>Collect</Button>
                      <Button size="sm" variant="ghost" onClick={() => onRemind(item)}>Send reminder</Button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {rows.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="text-[11px] text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{paginationStart}</span> to{" "}
            <span className="font-semibold text-foreground">{paginationEnd}</span> of{" "}
            <span className="font-semibold text-foreground">{rows.length}</span> dues
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 text-xs px-2.5 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <span className="text-xs font-semibold text-foreground px-2">
              Page {safePage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 text-xs px-2.5 cursor-pointer"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ReceiptBody({
  payment, studentName, studentCode, className, outstanding, onDownload, onPrint, onSend,
}: {
  payment: FeePayment
  studentName: string
  studentCode: string
  className: string
  outstanding: number
  onDownload: () => void
  onPrint: () => void
  onSend: () => void
}) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">AK</div>
      <p className="font-bold text-lg">ARKA KIDS</p>
      <p className="text-xs text-muted-foreground">Play school fee receipt</p>
      <div className="rounded-lg border border-success/30 bg-success-light px-3 py-2 text-success font-black tracking-[0.2em] w-fit">
        {outstanding === 0 ? "PAID" : "PARTIAL"}
      </div>
      <p><strong>Receipt:</strong> {payment.receiptNo}</p>
      <p><strong>Date:</strong> {formatFeeDate(payment.date)}</p>
      <p><strong>Student:</strong> {studentName} ({studentCode})</p>
      <p><strong>Class:</strong> {className}</p>
      <p><strong>Amount paid:</strong> {formatCurrency(payment.amount)}</p>
      <p><strong>Method:</strong> {methodLabel(payment.method)}</p>
      <p><strong>Transaction ID:</strong> {payment.txnId || "—"}</p>
      <p><strong>Remaining balance:</strong> {formatCurrency(outstanding)}</p>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button size="sm" variant="outline" icon={Download} onClick={onDownload}>Download</Button>
        <Button size="sm" variant="outline" icon={Printer} onClick={onPrint}>Print</Button>
        <Button size="sm" variant="outline" icon={Send} onClick={onSend}>Send to parent</Button>
      </div>
    </div>
  )
}

function StudentDetail({
  open, onClose, studentId, state, onCollect,
}: {
  open: boolean
  onClose: () => void
  studentId: string | null
  state: ReturnType<typeof usePreschoolFees>["state"]
  onCollect: (id: string) => void
}) {
  const summary = studentId ? studentSummary(state, studentId) : null
  if (!summary) {
    return <Dialog isOpen={open} onClose={onClose} title="Student fees">{null}</Dialog>
  }
  const invoices = studentInvoices(state, summary.student.id)
  const payments = studentPayments(state, summary.student.id)
  const discounts = studentDiscounts(state, summary.student.id)
  const structure = state.structures.find((item) => item.id === summary.student.structureId)
  return (
    <Dialog isOpen={open} onClose={onClose} title={`${summary.student.name}`} description={`${summary.student.className} · ${summary.student.academicYear} · ${summary.student.studentCode}`} className="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <Stat label="Total" value={formatCurrency(summary.total)} />
          <Stat label="Paid" value={formatCurrency(summary.paid)} />
          <Stat label="Outstanding" value={formatCurrency(summary.outstanding)} />
          <Stat label="Overdue" value={formatCurrency(summary.overdue)} />
          <Stat label="Next due" value={summary.nextDueDate ? formatFeeDate(summary.nextDueDate) : "—"} />
        </div>
        {structure && (
          <div className="text-xs space-y-1">
            {structureLines(structure, summary.student.includeTransport).map((item) => (
              <p key={`line-${summary.student.id}-${item.id}`}>{item.name}: {formatCurrency(item.yearly)}</p>
            ))}
            {summary.discount > 0 && <p>Discount: {formatCurrency(summary.discount)}</p>}
            <p className="font-bold">Final payable: {formatCurrency(summary.payable)}</p>
          </div>
        )}
        <div className="space-y-2">
          {invoices.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs">
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-muted-foreground">{formatCurrency(item.amount)} · due {formatFeeDate(item.dueDate)}</p>
              </div>
              <Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>
            </div>
          ))}
        </div>
        {discounts.map((item) => (
          <p key={item.id} className="text-xs text-muted-foreground">{item.reason} · {formatCurrency(item.amount)}</p>
        ))}
        <div className="space-y-1">
          {payments.filter((item) => item.status === "paid").map((item) => (
            <p key={item.id} className="text-xs">{formatFeeDate(item.date)} · {item.receiptNo} · {formatCurrency(item.amount)} · {methodLabel(item.method)}</p>
          ))}
        </div>
        {summary.outstanding > 0 && (
          <Button size="sm" onClick={() => { onClose(); onCollect(summary.student.id) }}>Collect payment</Button>
        )}
      </div>
    </Dialog>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  )
}

function StructureDialog({
  open, onClose, initial, onSave,
}: {
  open: boolean
  onClose: () => void
  initial: FeeStructure | null
  onSave: (structure: FeeStructure) => void
}) {
  const [className, setClassName] = React.useState("Nursery A")
  const [year, setYear] = React.useState(ACADEMIC_YEAR)
  const [status, setStatus] = React.useState<"active" | "inactive">("active")
  const [components, setComponents] = React.useState<FeeComponent[]>([])
  const [courses, setCourses] = React.useState<any[]>([])

  React.useEffect(() => {
    api.getCourses().then(data => {
      setCourses(data || [])
      if (data && data.length > 0 && !className && !initial) {
        setClassName(data[0].name)
      }
    }).catch(console.error)
  }, [open, initial, className])

  React.useEffect(() => {
    if (!open) return
    if (initial) {
      setClassName(initial.className)
      setYear(initial.academicYear)
      setStatus(initial.status)
      setComponents(initial.components)
    } else {
      setClassName(courses.length > 0 ? courses[0].name : "Nursery A")
      setYear(ACADEMIC_YEAR)
      setStatus("active")
      setComponents([])
    }
  }, [open, initial, courses])

  const addComponent = () => {
    setComponents((prev) => [
      ...prev,
      {
        id: `comp-${Date.now()}`,
        name: "Tuition Fee",
        type: "tuition",
        amount: 4000,
        frequency: "monthly",
        dueDate: "2026-06-10",
        required: true,
      },
    ])
  }

  return (
    <Dialog isOpen={open} onClose={onClose} title={initial ? "Edit fee structure" : "New fee structure"} className="max-w-2xl">
      <div className="space-y-4">
        {/* Header fields */}
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-muted-foreground font-semibold">Academic Year</label>
            <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2026-27" className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-muted-foreground font-semibold">Class / Program</label>
            <Select value={className} onChange={(e) => setClassName(e.target.value)} className="h-9 text-xs">
              <option value="">Select program</option>
              {courses.map((c) => (
                <option key={c.id || c._id} value={c.name}>{c.name}</option>
              ))}
              {className && !courses.find((c) => c.name === className) && (
                <option value={className}>{className}</option>
              )}
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-muted-foreground font-semibold">Status</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as "active" | "inactive")} className="h-9 text-xs">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>

        {/* Components */}
        <div className="space-y-3">
          {components.map((item, index) => (
            <div key={item.id} className="relative rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wide">Fee Head {index + 1}</h4>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive transition-colors" 
                  onClick={() => setComponents(prev => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">Fee Name</label>
                  <Input value={item.name} onChange={(e) => setComponents((prev) => prev.map((row, i) => i === index ? { ...row, name: e.target.value } : row))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">Fee Category</label>
                  <Select value={item.type} onChange={(e) => setComponents((prev) => prev.map((row, i) => i === index ? { ...row, type: e.target.value as FeeTypeId } : row))} className="h-8 text-xs">
                    {FEE_TYPES.map((type) => <option key={`${item.id}-${type.id}`} value={type.id}>{type.label}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">Amount (₹)</label>
                  <Input type="number" value={item.amount} onChange={(e) => setComponents((prev) => prev.map((row, i) => i === index ? { ...row, amount: Number(e.target.value) || 0 } : row))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">Frequency</label>
                  <Select value={item.frequency} onChange={(e) => setComponents((prev) => prev.map((row, i) => i === index ? { ...row, frequency: e.target.value as FrequencyId } : row))} className="h-8 text-xs">
                    {FREQUENCIES.map((freq) => <option key={`${item.id}-${freq.id}`} value={freq.id}>{freq.label}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">First Due Date</label>
                  <Input type="date" value={item.dueDate} onChange={(e) => setComponents((prev) => prev.map((row, i) => i === index ? { ...row, dueDate: e.target.value } : row))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground font-medium">Requirement</label>
                  <Select value={item.required ? "required" : "optional"} onChange={(e) => setComponents((prev) => prev.map((row, i) => i === index ? { ...row, required: e.target.value === "required" } : row))} className="h-8 text-xs">
                    <option value="required">Required</option>
                    <option value="optional">Optional</option>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" icon={Plus} onClick={addComponent}>Add fee head</Button>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
          <Button
            size="sm"
            onClick={() => onSave({
              id: initial?.id || `str-${Date.now()}`,
              academicYear: year.trim() || ACADEMIC_YEAR,
              branch: BRANCHES[0],
              className: className.trim() || "Class",
              status,
              components,
            })}
            disabled={!className.trim() || components.length === 0}
          >
            Save structure
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function AssignDialog({
  open, onClose, state, onAssign,
}: {
  open: boolean
  onClose: () => void
  state: ReturnType<typeof usePreschoolFees>["state"]
  onAssign: (studentId: string, structureId: string, transport: boolean, schedule: ScheduleId) => void
}) {
  const [studentId, setStudentId] = React.useState("")
  const [structureId, setStructureId] = React.useState(state.structures[0]?.id || "")
  const [transport, setTransport] = React.useState(false)
  const [schedule, setSchedule] = React.useState<ScheduleId>("monthly")
  const structure = state.structures.find((item) => item.id === structureId)
  const student = studentById(state, studentId)
  const lines = structure ? structureLines(structure, transport) : []
  const total = structure ? structureTotal(structure, transport) : 0

  return (
    <Dialog isOpen={open} onClose={onClose} title="Assign fees to student" description="Dues are generated from the class fee structure.">
      <div className="space-y-3">
        <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="h-9 text-xs">
          <option value="">Select student</option>
          {state.students.map((item) => <option key={`as-${item.id}`} value={item.id}>{item.name} · {item.className}</option>)}
        </Select>
        {student && (
          <p className="text-xs text-muted-foreground">{student.studentCode} · {student.parentName} · {student.branch} · {student.academicYear}</p>
        )}
        <Select value={structureId} onChange={(e) => setStructureId(e.target.value)} className="h-9 text-xs">
          {state.structures.map((item) => <option key={`astr-${item.id}`} value={item.id}>{item.className} · {item.academicYear}</option>)}
        </Select>
        <Select value={schedule} onChange={(e) => setSchedule(e.target.value as ScheduleId)} className="h-9 text-xs">
          {SCHEDULES.map((item) => <option key={`sch-${item.id}`} value={item.id}>{item.label}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={transport} onChange={(e) => setTransport(e.target.checked)} />
          Include transport fee
        </label>
        <div className="text-xs space-y-1">
          {lines.map((item) => <p key={`al-${item.id}`}>{item.name}: {formatCurrency(item.yearly)}</p>)}
          <p className="font-bold">Total: {formatCurrency(total)}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
          <Button size="sm" disabled={!studentId || !structureId} onClick={() => onAssign(studentId, structureId, transport, schedule)}>Assign & generate dues</Button>
        </div>
      </div>
    </Dialog>
  )
}

function DiscountDialog({
  open, onClose, state, onApply,
}: {
  open: boolean
  onClose: () => void
  state: ReturnType<typeof usePreschoolFees>["state"]
  onApply: (studentId: string, type: DiscountTypeId, mode: "amount" | "percent", value: number, reason: string) => void
}) {
  const [studentId, setStudentId] = React.useState("")
  const [type, setType] = React.useState<DiscountTypeId>("sibling")
  const [mode, setMode] = React.useState<"amount" | "percent">("amount")
  const [value, setValue] = React.useState("5000")
  const [reason, setReason] = React.useState("")
  const summary = studentId ? studentSummary(state, studentId) : null
  const numeric = Number(value) || 0
  const amount = summary ? (mode === "percent" ? Math.round((summary.total * numeric) / 100) : numeric) : 0

  return (
    <Dialog isOpen={open} onClose={onClose} title="Apply concession" description="Only franchise owners and head office can approve discounts.">
      <div className="space-y-3">
        <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="h-9 text-xs">
          <option value="">Select student</option>
          {state.students.map((item) => <option key={`ds-${item.id}`} value={item.id}>{item.name}</option>)}
        </Select>
        {summary && (
          <p className="text-xs">Total fee {formatCurrency(summary.total)} · Discount {formatCurrency(amount)} · Final payable {formatCurrency(Math.max(0, summary.payable - amount))}</p>
        )}
        <Select value={type} onChange={(e) => setType(e.target.value as DiscountTypeId)} className="h-9 text-xs">
          {DISCOUNT_TYPES.map((item) => <option key={`dt-${item.id}`} value={item.id}>{item.label}</option>)}
        </Select>
        <Select value={mode} onChange={(e) => setMode(e.target.value as "amount" | "percent")} className="h-9 text-xs">
          <option value="amount">Amount (₹)</option>
          <option value="percent">Percentage</option>
        </Select>
        <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="h-9 text-xs" />
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="h-9 text-xs" />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
          <Button size="sm" disabled={!studentId || !reason.trim() || numeric <= 0} onClick={() => onApply(studentId, type, mode, numeric, reason)}>
            Approve concession
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function ReportsPanel({
  state, stats, range, setRange, classes,
}: {
  state: ReturnType<typeof usePreschoolFees>["state"]
  stats: ReturnType<typeof dashboardStats>
  range: "daily" | "weekly" | "monthly" | "yearly"
  setRange: (value: "daily" | "weekly" | "monthly" | "yearly") => void
  classes: string[]
}) {
  const payments = state.payments.filter((item) => item.status === "paid")
  const inRange = payments.filter((item) => {
    if (range === "daily") return item.date === FEE_TODAY
    if (range === "weekly") {
      const start = new Date(`${FEE_TODAY}T00:00:00`)
      start.setDate(start.getDate() - 6)
      const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`
      return item.date >= from && item.date <= FEE_TODAY
    }
    if (range === "monthly") return item.date.startsWith(FEE_TODAY.slice(0, 7))
    return item.date.startsWith(FEE_TODAY.slice(0, 4))
  })
  const collected = inRange.reduce((sum, item) => sum + item.amount, 0)
  const methodRows = PAY_METHODS.map((method) => ({
    method: method.label,
    amount: payments.filter((item) => item.method === method.id).reduce((sum, item) => sum + item.amount, 0),
  }))
  const classRows = classes.map((className) => {
    const rows = stats.summaries.filter((item) => item.student.className === className)
    return {
      className,
      total: rows.reduce((sum, item) => sum + item.payable, 0),
      collected: rows.reduce((sum, item) => sum + item.paid, 0),
      outstanding: rows.reduce((sum, item) => sum + item.outstanding, 0),
      overdue: rows.reduce((sum, item) => sum + item.overdue, 0),
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["daily", "weekly", "monthly", "yearly"] as const).map((item) => (
          <Button key={`range-${item}`} size="sm" variant={range === item ? "primary" : "outline"} onClick={() => setRange(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </Button>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            downloadCsv(
              `fee-collection-${range}.csv`,
              ["Receipt", "Date", "Student", "Amount", "Method"],
              inRange.map((item) => [
                item.receiptNo,
                item.date,
                studentById(state, item.studentId)?.name || "",
                item.amount,
                methodLabel(item.method),
              ])
            )
          }
        >
          Export Excel
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.print()}>Print / PDF</Button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase text-muted-foreground">Collection ({range})</p><p className="text-xl font-bold">{formatCurrency(collected)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase text-muted-foreground">Outstanding</p><p className="text-xl font-bold">{formatCurrency(stats.outstanding)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] uppercase text-muted-foreground">Overdue</p><p className="text-xl font-bold">{formatCurrency(stats.overdue)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Class-wise collection</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-xs">
          {classRows.map((row) => (
            <div key={`cw-${row.className}`} className="flex flex-wrap gap-3 justify-between border-b border-border/50 pb-2">
              <span className="font-semibold">{row.className}</span>
              <span>Total {formatCurrency(row.total)}</span>
              <span>Collected {formatCurrency(row.collected)}</span>
              <span>Outstanding {formatCurrency(row.outstanding)}</span>
              <span>Overdue {formatCurrency(row.overdue)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Payment method</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-xs">
          {methodRows.map((row) => (
            <div key={`mr-${row.method}`} className="flex justify-between"><span>{row.method}</span><span className="font-semibold">{formatCurrency(row.amount)}</span></div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Outstanding students</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-xs">
          {stats.summaries.filter((item) => item.outstanding > 0).map((item) => (
            <div key={`os-${item.student.id}`} className="flex justify-between">
              <span>{item.student.name} · {item.student.className}</span>
              <span>{formatCurrency(item.outstanding)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
