"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  UserCog, Search, Phone, Mail, UserPlus, X,
  ChevronDown, Building2, GraduationCap, Pencil, Trash2, AlertTriangle, Loader2, RefreshCw,
} from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Select } from "@/components/ui/Select"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useStore } from "@/store/useStore"
import { toast } from "sonner"

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
  // Additional fields
  gender?: string
  employmentType?: string
  dob?: string
  experience?: string
  specialisation?: string
  classRole?: string
  shift?: string
  emergencyName?: string
  emergencyRelation?: string
  emergencyPhone?: string
}

/** Fallback used only until API responds */
const FALLBACK_BRANCHES: string[] = []

/** Map raw API staff object to local StaffMember shape */
function mapApiStaff(s: any): StaffMember {
  return {
    id: s._id ?? s.id ?? "",
    name: s.name ?? "",
    role: s.role ?? "Lead Educator",
    branch: s.branch ?? s.center ?? "",
    email: s.email ?? "",
    phone: s.phone ?? s.mobile ?? "",
    joiningDate: s.joiningDate ?? s.createdAt?.slice(0, 10) ?? "",
    qualification: s.qualification ?? "",
    salary: Number(s.salary ?? s.monthlySalary ?? 0),
    status: s.status ?? "active",
    assignedClass: s.assignedClass ?? s.className ?? undefined,
    coordinatorId: s.coordinatorId ?? s.reportingTo ?? undefined,
    gender: s.gender,
    employmentType: s.employmentType,
    dob: s.dob,
    experience: s.experience,
    specialisation: s.specialisation,
    classRole: s.classRole,
    shift: s.shift,
    emergencyName: s.emergencyName,
    emergencyRelation: s.emergencyRelation,
    emergencyPhone: s.emergencyPhone,
  }
}

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
            <p className="text-[11px] text-muted-foreground truncate">
              {member.branch.replace("ARKA KIDS ", "")}{member.assignedClass ? ` · ${member.assignedClass}` : ""}
            </p>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" />{member.email}</span>
            <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{member.phone}</span>
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              {formatCurrency(member.salary)}<span className="font-normal text-muted-foreground">/mo</span>
            </span>

            {member.qualification && <span className="flex items-center gap-1.5"><GraduationCap className="h-3 w-3 shrink-0" />{member.qualification}</span>}
            {member.gender && <span className="flex items-center gap-1.5">Gender: {member.gender}</span>}
            {member.employmentType && <span className="flex items-center gap-1.5">Type: {member.employmentType}</span>}
            {member.dob && <span className="flex items-center gap-1.5">DOB: {member.dob.split('-').reverse().join('-')}</span>}
            {member.joiningDate && <span className="flex items-center gap-1.5">Joined: {member.joiningDate.split('-').reverse().join('-')}</span>}
            {member.experience && <span className="flex items-center gap-1.5">Exp: {member.experience} yrs</span>}
            {member.specialisation && <span className="flex items-center gap-1.5">Spec: {member.specialisation}</span>}
            {member.classRole && <span className="flex items-center gap-1.5">Role: {member.classRole}</span>}
            {member.shift && <span className="flex items-center gap-1.5">Shift: {member.shift}</span>}

            {(member.emergencyName || member.emergencyPhone) && (
              <span className="flex items-center gap-1.5 sm:col-span-2 lg:col-span-3 mt-1 pt-1 border-t border-border/30">
                <AlertTriangle className="h-3 w-3 shrink-0 text-muted-foreground" />
                Emergency: {member.emergencyName} {member.emergencyRelation ? `(${member.emergencyRelation})` : ""} {member.emergencyPhone ? `· ${member.emergencyPhone}` : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Staff Form Dialog (Add / Edit) ─────────────────────────────────────────────────────────
function StaffFormDialog({
  open,
  onClose,
  onSave,
  coordinators,
  branches,
  userRole,
  isCoordinatorMode,
  editMember,
}: {
  open: boolean
  onClose: () => void
  onSave: (m: StaffMember) => void
  coordinators: StaffMember[]
  branches: string[]
  userRole: string
  isCoordinatorMode?: boolean
  editMember?: StaffMember
}) {
  const { addNotification } = useStore()
  
  // Shared state
  const [name, setName] = React.useState(editMember?.name ?? "")
  const [email, setEmail] = React.useState(editMember?.email ?? "")
  const [phone, setPhone] = React.useState(editMember?.phone ?? "")
  const [branch, setBranch] = React.useState(editMember?.branch ?? (branches[0] ?? ""))
  const [qual, setQual] = React.useState(editMember?.qualification ?? "")
  const [cls, setCls] = React.useState(editMember?.assignedClass ?? "")
  
  // Teacher-specific
  const [role, setRole] = React.useState<StaffMember["role"]>(editMember?.role ?? "Lead Educator")
  const [salary, setSalary] = React.useState(editMember?.salary ? String(editMember.salary) : "35000")
  const [coordId, setCoordId] = React.useState(editMember?.coordinatorId ?? (coordinators[0]?.id ?? ""))
  
  // Additional Teacher state
  const [dob, setDob] = React.useState(editMember?.dob ?? "")
  const [experience, setExperience] = React.useState(editMember?.experience ?? "")
  const [specialisation, setSpecialisation] = React.useState(editMember?.specialisation ?? "")
  const [assignedClasses, setAssignedClasses] = React.useState<string[]>(
    editMember?.assignedClass ? editMember.assignedClass.split(",").map(s => s.trim()) : []
  )
  const [classRole, setClassRole] = React.useState(editMember?.classRole ?? "")
  const [shift, setShift] = React.useState(editMember?.shift ?? "")
  const [emergencyName, setEmergencyName] = React.useState(editMember?.emergencyName ?? "")
  const [emergencyRelation, setEmergencyRelation] = React.useState(editMember?.emergencyRelation ?? "")
  const [emergencyPhone, setEmergencyPhone] = React.useState(editMember?.emergencyPhone ?? "")

  // Coordinator-specific (shared with teacher now)
  const [gender, setGender] = React.useState(editMember?.gender ?? "")
  const [joiningDate, setJoiningDate] = React.useState(editMember?.joiningDate ?? "")
  const [empType, setEmpType] = React.useState(editMember?.employmentType ?? "Full-time")
  const [accountStatus, setAccountStatus] = React.useState(editMember?.status === "inactive" ? "Inactive" : "Active")
  const [sendInvite, setSendInvite] = React.useState(true)

  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!editMember && !branch && branches.length > 0) setBranch(branches[0])
  }, [branches, branch, editMember])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !phone.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: isCoordinatorMode ? "Center Coordinator" : role,
        branch,
        joiningDate: joiningDate || new Date().toISOString().slice(0, 10),
        qualification: qual || (isCoordinatorMode ? "" : "Certified Early Educator"),
        salary: Number(salary) || 35000,
        status: accountStatus === "Active" ? "active" : "inactive",
        assignedClass: isCoordinatorMode ? undefined : (assignedClasses.length > 0 ? assignedClasses.join(", ") : undefined),
        coordinatorId: isCoordinatorMode ? undefined : (coordId || undefined),
        gender,
        employmentType: empType,
        // Teacher specific extras
        dob: !isCoordinatorMode ? dob : undefined,
        experience: !isCoordinatorMode ? experience : undefined,
        specialisation: !isCoordinatorMode ? specialisation : undefined,
        classRole: !isCoordinatorMode ? classRole : undefined,
        shift: !isCoordinatorMode ? shift : undefined,
        emergencyName: !isCoordinatorMode ? emergencyName : undefined,
        emergencyRelation: !isCoordinatorMode ? emergencyRelation : undefined,
        emergencyPhone: !isCoordinatorMode ? emergencyPhone : undefined,
      }
      if (editMember) {
        const res = await api.updateStaff(editMember.id, payload)
        onSave(mapApiStaff({ ...editMember, ...payload, ...(res?.staff ?? res ?? {}) }))
      } else {
        const res = await api.createStaff(payload)
        onSave(mapApiStaff(res?.staff ?? res))
      }
      
      onClose()
      if (!editMember) {
        setName(""); setEmail(""); setPhone(""); setCls(""); setQual(""); setSalary("35000"); setJoiningDate("");
      }
    } catch (e: any) {
      toast.error(e?.message ?? (editMember ? "Failed to update staff member." : "Failed to add staff member."))
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!editMember

  if (isCoordinatorMode) {
    return (
      <Dialog isOpen={open} onClose={onClose} title={isEdit ? `Edit Coordinator — ${name}` : "Add Centre Coordinator"} className="max-w-2xl">
        <form onSubmit={submit} className="space-y-6 pt-2">
          <p className="text-sm text-muted-foreground -mt-4">
            Enter the coordinator's details to create their staff profile and login.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">1. Personal Information</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} required placeholder="Enter full name"
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                    <option value="">Select gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Mobile Number *</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="10-digit number"
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email Address *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email address"
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-border/50" />

            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">2. Employment Details</h3>
              <div className="grid sm:grid-cols-2 gap-3">

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Date of Joining *</label>
                  <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} required
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Qualification</label>
                  <input value={qual} onChange={e => setQual(e.target.value)} placeholder="Select / enter"
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Employment Type</label>
                  <select value={empType} onChange={e => setEmpType(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-border/50" />

            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">3. Centre Assignment</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Centre / Branch *</label>
                  <select value={branch} onChange={e => setBranch(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                    {branches.map(b => <option key={b} value={b}>{b.replace("ARKA KIDS ", "")}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Assigned Classes</label>
                  <input value={cls} onChange={e => setCls(e.target.value)} placeholder="Select classes (optional)"
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-border/50" />

            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">4. Login & Access</h3>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Login Email *</label>
                  <input readOnly value={email || "Use email address above"}
                    className="w-full h-9 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Account Status</label>
                  <select value={accountStatus} onChange={e => setAccountStatus(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={sendInvite} onChange={e => setSendInvite(e.target.checked)} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                <span className="text-sm font-medium text-foreground">Login invitation</span>
              </label>
              <p className="text-xs text-muted-foreground ml-6">Send secure account setup invitation</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/50 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" icon={saving ? Loader2 : UserPlus} disabled={saving}>
              {saving ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save Changes" : "Add Coordinator")}
            </Button>
          </div>
        </form>
      </Dialog>
    )
  }

  return (
    <Dialog isOpen={open} onClose={onClose} title={isEdit ? `Edit Teacher — ${name}` : "Add New Teacher"} className="max-w-3xl">
      <form onSubmit={submit} className="space-y-6 pt-2 h-[75vh] overflow-y-auto pr-2">
        {/* 1. Personal Information */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">1. Personal Information</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Enter full name"
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Mobile Number *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="10-digit number"
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Email Address *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email address"
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                <option value="">Select gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-border/50" />

        {/* 2. Employment Details */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">2. Employment Details</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Designation *</label>
              <select value={role} onChange={e => setRole(e.target.value as any)} required
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                <option value="">Select designation</option>
                <option value="Lead Educator">Lead Educator</option>
                <option value="Assistant Teacher">Assistant Teacher</option>
                <option value="Enquiry Executive">Enquiry Executive</option>
                <option value="Caregiver / Support">Caregiver / Support</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Employment Type *</label>
              <select value={empType} onChange={e => setEmpType(e.target.value)} required
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date of Joining *</label>
              <input type="date" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} required
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Experience (years)</label>
              <input type="number" value={experience} onChange={e => setExperience(e.target.value)} min={0} placeholder="e.g. 3"
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-border/50" />

        {/* 3. Qualification & Skills */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">3. Qualification & Skills</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Highest Qualification</label>
              <select value={qual} onChange={e => setQual(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                <option value="">Select qualification</option>
                <option value="B.Ed">B.Ed</option>
                <option value="M.Ed">M.Ed</option>
                <option value="Diploma in Early Childhood">Diploma in Early Childhood</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Specialisation</label>
              <select value={specialisation} onChange={e => setSpecialisation(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                <option value="">Select specialisation</option>
                <option value="Montessori">Montessori</option>
                <option value="Special Education">Special Education</option>
                <option value="Child Psychology">Child Psychology</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-border/50" />

        {/* 4. Centre & Classroom Assignment */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">4. Centre & Classroom Assignment</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Centre / Branch *</label>
              <select value={branch} onChange={e => setBranch(e.target.value)} required
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                {branches.map(b => <option key={b} value={b}>{b.replace("ARKA KIDS ", "")}</option>)}
              </select>
            </div>
            
            <div className="sm:col-span-2 space-y-2 mt-2">
              <label className="text-xs font-medium text-muted-foreground">Assigned Classes *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["Toddler Program", "Nursery", "Junior KG (LKG)", "Senior KG (UKG)", "Daycare & After School"].map(c => (
                  <label key={c} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="checkbox" checked={assignedClasses.includes(c)}
                      onChange={() => setAssignedClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1 mt-2">
              <label className="text-xs font-medium text-muted-foreground">Class Role</label>
              <select value={classRole} onChange={e => setClassRole(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                <option value="">Select role</option>
                <option value="Class Teacher">Class Teacher</option>
                <option value="Co-Teacher">Co-Teacher</option>
                <option value="Substitute">Substitute</option>
              </select>
            </div>
            <div className="space-y-1 mt-2">
              <label className="text-xs font-medium text-muted-foreground">Shift</label>
              <select value={shift} onChange={e => setShift(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary">
                <option value="">Select shift</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Full Day">Full Day</option>
              </select>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-border/50" />

        {/* 5. Emergency Contact */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">5. Emergency Contact</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Contact Name</label>
              <input value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="Name"
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Relationship</label>
              <input value={emergencyRelation} onChange={e => setEmergencyRelation(e.target.value)} placeholder="e.g. Spouse, Parent"
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Emergency Contact Number</label>
              <input value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="Phone number"
                className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-border/50" />

        {/* 6. Login & Account Access */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">6. Login & Account Access</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Login Email *</label>
              <input type="email" value={email} readOnly disabled
                className="w-full h-9 rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed" />
              <p className="text-[10px] text-muted-foreground mt-1">Uses the email address provided above.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Account Status</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="radio" checked={accountStatus === "Active"} onChange={() => setAccountStatus("Active")}
                    className="text-primary focus:ring-primary" name="teacher_acc_status" />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="radio" checked={accountStatus === "Inactive"} onChange={() => setAccountStatus("Inactive")}
                    className="text-primary focus:ring-primary" name="teacher_acc_status" />
                  Inactive
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border/50 mt-4 sticky bottom-0 bg-background py-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" icon={saving ? Loader2 : UserPlus} disabled={saving}>
            {saving ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save Changes" : "Add Teacher")}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}



// ─── Inner (uses useSearchParams) ─────────────────────────────────────────────
function StaffPageInner() {
  const searchParams = useSearchParams()
  const section = searchParams.get("section") // "coordinators" | "teachers" | null

  const { user, activeTenant } = useStore()
  // Admins / owners see all branches; everyone else sees only their own
  const isMultiBranch = user?.role === "super_admin" || user?.role === "owner"
  // The current user's branch name — prefer activeTenant.name, fall back to user.tenantId
  const myBranchName = (activeTenant?.name ?? user?.tenantId ?? "").trim()

  const [staff, setStaff] = React.useState<StaffMember[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [branches, setBranches] = React.useState<string[]>(FALLBACK_BRANCHES)
  const [search, setSearch] = React.useState("")
  const [branchFilter, setBranchFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [addOpen, setAddOpen] = React.useState(false)
  const [editMember, setEditMember] = React.useState<StaffMember | null>(null)

  // ── Fetch staff + centers from API in parallel ────────────────────────────
  const fetchStaff = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [staffRes, centersRes] = await Promise.all([
        api.getStaff(),
        api.getCenters().catch(() => null),
      ])

      const list: any[] = Array.isArray(staffRes) ? staffRes : (staffRes?.staff ?? staffRes?.data ?? [])
      setStaff(list.map(mapApiStaff))

      // Normalize centers → branch name strings
      if (centersRes) {
        const centerList: any[] = Array.isArray(centersRes)
          ? centersRes
          : (centersRes?.centers ?? centersRes?.data ?? [])
        let names = centerList.map((c: any) =>
          c.name ?? c.branchName ?? c.centerName ?? ""
        ).filter(Boolean) as string[]

        // ── Scope to logged-in branch unless multi-branch role ────────────
        if (!isMultiBranch && myBranchName) {
          const matched = names.filter(n =>
            n.trim().toLowerCase() === myBranchName.toLowerCase()
          )
          // Use matched list; fall back to the raw name if API list doesn't contain it
          names = matched.length > 0 ? matched : (myBranchName ? [myBranchName] : names)
        }

        if (names.length > 0) setBranches(names)
      } else if (!isMultiBranch && myBranchName) {
        // Centers API unavailable — still scope to user's branch
        setBranches([myBranchName])
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load staff.")
    } finally {
      setLoading(false)
    }
  }, [isMultiBranch, myBranchName])

  React.useEffect(() => { fetchStaff() }, [fetchStaff])

  const handleEdit = (updated: StaffMember) =>
    setStaff(prev => prev.map(s => s.id === updated.id ? updated : s))

  const handleDelete = async (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id)) // optimistic
    try {
      await api.deleteStaff(id)
    } catch {
      fetchStaff() // revert on failure
    }
  }

  // Which list are we viewing based on the dedicated link?
  const isTeachers = section === "teachers"
  const coordinators = staff.filter(s => s.role === "Center Coordinator")
  const teachers = staff.filter(s => s.role !== "Center Coordinator")

  const currentList = isTeachers ? teachers : coordinators
  const baseTitle = isTeachers ? "Teachers & Educators" : "Center Coordinators"
  const pageTitle = user?.role === "super_admin" ? `All ${baseTitle}` : baseTitle
  
  const filtered = currentList.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.assignedClass ?? "").toLowerCase().includes(search.toLowerCase()) ||
      s.branch.toLowerCase().includes(search.toLowerCase())
    const matchBranch = branchFilter === "all" || s.branch === branchFilter
    const matchStatus = statusFilter === "all" || s.status === statusFilter
    const matchRole = !isTeachers || roleFilter === "all" || s.role === roleFilter
    
    return matchSearch && matchBranch && matchStatus && matchRole
  })

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

  // Summary stats for the current view
  const active = currentList.filter(s => s.status === "active").length
  const onLeave = currentList.filter(s => s.status === "on_leave").length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-border/60 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            {isTeachers ? <GraduationCap className="h-6 w-6 text-primary" /> : <UserCog className="h-6 w-6 text-primary" />}
            {pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading && staff.length === 0 ? "Loading..." : `${active} active · ${onLeave} on leave · ${currentList.length} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStaff}
            disabled={loading}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
          <Button variant="primary" size="sm" icon={UserPlus} onClick={() => setAddOpen(true)}>
            {isTeachers ? "Add Teacher" : "Add Coordinator"}
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
          <button onClick={fetchStaff} className="ml-auto underline underline-offset-2 font-semibold hover:opacity-80">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && staff.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary/80 mb-4" />
          <p className="text-sm">Loading data...</p>
        </div>
      )}

      {/* Filters + Search */}
      {!(loading && staff.length === 0) && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-card p-2 rounded-xl border border-border/60">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-44">
            <Select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="h-9 text-xs">
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b} value={b}>{b.replace("ARKA KIDS ", "")}</option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-36">
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 text-xs">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          {isTeachers && (
            <div className="w-full sm:w-44">
              <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-9 text-xs">
                <option value="all">All Roles</option>
                <option value="Lead Educator">Lead Educator</option>
                <option value="Assistant Teacher">Assistant Teacher</option>
                <option value="Enquiry Executive">Enquiry Executive</option>
                <option value="Caregiver / Support">Caregiver / Support</option>
              </Select>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56 shrink-0">
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

      {/* ── Coordinators View ── */}
      {!isTeachers && (
        <div className="space-y-2 mt-4">
          {filtered.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-xl border border-border/60 border-dashed mt-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-primary opacity-80" />
              </div>
              <p className="text-sm font-semibold text-foreground">No coordinators found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">Try adjusting your filters, searching for a different name, or add a new coordinator.</p>
            </div>
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

      {/* ── Teachers View ── */}
      {isTeachers && (
        <div className="space-y-2 mt-4">
          {filtered.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-xl border border-border/60 border-dashed mt-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-primary opacity-80" />
              </div>
              <p className="text-sm font-semibold text-foreground">No teachers found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">Try adjusting your filters, searching for a different name, or add a new teacher.</p>
            </div>
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
        </>
      )}

      <StaffFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={m => setStaff(prev => [m, ...prev])}
        coordinators={coordinators}
        branches={branches}
        userRole={user?.role || ""}
        isCoordinatorMode={!isTeachers}
      />

      {editMember && (
        <StaffFormDialog
          open={true}
          onClose={() => setEditMember(null)}
          onSave={handleEdit}
          coordinators={coordinators}
          branches={branches}
          userRole={user?.role || ""}
          isCoordinatorMode={editMember.role === "Center Coordinator"}
          editMember={editMember}
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
          <div className="px-4 py-3 bg-muted/10 grid sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-xs text-muted-foreground border-b border-border/40">
            <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" />{coordinator.email}</span>
            <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{coordinator.phone}</span>

            
            {coordinator.qualification && <span className="flex items-center gap-1.5"><GraduationCap className="h-3 w-3 shrink-0" />{coordinator.qualification}</span>}
            {coordinator.gender && <span className="flex items-center gap-1.5">Gender: {coordinator.gender}</span>}
            {coordinator.employmentType && <span className="flex items-center gap-1.5">Type: {coordinator.employmentType}</span>}
            {coordinator.dob && <span className="flex items-center gap-1.5">DOB: {coordinator.dob.split('-').reverse().join('-')}</span>}
            {coordinator.joiningDate && <span className="flex items-center gap-1.5">Joined: {coordinator.joiningDate.split('-').reverse().join('-')}</span>}
            {coordinator.experience && <span className="flex items-center gap-1.5">Exp: {coordinator.experience} yrs</span>}
            {coordinator.specialisation && <span className="flex items-center gap-1.5">Spec: {coordinator.specialisation}</span>}
            
            {(coordinator.emergencyName || coordinator.emergencyPhone) && (
              <span className="flex items-center gap-1.5 sm:col-span-2 lg:col-span-3 mt-1 pt-1 border-t border-border/30">
                <AlertTriangle className="h-3 w-3 shrink-0 text-muted-foreground" />
                Emergency: {coordinator.emergencyName} {coordinator.emergencyRelation ? `(${coordinator.emergencyRelation})` : ""} {coordinator.emergencyPhone ? `· ${coordinator.emergencyPhone}` : ""}
              </span>
            )}
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
