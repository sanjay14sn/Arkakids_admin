"use client"

import * as React from "react"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { useStore } from "@/store/useStore"
import { api } from "@/lib/api"
import { BRANCHES } from "@/lib/preschoolOps"
import { PROGRAMS, suggestProgram } from "@/lib/parentPortal"

export function EnquiryForm({
  onSuccess,
  submitLabel = "Submit enquiry",
}: {
  onSuccess?: () => void
  submitLabel?: string
}) {
  const { addLead, addNotification, user } = useStore()
  const [childName, setChildName] = React.useState("")
  const [childDob, setChildDob] = React.useState("")
  const [parentName, setParentName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [preferredBranch, setPreferredBranch] = React.useState<string>(BRANCHES[0])
  const [session, setSession] = React.useState<"morning" | "afternoon">("morning")
  const [siblingInSchool, setSiblingInSchool] = React.useState(false)
  const [course, setCourse] = React.useState("Nursery")
  const [saving, setSaving] = React.useState(false)

  const suggested = suggestProgram(childDob)

  React.useEffect(() => {
    if (suggested.id !== "waitlist" && suggested.id !== "overage") {
      const program = PROGRAMS.find((item) => item.id === suggested.id)
      if (program) setCourse(program.label)
    } else if (suggested.id === "waitlist") {
      setCourse("Waitlist")
    }
  }, [suggested.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const child = childName.trim()
    const parent = parentName.trim()
    if (!child || !parent || !email || !phone) return
    setSaving(true)

    const payload = {
      name: child,
      childName: child,
      parentName: parent,
      email,
      phone,
      course: course || suggested.label,
      dateOfBirth: childDob,
      address,
      preferredBranch,
      suggestedProgram: suggested.label,
      session,
      siblingInSchool,
      stage: "new" as const,
      value: suggested.id === "waitlist" ? 0 : 28000,
      notes: [],
      assignedBdeId: user?.role === "bde" ? user.id : undefined,
      counsellor: user?.role === "bde" ? user.name : undefined,
    }

    try {
      const data = await api.createLead(payload)
      addLead({
        ...payload,
        ...data,
        id: data._id || data.id || `enq-${Date.now()}`,
        counsellor: payload.counsellor || "",
        createdDate: new Date().toISOString().slice(0, 10),
      })
    } catch {
      addLead({
        ...payload,
        id: `enq-${Date.now()}`,
        createdDate: new Date().toISOString().slice(0, 10),
        counsellor: payload.counsellor || "",
      })
    }

    addNotification({
      title: suggested.id === "waitlist" ? "Waitlist enquiry saved" : "Enquiry saved",
      description: `${child} · ${suggested.hint}`,
      type: "admissions",
    })
    setChildName("")
    setChildDob("")
    setParentName("")
    setEmail("")
    setPhone("")
    setAddress("")
    setCourse("Nursery")
    setSiblingInSchool(false)
    setSaving(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Child name</label>
          <Input placeholder="Child name" value={childName} onChange={(e) => setChildName(e.target.value)} className="bg-card text-xs h-9.5" required />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Date of birth</label>
          <Input type="date" value={childDob} onChange={(e) => setChildDob(e.target.value)} className="bg-card text-xs h-9.5" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Parent name</label>
          <Input placeholder="Parent name" value={parentName} onChange={(e) => setParentName(e.target.value)} className="bg-card text-xs h-9.5" required />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Contact number</label>
          <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-card text-xs h-9.5" required />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Email ID</label>
        <Input type="email" placeholder="name@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-card text-xs h-9.5" required />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Address</label>
        <Input placeholder="Home address" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-card text-xs h-9.5" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Preferred branch</label>
          <Select value={preferredBranch} onChange={(e) => setPreferredBranch(e.target.value)} className="bg-card text-xs h-9.5">
            {BRANCHES.map((branch) => (
              <option key={`enq-branch-${branch}`} value={branch}>{branch}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Program</label>
          <Select value={course} onChange={(e) => setCourse(e.target.value)} className="bg-card text-xs h-9.5">
            {PROGRAMS.map((program) => (
              <option key={`enq-program-${program.id}`} value={program.label}>{program.label} ({program.ages})</option>
            ))}
            <option value="Waitlist">Waitlist (under 2)</option>
          </Select>
          <p className="text-[10px] text-muted-foreground">{suggested.hint}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Session</label>
          <Select value={session} onChange={(e) => setSession(e.target.value as "morning" | "afternoon")} className="bg-card text-xs h-9.5">
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground pt-6">
          <input type="checkbox" checked={siblingInSchool} onChange={(e) => setSiblingInSchool(e.target.checked)} />
          Sibling already at ARKA KIDS
        </label>
      </div>
      <div className="pt-2 flex justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
