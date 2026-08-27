"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  UserCog, Search, Phone, Mail, UserPlus, X,
  ChevronDown, Building2, GraduationCap, Pencil, Trash2, AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

// ─── Data ─────────────────────────────────────────────────────────────────────
export interface StaffMember {
  id: string
  name: string
  role: "Center Coordinator" | "Lead Educator" | "Assistant Teacher" | "Enquiry Executive" | "Caregiver / Support"
  branch: string
  email: string
  phone: string
  joiningDate: string
  qualification: string
  salary: number
  status: "active" | "on_leave" | "inactive"
  assignedClass?: string
  coordinatorId?: string
}

const INITIAL_STAFF: StaffMember[] = [
  { id: "STF-101", name: "Sarah Jenkins", role: "Center Coordinator", branch: "ARKA KIDS Koramangala", email: "sarah.j@arkakids.com", phone: "+91 98765 43210", joiningDate: "2024-01-15", qualification: "M.Ed — Early Childhood Leadership", salary: 65000, status: "active", assignedClass: "Koramangala Operations" },
  { id: "STF-102", name: "Ananya Sharma", role: "Center Coordinator", branch: "ARKA KIDS Whitefield", email: "ananya.s@arkakids.com", phone: "+91 98765 43211", joiningDate: "2024-03-01", qualification: "B.Ed & International Montessori", salary: 52000, status: "active", assignedClass: "Whitefield Operations" },
  { id: "STF-103", name: "Priya Nair", role: "Center Coordinator", branch: "ARKA KIDS Indiranagar", email: "priya.n@arkakids.com", phone: "+91 98765 43212", joiningDate: "2024-04-10", qualification: "M.A. Child Psychology & Nursery", salary: 50000, status: "active", assignedClass: "Indiranagar Operations" },
  { id: "STF-106", name: "Sunita Patel", role: "Center Coordinator", branch: "ARKA KIDS HSR Layout", email: "sunita.p@arkakids.com", phone: "+91 98765 43215", joiningDate: "2024-05-01", qualification: "B.A. Psychology & Early Childhood", salary: 48000, status: "active", assignedClass: "HSR Layout Operations" },
  { id: "STF-107", name: "Anita Roy", role: "Lead Educator", branch: "ARKA KIDS Koramangala", email: "anita.r@arkakids.com", phone: "+91 98765 43216", joiningDate: "2024-06-15", qualification: "Diploma — Early Childhood Education", salary: 38000, status: "active", assignedClass: "Playgroup & Toddlers A", coordinatorId: "STF-101" },
  { id: "STF-108", name: "Dev Sharma", role: "Assistant Teacher", branch: "ARKA KIDS Koramangala", email: "dev.s@arkakids.com", phone: "+91 98765 43217", joiningDate: "2024-09-01", qualification: "B.A. Elementary Education", salary: 26000, status: "active", assignedClass: "Playgroup Assistant", coordinatorId: "STF-101" },
  { id: "STF-104", name: "Rajesh Kumar", role: "Enquiry Executive", branch: "ARKA KIDS Koramangala", email: "rajesh.k@arkakids.com", phone: "+91 98765 43213", joiningDate: "2024-08-01", qualification: "MBA — Education Management", salary: 32000, status: "active", assignedClass: "Admissions Desk", coordinatorId: "STF-101" },
  { id: "STF-109", name: "Kavita Menon", role: "Lead Educator", branch: "ARKA KIDS Whitefield", email: "kavita.m@arkakids.com", phone: "+91 98765 43218", joiningDate: "2024-02-10", qualification: "B.Ed & Montessori Certified", salary: 40000, status: "active", assignedClass: "Nursery A & B", coordinatorId: "STF-102" },
  { id: "STF-105", name: "Meena Deshmukh", role: "Assistant Teacher", branch: "ARKA KIDS Whitefield", email: "meena.d@arkakids.com", phone: "+91 98765 43214", joiningDate: "2024-09-15", qualification: "B.A. Child Psychology", salary: 27000, status: "on_leave", assignedClass: "LKG Section 1", coordinatorId: "STF-102" },
  { id: "STF-110", name: "Ramesh Bhat", role: "Caregiver / Support", branch: "ARKA KIDS Whitefield", email: "ramesh.b@arkakids.com", phone: "+91 98765 43219", joiningDate: "2024-10-01", qualification: "First Aid & Child Safety Cert.", salary: 19000, status: "active", assignedClass: "Toddler Wing", coordinatorId: "STF-102" },
  { id: "STF-111", name: "Deepa Varma", role: "Lead Educator", branch: "ARKA KIDS Indiranagar", email: "deepa.v@arkakids.com", phone: "+91 98765 43220", joiningDate: "2024-05-20", qualification: "M.Sc Human Development & B.Ed", salary: 42000, status: "active", assignedClass: "LKG & UKG Upper Wing", coordinatorId: "STF-103" },
  { id: "STF-112", name: "Siddharth Rao", role: "Assistant Teacher", branch: "ARKA KIDS Indiranagar", email: "siddharth.r@arkakids.com", phone: "+91 98765 43221", joiningDate: "2024-07-11", qualification: "Diploma in Special Education", salary: 28000, status: "active", assignedClass: "UKG Section B", coordinatorId: "STF-103" },
  { id: "STF-113", name: "Vikram Reddy", role: "Lead Educator", branch: "ARKA KIDS HSR Layout", email: "vikram.r@arkakids.com", phone: "+91 98765 43222", joiningDate: "2024-06-01", qualification: "B.Ed Primary Education", salary: 39000, status: "active", assignedClass: "Daycare & Nursery Lead", coordinatorId: "STF-106" },
  { id: "STF-114", name: "Pooja Hegde", role: "Caregiver / Support", branch: "ARKA KIDS HSR Layout", email: "pooja.h@arkakids.com", phone: "+91 98765 43223", joiningDate: "2024-11-10", qualification: "Childcare & Hygiene Certification", salary: 20000, status: "active", assignedClass: "Daycare Assistant", coordinatorId: "STF-106" },
]

const BRANCHES = ["ARKA KIDS Koramangala", "ARKA KIDS Whitefield", "ARKA KIDS Indiranagar", "ARKA KIDS HSR Layout"]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBadge(status: StaffMember["status"]) {
  if (status === "active") return <Badge variant="success" className="text-[10px]">Active</Badge>
  if (status === "on_leave") return <Badge variant="warning" className="text-[10px]">On Leave</Badge>
  return <Badge variant="outline" className="text-[10px]">Inactive</Badge>
}

function roleBadge(role: StaffMember["role"]) {
  const map: Record<StaffMember["role"], string> = {
    "Center Coordinator": "bg-primary/10 text-primary border-primary/20",
    "Lead Educator": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Assistant Teacher": "bg-sky-50 text-sky-700 border-sky-200",
    "Enquiry Executive": "bg-amber-50 text-amber-700 border-amber-200",
    "Caregiver / Support": "bg-muted text-muted-foreground border-border",
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${map[role]}`}>
      {role}
    </span>
  )
}

// ─── Staff card ───────────────────────────────────────────────────────────────
function StaffCard({
  member,
  onEdit,
  onDelete,
}: {
  member: StaffMember
  onEdit: (m: StaffMember) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const initials = member.name.split(" ").map(n => n[0]).join("").slice(0, 2)

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
      {/* Card row */}
      <div className="px-4 py-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(p => !p)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 border border-primary/15">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{member.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{member.assignedClass}</p>
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {statusBadge(member.status)}
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <ChevronDown
            onClick={() => setOpen(p => !p)}
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform cursor-pointer ${open ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-xs text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Remove <strong>{member.name}</strong> from the roster?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="h-7 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { onDelete(member.id); setConfirmDelete(false) }}
              className="h-7 px-3 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-border/50 px-4 py-3 space-y-3 bg-muted/10">
          <div className="flex flex-wrap gap-2">
            {roleBadge(member.role)}
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Building2 className="h-3 w-3" />{member.branch.replace("ARKA KIDS ", "")}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" />{member.email}</span>
            <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{member.phone}</span>
            <span className="flex items-center gap-1.5"><GraduationCap className="h-3 w-3 shrink-0" />{member.qualification}</span>
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              {formatCurrency(member.salary)}<span className="font-normal text-muted-foreground">/ month</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add Staff Dialog ─────────────────────────────────────────────────────────
function AddStaffDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  onAdd: (m: StaffMember) => void
}) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [role, setRole] = React.useState<StaffMember["role"]>("Lead Educator")
  const [branch, setBranch] = React.useState(BRANCHES[0])
  const [coordId, setCoordId] = React.useState("STF-101")
  const [cls, setCls] = React.useState("")
  const [qual, setQual] = React.useState("")
  const [salary, setSalary] = React.useState("35000")

  const isCoord = role === "Center Coordinator"

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim()) return
    onAdd({
      id: `STF-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      branch,
      joiningDate: new Date().toISOString().slice(0, 10),
      qualification: qual || "Certified Early Educator",
      salary: Number(salary) || 35000,
      status: "active",
      assignedClass: cls.trim() || undefined,
      coordinatorId: isCoord ? undefined : coordId,
    })
    onClose()
    setName(""); setEmail(""); setPhone(""); setCls(""); setQual(""); setSalary("35000")
  }

  return (
    <Dialog isOpen={open} onClose={onClose} title="Add Staff Member">
      <form onSubmit={submit} className="space-y-4 pt-1">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Anita Roy"
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Phone *</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 ..."
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@arkakids.com"
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as StaffMember["role"])}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
              <option>Center Coordinator</option>
              <option>Lead Educator</option>
              <option>Assistant Teacher</option>
              <option>Enquiry Executive</option>
              <option>Caregiver / Support</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
              {BRANCHES.map(b => <option key={b} value={b}>{b.replace("ARKA KIDS ", "")}</option>)}
            </select>
          </div>
          {!isCoord && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Reports to Coordinator</label>
              <select value={coordId} onChange={e => setCoordId(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                <option value="STF-101">Sarah Jenkins — Koramangala</option>
                <option value="STF-102">Ananya Sharma — Whitefield</option>
                <option value="STF-103">Priya Nair — Indiranagar</option>
                <option value="STF-106">Sunita Patel — HSR Layout</option>
              </select>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Assigned Class / Desk</label>
            <input value={cls} onChange={e => setCls(e.target.value)} placeholder="e.g. Nursery A"
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Qualification</label>
            <input value={qual} onChange={e => setQual(e.target.value)} placeholder="e.g. B.Ed"
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Monthly Salary (₹)</label>
            <input type="number" value={salary} onChange={e => setSalary(e.target.value)} min={0}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1 border-t border-border/50">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" icon={UserPlus}>Add Member</Button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Edit Staff Dialog ────────────────────────────────────────────────────────
function EditStaffDialog({
  member,
  onClose,
  onSave,
}: {
  member: StaffMember
  onClose: () => void
  onSave: (updated: StaffMember) => void
}) {
  const [name, setName] = React.useState(member.name)
  const [email, setEmail] = React.useState(member.email)
  const [phone, setPhone] = React.useState(member.phone)
  const [role, setRole] = React.useState<StaffMember["role"]>(member.role)
  const [branch, setBranch] = React.useState(member.branch)
  const [cls, setCls] = React.useState(member.assignedClass ?? "")
  const [qual, setQual] = React.useState(member.qualification)
  const [salary, setSalary] = React.useState(String(member.salary))
  const [status, setStatus] = React.useState<StaffMember["status"]>(member.status)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      ...member,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      branch,
      assignedClass: cls.trim() || undefined,
      qualification: qual.trim(),
      salary: Number(salary) || member.salary,
      status,
    })
    onClose()
  }

  return (
    <Dialog isOpen onClose={onClose} title={`Edit — ${member.name}`}>
      <form onSubmit={submit} className="space-y-4 pt-1">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as StaffMember["role"])}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
              <option>Center Coordinator</option>
              <option>Lead Educator</option>
              <option>Assistant Teacher</option>
              <option>Enquiry Executive</option>
              <option>Caregiver / Support</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as StaffMember["status"])}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Branch</label>
            <select value={branch} onChange={e => setBranch(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
              {BRANCHES.map(b => <option key={b} value={b}>{b.replace("ARKA KIDS ", "")}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Assigned Class / Desk</label>
            <input value={cls} onChange={e => setCls(e.target.value)} placeholder="e.g. Nursery A"
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Qualification</label>
            <input value={qual} onChange={e => setQual(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Monthly Salary (₹)</label>
            <input type="number" value={salary} onChange={e => setSalary(e.target.value)} min={0}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1 border-t border-border/50">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" icon={Pencil}>Save Changes</Button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Inner (uses useSearchParams) ─────────────────────────────────────────────
function StaffPageInner() {
  const searchParams = useSearchParams()
  const section = searchParams.get("section") // "coordinators" | "teachers" | null

  const [staff, setStaff] = React.useState<StaffMember[]>(INITIAL_STAFF)
  const [search, setSearch] = React.useState("")
  const [addOpen, setAddOpen] = React.useState(false)
  const [editMember, setEditMember] = React.useState<StaffMember | null>(null)

  const handleEdit = (updated: StaffMember) =>
    setStaff(prev => prev.map(s => s.id === updated.id ? updated : s))

  const handleDelete = (id: string) =>
    setStaff(prev => prev.filter(s => s.id !== id))

  // Which tab: "coordinators" | "teachers"
  const [tab, setTab] = React.useState<"coordinators" | "teachers">(
    section === "teachers" ? "teachers" : "coordinators"
  )
  React.useEffect(() => {
    if (section === "teachers") setTab("teachers")
    else if (section === "coordinators") setTab("coordinators")
  }, [section])

  const coordinators = staff.filter(s => s.role === "Center Coordinator")
  const teachers = staff.filter(s => s.role !== "Center Coordinator")

  const list = tab === "coordinators" ? coordinators : teachers
  const filtered = list.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.assignedClass ?? "").toLowerCase().includes(search.toLowerCase()) ||
    s.branch.toLowerCase().includes(search.toLowerCase())
  )

  // Group teachers by coordinator
  const teachersByCoord = React.useMemo(() => {
    const map: Record<string, StaffMember[]> = {}
    teachers.forEach(t => {
      const key = t.coordinatorId ?? "unassigned"
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return map
  }, [teachers])

  // Summary stats
  const active = staff.filter(s => s.status === "active").length
  const onLeave = staff.filter(s => s.status === "on_leave").length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-border/60 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Human Resources</p>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <UserCog className="h-6 w-6 text-primary" />
            Staff & Educators
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {active} active · {onLeave} on leave · {staff.length} total
          </p>
        </div>
        <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setAddOpen(true)}>
          Add Member
        </Button>
      </div>

      {/* Tab + Search */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted/60 border border-border/50 rounded-lg p-1">
          {(["coordinators", "teachers"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize",
                tab === t
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "coordinators" ? "Center Coordinators" : "Teachers & Educators"}
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                tab === t ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              )}>
                {t === "coordinators" ? coordinators.length : teachers.length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, class..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Coordinators Tab ── */}
      {tab === "coordinators" && (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No coordinators found.</p>
          ) : (
            filtered.map(coord => {
              const team = teachersByCoord[coord.id] ?? []
              return (
                <CoordinatorRow
                  key={coord.id}
                  coordinator={coord}
                  team={team}
                  onEdit={setEditMember}
                  onDelete={handleDelete}
                />
              )
            })
          )}
        </div>
      )}

      {/* ── Teachers Tab ── */}
      {tab === "teachers" && (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No staff found.</p>
          ) : (
            filtered.map(member => (
              <StaffCard
                key={member.id}
                member={member}
                onEdit={setEditMember}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}

      <AddStaffDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={m => setStaff(prev => [m, ...prev])}
      />

      {editMember && (
        <EditStaffDialog
          member={editMember}
          onClose={() => setEditMember(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  )
}

// ─── Coordinator row (with expandable team) ───────────────────────────────────
function CoordinatorRow({
  coordinator,
  team,
  onEdit,
  onDelete,
}: {
  coordinator: StaffMember
  team: StaffMember[]
  onEdit: (m: StaffMember) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const initials = coordinator.name.split(" ").map(n => n[0]).join("").slice(0, 2)

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
      {/* Coordinator header row */}
      <div className="px-4 py-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(p => !p)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
        >
          <div className="h-10 w-10 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{coordinator.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {coordinator.branch.replace("ARKA KIDS ", "")} · {coordinator.assignedClass}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {team.length > 0 && (
            <span className="text-[10px] font-semibold bg-muted border border-border rounded-full px-2 py-0.5 text-muted-foreground">
              {team.length} staff
            </span>
          )}
          {statusBadge(coordinator.status)}
          <button
            type="button"
            onClick={() => onEdit(coordinator)}
            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <ChevronDown
            onClick={() => setOpen(p => !p)}
            className={`h-4 w-4 text-muted-foreground transition-transform cursor-pointer ${open ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-xs text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Remove <strong>{coordinator.name}</strong> and their team from the roster?
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="h-7 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { onDelete(coordinator.id); setConfirmDelete(false) }}
              className="h-7 px-3 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Coordinator detail + team list */}
      {open && (
        <div className="border-t border-border/50">
          {/* Coordinator details */}
          <div className="px-4 py-3 bg-muted/10 grid sm:grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted-foreground border-b border-border/40">
            <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" />{coordinator.email}</span>
            <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{coordinator.phone}</span>
            <span className="flex items-center gap-1.5 sm:col-span-2"><GraduationCap className="h-3 w-3 shrink-0" />{coordinator.qualification} · {formatCurrency(coordinator.salary)}/mo</span>
          </div>

          {/* Team members */}
          {team.length > 0 && (
            <div className="divide-y divide-border/30">
              {team.map(member => (
                <div key={member.id} className="px-4 pl-8 py-3 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/10">
                    {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{member.assignedClass}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {roleBadge(member.role)}
                    {statusBadge(member.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function StaffPage() {
  return (
    <Suspense fallback={<div className="text-xs text-muted-foreground py-16 text-center">Loading staff...</div>}>
      <StaffPageInner />
    </Suspense>
  )
}
