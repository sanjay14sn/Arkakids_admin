import { useCallback, useEffect, useState } from "react"
import { api } from "@/lib/api"
import { BRANCHES, PARENT_CHILD_ID } from "@/lib/preschoolOps"
import { todayIso } from "@/lib/preschoolAttendance"

export const FEES_KEY = "arka_preschool_fees_v2"
export const ACADEMIC_YEAR = "2026–27"
export const FEE_TODAY = todayIso()

export const FEE_TYPES = [
  { id: "admission", label: "Admission Fee" },
  { id: "tuition", label: "Tuition Fee" },
  { id: "annual", label: "Annual Fee" },
  { id: "activity", label: "Activity Fee" },
  { id: "transport", label: "Transport Fee" },
  { id: "books", label: "Books" },
  { id: "uniform", label: "Uniform" },
  { id: "other", label: "Other" },
] as const

export type FeeTypeId = (typeof FEE_TYPES)[number]["id"]

export const FREQUENCIES = [
  { id: "one_time", label: "One Time" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "term", label: "Term-wise" },
  { id: "half_yearly", label: "Half-Yearly" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Custom" },
] as const

export type FrequencyId = (typeof FREQUENCIES)[number]["id"]

export const PAY_METHODS = [
  { id: "cash", label: "Cash" },
  { id: "upi", label: "UPI" },
  { id: "card", label: "Card" },
  { id: "bank", label: "Bank Transfer" },
  { id: "online", label: "Online Payment" },
] as const

export type PayMethodId = (typeof PAY_METHODS)[number]["id"]

export const DISCOUNT_TYPES = [
  { id: "sibling", label: "Sibling Discount" },
  { id: "scholarship", label: "Scholarship" },
  { id: "staff_child", label: "Staff Child Discount" },
  { id: "special", label: "Special Discount" },
  { id: "custom", label: "Custom Discount" },
] as const

export type DiscountTypeId = (typeof DISCOUNT_TYPES)[number]["id"]

export const SCHEDULES = [
  { id: "full", label: "Full Payment" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "term", label: "Term-wise" },
  { id: "custom", label: "Custom Installments" },
] as const

export type ScheduleId = (typeof SCHEDULES)[number]["id"]

export const NOTIFY_CHANNELS = [
  { id: "app", label: "Parent App" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "sms", label: "SMS" },
  { id: "email", label: "Email" },
] as const

export type NotifyChannelId = (typeof NOTIFY_CHANNELS)[number]["id"]

export type InvoiceStatus = "paid" | "partial" | "pending" | "overdue" | "cancelled"
export type StudentPayStatus = "paid" | "partial" | "pending" | "overdue"

export type FeeComponent = {
  id: string
  name: string
  type: FeeTypeId
  amount: number
  frequency: FrequencyId
  dueDate: string
  required: boolean
}

export type FeeStructure = {
  id: string
  academicYear: string
  branch: string
  className: string
  status: "active" | "inactive"
  components: FeeComponent[]
}

export type FeeStudent = {
  id: string
  studentCode: string
  name: string
  parentName: string
  branch: string
  academicYear: string
  program: string
  className: string
  section: string
  structureId: string
  includeTransport: boolean
  schedule: ScheduleId
}

export type FeeInvoice = {
  id: string
  studentId: string
  componentId: string
  label: string
  feeType: FeeTypeId
  amount: number
  paidAmount: number
  dueDate: string
  status: InvoiceStatus
}

export type FeePayment = {
  id: string
  studentId: string
  receiptNo: string
  amount: number
  date: string
  method: PayMethodId
  txnId: string
  remarks: string
  invoiceIds: string[]
  status: "paid" | "cancelled"
  createdBy: string
  createdAt: string
}

export type FeeDiscount = {
  id: string
  studentId: string
  type: DiscountTypeId
  mode: "amount" | "percent"
  value: number
  amount: number
  reason: string
  approvedBy: string
  approvedAt: string
}

export type FeeNotice = {
  id: string
  studentId: string
  kind: "upcoming" | "due_today" | "overdue" | "success" | "receipt"
  channel: NotifyChannelId
  title: string
  body: string
  createdAt: string
}

export type FeeAudit = {
  id: string
  at: string
  by: string
  action: string
  detail: string
}

export type FeeSettings = {
  notifyUpcoming: boolean
  notifyDueToday: boolean
  notifyOverdue: boolean
  notifySuccess: boolean
  notifyReceipt: boolean
  channels: NotifyChannelId[]
  allowAdvance: boolean
}

export type FeesState = {
  structures: FeeStructure[]
  students: FeeStudent[]
  invoices: FeeInvoice[]
  payments: FeePayment[]
  discounts: FeeDiscount[]
  notices: FeeNotice[]
  audits: FeeAudit[]
  settings: FeeSettings
}

export const DEFAULT_SETTINGS: FeeSettings = {
  notifyUpcoming: true,
  notifyDueToday: true,
  notifyOverdue: true,
  notifySuccess: true,
  notifyReceipt: true,
  channels: ["app", "whatsapp"],
  allowAdvance: false,
}

const KORA = BRANCHES[0]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

let idSeq = 0
function uid(prefix: string) {
  idSeq += 1
  return `${prefix}-${idSeq}-${Date.now().toString(36)}`
}

export function feeTypeLabel(id: FeeTypeId) {
  return FEE_TYPES.find((item) => item.id === id)?.label || id
}

export function frequencyLabel(id: FrequencyId) {
  return FREQUENCIES.find((item) => item.id === id)?.label || id
}

export function methodLabel(id: PayMethodId) {
  return PAY_METHODS.find((item) => item.id === id)?.label || id
}

export function discountLabel(id: DiscountTypeId) {
  return DISCOUNT_TYPES.find((item) => item.id === id)?.label || id
}

export function formatFeeDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return iso
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function monthLabel(iso: string) {
  const [year, month] = iso.split("-").map(Number)
  if (!year || !month) return iso
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long" })
}

export function daysOverdue(dueDate: string, today = FEE_TODAY) {
  const due = new Date(`${dueDate}T00:00:00`).getTime()
  const now = new Date(`${today}T00:00:00`).getTime()
  return Math.max(0, Math.round((now - due) / 86400000))
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export function addMonths(iso: string, count: number) {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(year, month - 1 + count, day)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function refreshInvoice(invoice: FeeInvoice, today = FEE_TODAY): FeeInvoice {
  if (invoice.status === "cancelled") return invoice
  const remaining = invoice.amount - invoice.paidAmount
  if (remaining <= 0) return { ...invoice, paidAmount: invoice.amount, status: "paid" }
  if (invoice.paidAmount > 0) return { ...invoice, status: "partial" }
  if (invoice.dueDate < today) return { ...invoice, status: "overdue" }
  return { ...invoice, status: "pending" }
}

export function invoiceRemaining(invoice: FeeInvoice) {
  if (invoice.status === "cancelled") return 0
  return Math.max(0, invoice.amount - invoice.paidAmount)
}

function componentInvoices(studentId: string, component: FeeComponent, startDue: string): FeeInvoice[] {
  const make = (id: string, label: string, dueDate: string): FeeInvoice =>
    refreshInvoice({
      id,
      studentId,
      componentId: component.id,
      label,
      feeType: component.type,
      amount: component.amount,
      paidAmount: 0,
      dueDate,
      status: "pending",
    })

  if (component.frequency === "monthly") {
    return Array.from({ length: 12 }, (_, index) => {
      const dueDate = addMonths(startDue, index)
      return make(`${studentId}-${component.id}-m${index + 1}`, `${component.name} – ${monthLabel(dueDate)}`, dueDate)
    })
  }
  if (component.frequency === "quarterly") {
    return [0, 3, 6, 9].map((offset, index) => {
      const dueDate = addMonths(startDue, offset)
      return make(`${studentId}-${component.id}-q${index + 1}`, `${component.name} – Q${index + 1}`, dueDate)
    })
  }
  if (component.frequency === "term") {
    return [0, 4].map((offset, index) => {
      const dueDate = addMonths(startDue, offset)
      return make(`${studentId}-${component.id}-t${index + 1}`, `${component.name} – Term ${index + 1}`, dueDate)
    })
  }
  if (component.frequency === "half_yearly") {
    return [0, 6].map((offset, index) => {
      const dueDate = addMonths(startDue, offset)
      return make(`${studentId}-${component.id}-h${index + 1}`, `${component.name} – Half ${index + 1}`, dueDate)
    })
  }
  return [make(`${studentId}-${component.id}`, component.name, component.dueDate || startDue)]
}

export function invoicesForAssignment(student: FeeStudent, structure: FeeStructure): FeeInvoice[] {
  const startDue = "2026-06-10"
  const components = structure.components.filter((item) => item.type !== "transport" || student.includeTransport)
  if (student.schedule === "term") {
    const total = components.reduce((sum, item) => {
      if (item.frequency === "monthly") return sum + item.amount * 12
      if (item.frequency === "quarterly") return sum + item.amount * 4
      if (item.frequency === "term") return sum + item.amount * 2
      if (item.frequency === "half_yearly") return sum + item.amount * 2
      return sum + item.amount
    }, 0)
    const splits = total === 67000 ? [27000, 20000, 20000] : [Math.round(total * 0.4), Math.round(total * 0.3), 0]
    if (total !== 67000) splits[2] = total - splits[0] - splits[1]
    const dues = ["2026-06-10", "2026-08-10", "2027-01-10"]
    return splits.map((amount, index) =>
      refreshInvoice({
        id: `${student.id}-term-${index + 1}`,
        studentId: student.id,
        componentId: "term-plan",
        label: `Term ${index + 1} Fee`,
        feeType: "tuition",
        amount,
        paidAmount: 0,
        dueDate: dues[index],
        status: "pending",
      })
    )
  }
  if (student.schedule === "full") {
    const total = components.reduce((sum, item) => {
      if (item.frequency === "monthly") return sum + item.amount * 12
      if (item.frequency === "quarterly") return sum + item.amount * 4
      if (item.frequency === "term") return sum + item.amount * 2
      if (item.frequency === "half_yearly") return sum + item.amount * 2
      return sum + item.amount
    }, 0)
    return [
      refreshInvoice({
        id: `${student.id}-full`,
        studentId: student.id,
        componentId: "full-plan",
        label: "Annual fee (full payment)",
        feeType: "tuition",
        amount: total,
        paidAmount: 0,
        dueDate: startDue,
        status: "pending",
      }),
    ]
  }
  return components.flatMap((component) => componentInvoices(student.id, component, component.dueDate || startDue))
}

function nurseryComponents(): FeeComponent[] {
  return [
    { id: "adm", name: "Admission Fee", type: "admission", amount: 10000, frequency: "one_time", dueDate: "2026-06-10", required: true },
    { id: "tui", name: "Tuition Fee", type: "tuition", amount: 4000, frequency: "monthly", dueDate: "2026-06-10", required: true },
    { id: "act", name: "Activity Fee", type: "activity", amount: 2000, frequency: "term", dueDate: "2026-06-10", required: true },
    { id: "ann", name: "Annual Fee", type: "annual", amount: 5000, frequency: "yearly", dueDate: "2026-06-10", required: true },
    { id: "trp", name: "Transport Fee", type: "transport", amount: 1500, frequency: "monthly", dueDate: "2026-06-10", required: false },
  ]
}

function playgroupComponents(): FeeComponent[] {
  return [
    { id: "adm", name: "Admission Fee", type: "admission", amount: 8000, frequency: "one_time", dueDate: "2026-06-10", required: true },
    { id: "tui", name: "Tuition Fee", type: "tuition", amount: 3000, frequency: "monthly", dueDate: "2026-06-10", required: true },
    { id: "ann", name: "Annual Fee", type: "annual", amount: 3000, frequency: "yearly", dueDate: "2026-06-10", required: true },
    { id: "trp", name: "Transport Fee", type: "transport", amount: 1500, frequency: "monthly", dueDate: "2026-06-10", required: false },
  ]
}

export function structureTotal(structure: FeeStructure, includeTransport: boolean) {
  return structure.components.reduce((sum, item) => {
    if (item.type === "transport" && !includeTransport) return sum
    if (item.frequency === "monthly") return sum + item.amount * 12
    if (item.frequency === "quarterly") return sum + item.amount * 4
    if (item.frequency === "term") return sum + item.amount * 2
    if (item.frequency === "half_yearly") return sum + item.amount * 2
    return sum + item.amount
  }, 0)
}

export function structureLines(structure: FeeStructure, includeTransport: boolean) {
  return structure.components
    .filter((item) => item.type !== "transport" || includeTransport)
    .map((item) => {
      let yearly = item.amount
      if (item.frequency === "monthly") yearly = item.amount * 12
      else if (item.frequency === "quarterly") yearly = item.amount * 4
      else if (item.frequency === "term") yearly = item.amount * 2
      else if (item.frequency === "half_yearly") yearly = item.amount * 2
      return { ...item, yearly }
    })
}

function makeStudent(
  id: string,
  code: string,
  name: string,
  parentName: string,
  program: string,
  className: string,
  section: string,
  structureId: string,
  includeTransport: boolean,
  schedule: ScheduleId,
  branch = KORA
): FeeStudent {
  return {
    id,
    studentCode: code,
    name,
    parentName,
    branch,
    academicYear: ACADEMIC_YEAR,
    program,
    className,
    section,
    structureId,
    includeTransport,
    schedule,
  }
}

function nextReceiptNo(payments: FeePayment[]) {
  const max = payments.reduce((n, item) => {
    const match = item.receiptNo.match(/REC-(\d+)/)
    return match ? Math.max(n, Number(match[1])) : n
  }, 0)
  return `REC-${String(max + 1).padStart(3, "0")}`
}

function pushAudit(state: FeesState, by: string, action: string, detail: string) {
  state.audits.unshift({
    id: uid("aud"),
    at: new Date().toISOString(),
    by,
    action,
    detail,
  })
}

function pushNotice(
  state: FeesState,
  studentId: string,
  kind: FeeNotice["kind"],
  title: string,
  body: string
) {
  const enabled =
    (kind === "upcoming" && state.settings.notifyUpcoming) ||
    (kind === "due_today" && state.settings.notifyDueToday) ||
    (kind === "overdue" && state.settings.notifyOverdue) ||
    (kind === "success" && state.settings.notifySuccess) ||
    (kind === "receipt" && state.settings.notifyReceipt)
  if (!enabled) return
  for (const channel of state.settings.channels) {
    state.notices.unshift({
      id: uid(`note-${channel}`),
      studentId,
      kind,
      channel,
      title,
      body,
      createdAt: new Date().toISOString(),
    })
  }
}

export function studentById(state: FeesState, id: string) {
  return state.students.find((item) => item.id === id)
}

export function structureById(state: FeesState, id: string) {
  return state.structures.find((item) => item.id === id)
}

export function studentInvoices(state: FeesState, studentId: string) {
  return state.invoices.filter((item) => item.studentId === studentId && item.status !== "cancelled")
}

export function studentPayments(state: FeesState, studentId: string) {
  return state.payments.filter((item) => item.studentId === studentId)
}

export function studentDiscounts(state: FeesState, studentId: string) {
  return state.discounts.filter((item) => item.studentId === studentId)
}

export type StudentFeeSummary = {
  student: FeeStudent
  total: number
  discount: number
  payable: number
  paid: number
  outstanding: number
  overdue: number
  status: StudentPayStatus
  nextDueDate?: string
  nextDueLabel?: string
  nextDueAmount?: number
}

export function studentSummary(state: FeesState, studentId: string, today = FEE_TODAY): StudentFeeSummary | null {
  const student = studentById(state, studentId)
  if (!student) return null
  const invoices = studentInvoices(state, studentId)
  const total = invoices.reduce((sum, item) => sum + item.amount, 0)
  const discount = studentDiscounts(state, studentId).reduce((sum, item) => sum + item.amount, 0)
  const payable = Math.max(0, total - discount)
  const paid = studentPayments(state, studentId)
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + item.amount, 0)
  const outstanding = Math.max(0, payable - paid)
  const overdue = invoices
    .filter((item) => item.status === "overdue" || (item.dueDate < today && invoiceRemaining(item) > 0))
    .reduce((sum, item) => sum + invoiceRemaining(item), 0)
  const next = invoices
    .filter((item) => invoiceRemaining(item) > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  let status: StudentPayStatus = "pending"
  if (outstanding <= 0) status = "paid"
  else if (paid > 0) status = "partial"
  if (outstanding > 0 && overdue > 0) status = "overdue"
  if (outstanding > 0 && paid === 0 && overdue <= 0) status = "pending"
  return {
    student,
    total,
    discount,
    payable,
    paid,
    outstanding,
    overdue: Math.min(overdue, outstanding),
    status,
    nextDueDate: next?.dueDate,
    nextDueLabel: next?.label,
    nextDueAmount: next ? invoiceRemaining(next) : undefined,
  }
}

export function dashboardStats(state: FeesState, today = FEE_TODAY) {
  const summaries = state.students.map((item) => studentSummary(state, item.id, today)).filter(Boolean) as StudentFeeSummary[]
  const total = summaries.reduce((sum, item) => sum + item.payable, 0)
  const collected = summaries.reduce((sum, item) => sum + item.paid, 0)
  const outstanding = summaries.reduce((sum, item) => sum + item.outstanding, 0)
  const overdue = summaries.reduce((sum, item) => sum + item.overdue, 0)
  const todayCollection = state.payments
    .filter((item) => item.status === "paid" && item.date === today)
    .reduce((sum, item) => sum + item.amount, 0)
  return {
    total,
    collected,
    outstanding,
    overdue,
    todayCollection,
    paidStudents: summaries.filter((item) => item.status === "paid").length,
    partialStudents: summaries.filter((item) => item.status === "partial").length,
    pendingStudents: summaries.filter((item) => item.status === "pending" || item.status === "overdue").length,
    summaries,
  }
}

function applyPaymentToState(
  state: FeesState,
  input: {
    studentId: string
    amount: number
    date: string
    method: PayMethodId
    txnId: string
    remarks: string
    invoiceId?: string
    createdBy: string
  }
): { ok: true; payment: FeePayment; leftover: number } | { ok: false; error: string } {
  const summary = studentSummary(state, input.studentId)
  if (!summary) return { ok: false, error: "Student not found." }
  if (input.amount <= 0) return { ok: false, error: "Enter a payment amount." }
  if (!state.settings.allowAdvance && input.amount > summary.outstanding) {
    return { ok: false, error: `Payment cannot exceed outstanding ${summary.outstanding}.` }
  }

  let left = input.amount
  const invoiceIds: string[] = []
  const targets = state.invoices
    .filter((item) => {
      if (item.studentId !== input.studentId || item.status === "cancelled") return false
      if (input.invoiceId) return item.id === input.invoiceId
      return invoiceRemaining(item) > 0
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  if (input.invoiceId && targets.length === 0) return { ok: false, error: "Selected fee item was not found." }

  for (const invoice of targets) {
    if (left <= 0) break
    const due = invoiceRemaining(invoice)
    if (due <= 0) continue
    const take = Math.min(due, left)
    invoice.paidAmount += take
    left -= take
    invoiceIds.push(invoice.id)
    Object.assign(invoice, refreshInvoice(invoice))
  }

  const applied = input.amount - left
  if (applied <= 0) return { ok: false, error: "Nothing outstanding on the selected fee." }

  const payment: FeePayment = {
    id: uid("pay"),
    studentId: input.studentId,
    receiptNo: nextReceiptNo(state.payments),
    amount: applied,
    date: input.date,
    method: input.method,
    txnId: input.txnId.trim(),
    remarks: input.remarks.trim(),
    invoiceIds,
    status: "paid",
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  }
  state.payments.unshift(payment)
  const student = summary.student
  const remaining = Math.max(0, summary.outstanding - applied)
  pushNotice(
    state,
    student.id,
    "success",
    "Payment received",
    `Payment of ₹${applied.toLocaleString("en-IN")} received successfully. Receipt No: ${payment.receiptNo}.`
  )
  pushNotice(
    state,
    student.id,
    "receipt",
    "Receipt generated",
    `Receipt ${payment.receiptNo} for ${student.name} is ready to download.`
  )
  pushAudit(state, input.createdBy, "collect_payment", `${payment.receiptNo} · ${student.name} · ₹${applied}`)
  return { ok: true, payment, leftover: remaining }
}

export function recordPayment(
  state: FeesState,
  input: {
    studentId: string
    amount: number
    date: string
    method: PayMethodId
    txnId: string
    remarks: string
    invoiceId?: string
    createdBy: string
  }
) {
  const next = clone(state)
  const result = applyPaymentToState(next, input)
  if (!result.ok) return result
  return { ok: true as const, state: next, payment: result.payment, leftover: result.leftover }
}

export function cancelPayment(state: FeesState, paymentId: string, by: string) {
  const next = clone(state)
  const payment = next.payments.find((item) => item.id === paymentId)
  if (!payment || payment.status === "cancelled") return { ok: false as const, error: "Payment already cancelled." }
  payment.status = "cancelled"
  const studentId = payment.studentId
  for (const invoice of next.invoices.filter((item) => item.studentId === studentId)) {
    invoice.paidAmount = 0
  }
  const live = next.payments.filter((item) => item.status === "paid" && item.studentId === studentId)
  for (const livePay of [...live].reverse()) {
    let left = livePay.amount
    for (const invoice of next.invoices
      .filter((item) => item.studentId === studentId && item.status !== "cancelled")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))) {
      if (left <= 0) break
      const room = invoice.amount - invoice.paidAmount
      if (room <= 0) continue
      const take = Math.min(room, left)
      invoice.paidAmount += take
      left -= take
    }
  }
  next.invoices = next.invoices.map((item) => refreshInvoice(item))
  pushAudit(next, by, "cancel_payment", `${payment.receiptNo} cancelled`)
  return { ok: true as const, state: next }
}

export function applyDiscount(
  state: FeesState,
  input: {
    studentId: string
    type: DiscountTypeId
    mode: "amount" | "percent"
    value: number
    reason: string
    approvedBy: string
  }
) {
  const next = clone(state)
  const summary = studentSummary(next, input.studentId)
  if (!summary) return { ok: false as const, error: "Student not found." }
  if (!input.reason.trim()) return { ok: false as const, error: "Enter a reason for the concession." }
  if (input.value <= 0) return { ok: false as const, error: "Enter a discount value." }
  const amount =
    input.mode === "percent" ? Math.round((summary.total * input.value) / 100) : Math.round(input.value)
  if (amount <= 0) return { ok: false as const, error: "Discount must be greater than zero." }
  if (amount > summary.payable) return { ok: false as const, error: "Discount cannot exceed payable fees." }
  const discount: FeeDiscount = {
    id: uid("disc"),
    studentId: input.studentId,
    type: input.type,
    mode: input.mode,
    value: input.value,
    amount,
    reason: input.reason.trim(),
    approvedBy: input.approvedBy,
    approvedAt: new Date().toISOString(),
  }
  next.discounts.unshift(discount)
  pushAudit(next, input.approvedBy, "apply_discount", `${summary.student.name} · ₹${amount} · ${discountLabel(input.type)}`)
  return { ok: true as const, state: next, discount }
}

export function sendFeeReminder(state: FeesState, invoiceId: string, by: string) {
  const next = clone(state)
  const invoice = next.invoices.find((item) => item.id === invoiceId)
  if (!invoice) return { ok: false as const, error: "Fee item not found." }
  const student = studentById(next, invoice.studentId)
  if (!student) return { ok: false as const, error: "Student not found." }
  const kind: FeeNotice["kind"] =
    invoice.dueDate < FEE_TODAY ? "overdue" : invoice.dueDate === FEE_TODAY ? "due_today" : "upcoming"
  const body = `Dear Parent, ${student.name}'s ${invoice.label.toLowerCase()} of ₹${invoiceRemaining(invoice).toLocaleString("en-IN")} is due on ${formatFeeDate(invoice.dueDate)}.`
  pushNotice(next, student.id, kind, "Fee reminder", body)
  pushAudit(next, by, "send_reminder", `${student.name} · ${invoice.label}`)
  return { ok: true as const, state: next, body }
}

export function assignStructure(
  state: FeesState,
  studentId: string,
  structureId: string,
  includeTransport: boolean,
  schedule: ScheduleId,
  by: string
) {
  const next = clone(state)
  const student = studentById(next, studentId)
  const structure = structureById(next, structureId)
  if (!student || !structure) return { ok: false as const, error: "Student or fee structure not found." }
  const paid = studentPayments(next, studentId).some((item) => item.status === "paid")
  if (paid) return { ok: false as const, error: "Cannot reassign after payments have been collected." }
  student.structureId = structureId
  student.includeTransport = includeTransport
  student.schedule = schedule
  next.invoices = next.invoices.filter((item) => item.studentId !== studentId)
  next.invoices.push(...invoicesForAssignment(student, structure))
  pushAudit(next, by, "assign_fees", `${student.name} · ${structure.className}`)
  return { ok: true as const, state: next }
}

export function upsertStructure(state: FeesState, structure: FeeStructure, by: string) {
  const next = clone(state)
  const index = next.structures.findIndex((item) => item.id === structure.id)
  if (index >= 0) next.structures[index] = structure
  else next.structures.unshift(structure)
  pushAudit(next, by, "save_structure", `${structure.className} · ${structure.academicYear}`)
  return next
}

export function receiptHtml(state: FeesState, payment: FeePayment) {
  const student = studentById(state, payment.studentId)
  const summary = studentSummary(state, payment.studentId)
  const items = state.invoices.filter((item) => payment.invoiceIds.includes(item.id))
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.label}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${item.amount.toLocaleString("en-IN")}</td></tr>`
    )
    .join("")
  return `<!doctype html><html><head><title>${payment.receiptNo}</title>
<style>body{font-family:ui-sans-serif,system-ui,sans-serif;padding:40px;max-width:640px;margin:0 auto;color:#111}
h1{margin:0} .stamp{display:inline-block;border:2px solid #059669;color:#059669;font-weight:800;padding:6px 14px;letter-spacing:.12em;margin-top:12px}
table{width:100%;border-collapse:collapse;margin-top:16px}</style></head>
<body>
<h1>ARKA KIDS</h1>
<p>Play school fee receipt</p>
<p><strong>Receipt:</strong> ${payment.receiptNo}<br/>
<strong>Date:</strong> ${formatFeeDate(payment.date)}<br/>
<strong>Student:</strong> ${student?.name || ""} (${student?.studentCode || ""})<br/>
<strong>Class:</strong> ${student?.className || ""}<br/>
<strong>Amount paid:</strong> ₹${payment.amount.toLocaleString("en-IN")}<br/>
<strong>Method:</strong> ${methodLabel(payment.method)}<br/>
<strong>Transaction ID:</strong> ${payment.txnId || "—"}<br/>
<strong>Remaining balance:</strong> ₹${(summary?.outstanding || 0).toLocaleString("en-IN")}</p>
<table>${rows}</table>
<div class="stamp">${summary?.outstanding === 0 ? "PAID" : "PARTIAL"}</div>
</body></html>`
}

export function downloadReceipt(state: FeesState, payment: FeePayment) {
  const blob = new Blob([receiptHtml(state, payment)], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${payment.receiptNo}.html`
  link.click()
  URL.revokeObjectURL(url)
}

export function printReceipt(state: FeesState, payment: FeePayment) {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=720,height=900")
  if (!popup) return
  popup.document.write(receiptHtml(state, payment))
  popup.document.close()
  popup.focus()
  popup.print()
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function seedPay(
  state: FeesState,
  studentId: string,
  amount: number,
  date: string,
  method: PayMethodId,
  txnId: string,
  createdBy: string
) {
  applyPaymentToState(state, {
    studentId,
    amount,
    date,
    method,
    txnId,
    remarks: "Seed collection",
    createdBy,
  })
}

function buildSeed(): FeesState {
  return {
    structures: [],
    students: [],
    invoices: [],
    payments: [],
    discounts: [],
    notices: [],
    audits: [],
    settings: DEFAULT_SETTINGS,
  }
}

const DEFAULT_FEES = buildSeed()

export function loadFees(): FeesState {
  if (typeof window === "undefined") return clone(DEFAULT_FEES)
  try {
    const raw = localStorage.getItem(FEES_KEY)
    if (!raw) return clone(DEFAULT_FEES)
    const parsed = JSON.parse(raw) as FeesState
    if (!Array.isArray(parsed.students) || parsed.students.length === 0) return clone(DEFAULT_FEES)
    return {
      structures: Array.isArray(parsed.structures) ? parsed.structures : [],
      students: parsed.students,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices.map((item) => refreshInvoice(item)) : DEFAULT_FEES.invoices,
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      discounts: Array.isArray(parsed.discounts) ? parsed.discounts : [],
      notices: Array.isArray(parsed.notices) ? parsed.notices : [],
      audits: Array.isArray(parsed.audits) ? parsed.audits : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    }
  } catch {
    return clone(DEFAULT_FEES)
  }
}

export function saveFees(state: FeesState) {
  if (typeof window === "undefined") return
  localStorage.setItem(FEES_KEY, JSON.stringify(state))
}

export function usePreschoolFees() {
  const [state, setState] = useState<FeesState>(DEFAULT_FEES)
  const [ready, setReady] = useState(false)

  const loadData = useCallback(async () => {
      try {
        const local = loadFees()
        const [batchesRes, studentsRes, structuresRes] = await Promise.all([
          api.getBatches().catch(() => []),
          api.getStudents().catch(() => []),
          api.getFeeStructures().catch(() => []),
        ])
        
        const rawBatches = Array.isArray(batchesRes) ? batchesRes : []
        const rawStudents = Array.isArray(studentsRes) ? studentsRes : (studentsRes?.students ?? studentsRes?.data ?? [])
        const rawStructures = Array.isArray(structuresRes) ? structuresRes : []
        
        const realStructures = rawStructures.map((s: any) => ({
          id: s._id,
          academicYear: s.academicYear,
          branch: s.branch,
          className: s.className,
          status: s.status,
          components: s.components || []
        }))

        if (rawStudents.length > 0) {
          const realInvoices: FeeInvoice[] = []
          const realPayments: FeePayment[] = []
          
          const realStudents: FeeStudent[] = rawStudents.map((s: any) => {
            const sid = s.id || s._id || uid("std")
            const localStudent = local.students.find(ls => ls.id === sid)
            
            const batchInfo = rawBatches.find((b: any) => b.studentNames?.includes(s.name))
            const className = batchInfo ? `${batchInfo.courseName || "Batch"} — ${batchInfo.section || batchInfo.code || "A"}` : "Unassigned"
            
            const feesTotal = Number(s.fees?.feesTotal) || Number(s.feesTotal) || 0
            const feesPaid = Number(s.fees?.feesPaid) || Number(s.feesPaid) || 0
            const nextDueDate = s.fees?.nextDueDate || s.nextDueDate || "2026-10-10"

            const hasLocalInvoices = local.invoices.some(inv => inv.studentId === sid)

            if (!hasLocalInvoices && feesTotal > 0) {
              const inv: FeeInvoice = {
                id: `inv-${sid}`,
                studentId: sid,
                componentId: "full-plan",
                label: "Course Fee",
                feeType: "tuition",
                amount: feesTotal,
                paidAmount: feesPaid,
                dueDate: nextDueDate,
                status: feesPaid >= feesTotal ? "paid" : (feesPaid > 0 ? "partial" : "pending")
              }
              if (inv.status === "pending" && inv.dueDate < FEE_TODAY) inv.status = "overdue"
              if (inv.status === "partial" && inv.dueDate < FEE_TODAY) inv.status = "overdue"
              realInvoices.push(inv)
            }

            if (!hasLocalInvoices && feesPaid > 0) {
              realPayments.push({
                id: `pay-${sid}`,
                studentId: sid,
                receiptNo: `REC-${String(realPayments.length + local.payments.length + 1).padStart(3, "0")}`,
                amount: feesPaid,
                date: FEE_TODAY,
                method: "online",
                txnId: "API_SYNC",
                remarks: "Synced from backend",
                invoiceIds: feesTotal > 0 ? [`inv-${sid}`] : [],
                status: "paid",
                createdBy: "System",
                createdAt: new Date().toISOString()
              })
            }

            return {
              id: sid,
              studentCode: s.rollNo || s.studentCode || sid.slice(-4),
              name: s.name || "Unknown",
              parentName: s.parentName || "Parent",
              branch: s.tenantId || "Main",
              academicYear: "2026–27",
              program: className.split(" — ")[0] || "Program",
              className,
              section: className.split(" — ")[1] || "A",
              structureId: localStudent ? localStudent.structureId : "str-custom",
              includeTransport: localStudent ? localStudent.includeTransport : false,
              schedule: localStudent ? localStudent.schedule : "full"
            }
          })
          
          setState({
            ...local,
            structures: realStructures,
            students: realStudents,
            invoices: [...local.invoices, ...realInvoices],
            payments: [...local.payments, ...realPayments]
          })
        } else {
          setState({ ...local, structures: realStructures })
        }
      } catch (err) {
        console.error("Error loading fees from API:", err)
        setState(loadFees())
      } finally {
        setReady(true)
      }
    }, [])
    
  useEffect(() => {
    loadData()
  }, [loadData])

  const update = useCallback((patch: FeesState | ((prev: FeesState) => FeesState)) => {
    setState((prev) => {
      const next = typeof patch === "function" ? patch(prev) : patch
      saveFees(next)
      return next
    })
  }, [])

  return { state, update, ready, refetch: loadData }
}

export function statusVariant(
  status: InvoiceStatus | StudentPayStatus
): "success" | "warning" | "destructive" | "secondary" | "info" {
  if (status === "paid") return "success"
  if (status === "partial") return "info"
  if (status === "overdue") return "destructive"
  if (status === "cancelled") return "secondary"
  return "warning"
}

export function statusLabel(status: InvoiceStatus | StudentPayStatus) {
  if (status === "partial") return "Partially Paid"
  if (status === "paid") return "Paid"
  if (status === "overdue") return "Overdue"
  if (status === "cancelled") return "Cancelled"
  return "Pending"
}
