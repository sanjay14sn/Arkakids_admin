import { useCallback, useEffect, useState } from "react"
import { BRANCHES } from "@/lib/preschoolOps"

export const PARENT_PORTAL_KEY = "arka_parent_portal_v1"

export const PROGRAMS = [
  { id: "toddler", label: "Toddler", ages: "2–3 years", minAge: 2, maxAge: 3 },
  { id: "nursery", label: "Nursery", ages: "3–4 years", minAge: 3, maxAge: 4 },
  { id: "jrkg", label: "Jr KG", ages: "4–5 years", minAge: 4, maxAge: 5 },
  { id: "srkg", label: "Sr KG", ages: "5–6 years", minAge: 5, maxAge: 6 },
] as const

export type ProgramId = (typeof PROGRAMS)[number]["id"] | "waitlist" | "overage"

export function ageFromDob(dob: string) {
  if (!dob) return 0
  const born = new Date(`${dob}T00:00:00`)
  if (Number.isNaN(born.getTime())) return 0
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const month = now.getMonth() - born.getMonth()
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) age -= 1
  return age
}

export function suggestProgram(dob: string) {
  const age = ageFromDob(dob)
  if (!dob) return { id: "nursery" as ProgramId, label: "Nursery", hint: "Enter date of birth to auto-suggest", age }
  if (age < 2) return { id: "waitlist" as ProgramId, label: "Waitlist", hint: "Child is under 2 — join the waitlist", age }
  const match = PROGRAMS.find((program) => age >= program.minAge && age < program.maxAge)
  if (match) return { id: match.id as ProgramId, label: match.label, hint: `Suggested from age ${age}: ${match.ages}`, age }
  return { id: "overage" as ProgramId, label: "Above Sr KG", hint: "Child is 6 or older", age }
}

export const FEE_HEADS = [
  { key: "registration", label: "Registration Fee", amount: 5000 },
  { key: "admission", label: "Admission Fee", amount: 15000 },
  { key: "books", label: "Books", amount: 3500 },
  { key: "uniform", label: "Uniform", amount: 2500 },
  { key: "activity", label: "Audio-Visual / Activity Kit", amount: 2000 },
  { key: "other", label: "Other charges", amount: 0 },
] as const

export const PAYMENT_PLANS = [
  { id: "monthly", label: "Monthly", parts: 12 },
  { id: "term", label: "Term-wise", parts: 3 },
  { id: "yearly", label: "Yearly", parts: 1 },
] as const

export type PaymentPlanId = (typeof PAYMENT_PLANS)[number]["id"]
export type PayMethod = "upi" | "card" | "netbanking"

export type FeeHead = { key: string; label: string; amount: number }
export type ParentReceipt = {
  id: string
  txnId: string
  studentName: string
  className: string
  amount: number
  plan: PaymentPlanId
  method: PayMethod
  paidAt: string
  heads: FeeHead[]
}

export type AdmissionApplication = {
  id: string
  status: "pending" | "approved" | "rejected" | "waitlist"
  childName: string
  dob: string
  gender: string
  programId: ProgramId
  session: "morning" | "afternoon"
  branch: string
  fatherName: string
  motherName: string
  fatherOccupation: string
  motherOccupation: string
  phone: string
  email: string
  address: string
  emergencyName: string
  emergencyPhone: string
  bloodGroup: string
  allergies: string
  pickupPersons: string
  siblingInSchool: boolean
  visitDate?: string
  trialVisit?: boolean
  files: { birth?: string; photo?: string; parentId?: string; aadhaar?: string; medical?: string }
  createdAt: string
}

export type ParentMessage = {
  id: string
  from: "parent" | "school"
  author: string
  body: string
  createdAt: string
}

export type ParentFeedback = {
  id: string
  rating: number
  topic: string
  comment: string
  createdAt: string
}

export type ParentPortalState = {
  feeHeads: FeeHead[]
  lateFeePercent: number
  siblingDiscountPercent: number
  paidAmount: number
  receipts: ParentReceipt[]
  applications: AdmissionApplication[]
  messages: ParentMessage[]
  feedback: ParentFeedback[]
}

const DEFAULT_HEADS: FeeHead[] = FEE_HEADS.map((head) => ({ ...head }))

export const DEFAULT_PARENT_PORTAL: ParentPortalState = {
  feeHeads: DEFAULT_HEADS,
  lateFeePercent: 2,
  siblingDiscountPercent: 10,
  paidAmount: 20000,
  receipts: [
    {
      id: "RCP-AK-1042",
      txnId: "pay_preview_88a21",
      studentName: "Aanya Sharma",
      className: "Nursery",
      amount: 15000,
      plan: "term",
      method: "upi",
      paidAt: "2026-07-12T10:20:00.000Z",
      heads: DEFAULT_HEADS,
    },
    {
      id: "RCP-AK-1041",
      txnId: "pay_preview_77b10",
      studentName: "Aanya Sharma",
      className: "Nursery",
      amount: 5000,
      plan: "yearly",
      method: "card",
      paidAt: "2026-06-02T09:05:00.000Z",
      heads: DEFAULT_HEADS,
    },
  ],
  applications: [
    {
      id: "adm-1",
      status: "pending",
      childName: "Riya Nair",
      dob: "2023-04-12",
      gender: "Girl",
      programId: "nursery",
      session: "morning",
      branch: BRANCHES[0],
      fatherName: "Arun Nair",
      motherName: "Meera Nair",
      fatherOccupation: "Engineer",
      motherOccupation: "Teacher",
      phone: "9876500123",
      email: "meera.nair@email.com",
      address: "12, 8th Main, Koramangala",
      emergencyName: "Anil Nair",
      emergencyPhone: "9876500999",
      bloodGroup: "O+",
      allergies: "None",
      pickupPersons: "Meera Nair, grandmother Lakshmi",
      siblingInSchool: false,
      visitDate: "2026-08-29",
      trialVisit: true,
      files: { birth: "riya-birth.pdf", photo: "riya.jpg", aadhaar: "riya-aadhaar.pdf" },
      createdAt: "2026-08-20T08:00:00.000Z",
    },
  ],
  messages: [
    {
      id: "msg-1",
      from: "school",
      author: "ARKA KIDS Koramangala",
      body: "Independence Day celebration photos are in Daily Journal. Please send ethnic wear on 15 Aug.",
      createdAt: "2026-08-12T07:30:00.000Z",
    },
    {
      id: "msg-2",
      from: "parent",
      author: "Neha Sharma",
      body: "Aanya will come at 9:15 tomorrow due to a doctor visit.",
      createdAt: "2026-08-22T18:10:00.000Z",
    },
  ],
  feedback: [
    {
      id: "fb-1",
      rating: 5,
      topic: "Classroom",
      comment: "Journal photos help us talk about Aanya’s day at home.",
      createdAt: "2026-08-18T12:00:00.000Z",
    },
  ],
}

export function feeTotal(heads: FeeHead[]) {
  return heads.reduce((sum, head) => sum + (Number(head.amount) || 0), 0)
}

export function planAmount(total: number, paid: number, plan: PaymentPlanId) {
  const due = Math.max(0, total - paid)
  const parts = PAYMENT_PLANS.find((item) => item.id === plan)?.parts || 1
  return Math.ceil(due / parts)
}

export function loadParentPortal(): ParentPortalState {
  if (typeof window === "undefined") return DEFAULT_PARENT_PORTAL
  try {
    const raw = localStorage.getItem(PARENT_PORTAL_KEY)
    if (!raw) return DEFAULT_PARENT_PORTAL
    return { ...DEFAULT_PARENT_PORTAL, ...JSON.parse(raw) } as ParentPortalState
  } catch {
    return DEFAULT_PARENT_PORTAL
  }
}

export function saveParentPortal(state: ParentPortalState) {
  if (typeof window === "undefined") return
  localStorage.setItem(PARENT_PORTAL_KEY, JSON.stringify(state))
}

export function useParentPortal() {
  const [state, setState] = useState<ParentPortalState>(DEFAULT_PARENT_PORTAL)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setState(loadParentPortal())
    setReady(true)
  }, [])

  const update = useCallback((patch: Partial<ParentPortalState> | ((prev: ParentPortalState) => ParentPortalState)) => {
    setState((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
      saveParentPortal(next)
      return next
    })
  }, [])

  return { state, update, ready }
}

export function downloadFeeReceipt(receipt: ParentReceipt) {
  const rows = receipt.heads
    .map((head) => `<tr><td>${head.label}</td><td style="text-align:right">${head.amount}</td></tr>`)
    .join("")
  const html = `<!doctype html><html><head><title>${receipt.id}</title>
<style>body{font-family:ui-sans-serif,system-ui;padding:40px;max-width:640px;margin:0 auto;color:#111}
h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:8px;border-bottom:1px solid #eee}</style></head>
<body>
<h1>ARKA KIDS</h1>
<p>Admission / fee receipt</p>
<p><strong>Receipt:</strong> ${receipt.id}<br/>
<strong>Transaction ID:</strong> ${receipt.txnId}<br/>
<strong>Student:</strong> ${receipt.studentName}<br/>
<strong>Class:</strong> ${receipt.className}<br/>
<strong>Plan:</strong> ${receipt.plan}<br/>
<strong>Method:</strong> ${receipt.method}<br/>
<strong>Payment date:</strong> ${new Date(receipt.paidAt).toLocaleString("en-IN")}<br/>
<strong>Amount paid:</strong> ₹${receipt.amount.toLocaleString("en-IN")}</p>
<table>${rows}</table>
</body></html>`
  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${receipt.id}.html`
  link.click()
  URL.revokeObjectURL(url)
}

export const PARENT_ALERTS = [
  { id: "n1", title: "Fee reminder", body: "Nursery term balance is due on 5 Sep 2026." },
  { id: "n2", title: "Holiday", body: "School closed on 15 Aug — Independence Day." },
  { id: "n3", title: "Event", body: "PTM on 28 Aug at Koramangala, 9:00 AM–1:00 PM." },
]
