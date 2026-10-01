"use client"

import * as React from "react"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { useStore } from "@/store/useStore"
import { api } from "@/lib/api"
import { ageFromDob } from "@/lib/parentPortal"

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
  const [session, setSession] = React.useState<"morning" | "afternoon">("morning")
  const [siblingInSchool, setSiblingInSchool] = React.useState(false)
  const [course, setCourse] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [courses, setCourses] = React.useState<any[]>([])

  React.useEffect(() => {
    api.getCourses().then(data => {
      setCourses(data || [])
      if (data && data.length > 0 && !course) {
        setCourse(data[0].name)
      }
    }).catch(console.error)
  }, [])

  // Auto-suggest Program based on Child DOB
  const childAge = ageFromDob(childDob)
  const isUnder2 = !!childDob && childAge < 2

  React.useEffect(() => {
    if (!childDob || courses.length === 0) return
    const age = ageFromDob(childDob)
    
    // Find best matching course
    let suggested = ""
    const courseNames = courses.map(c => c.name.toLowerCase())
    
    if (age < 2) {
      suggested = courses.find(c => c.name.toLowerCase().includes("waitlist"))?.name || ""
    } else if (age >= 2 && age < 3) {
      suggested = courses.find(c => c.name.toLowerCase().includes("toddler") || c.name.toLowerCase().includes("playgroup"))?.name || ""
    } else if (age >= 3 && age < 4) {
      suggested = courses.find(c => c.name.toLowerCase().includes("nursery"))?.name || ""
    } else if (age >= 4 && age < 5) {
      suggested = courses.find(c => c.name.toLowerCase().includes("lkg") || c.name.toLowerCase().includes("jr"))?.name || ""
    } else {
      suggested = courses.find(c => c.name.toLowerCase().includes("ukg") || c.name.toLowerCase().includes("sr"))?.name || ""
    }
    
    if (suggested) {
      setCourse(suggested)
    }
  }, [childDob, courses])

  const getDobHint = () => {
    if (!childDob) return "Select date of birth to auto-suggest grade"
    if (childAge < 2) return "Child is under 2 years — usually placed on Waitlist"
    if (childAge < 3) return "Suggested for age 2–3: Toddler / Playgroup"
    if (childAge < 4) return "Suggested for age 3–4: Nursery"
    if (childAge < 5) return "Suggested for age 4–5: LKG / Jr KG"
    return "Suggested for age 5+: UKG / Sr KG"
  }

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
      course: course,
      dateOfBirth: childDob,
      address,
      suggestedProgram: course,
      session,
      siblingInSchool,
      stage: "new" as const,
      value: course === "Waitlist" ? 0 : 28000,
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
      title: course === "Waitlist" ? "Waitlist enquiry saved" : "Enquiry saved",
      description: `${child} · ${course} (${getDobHint()})`,
      type: "admissions",
    })
    setChildName("")
    setChildDob("")
    setParentName("")
    setEmail("")
    setPhone("")
    setAddress("")
    if (courses.length > 0) setCourse(courses[0].name)
    else setCourse("")
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
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Program / Class Grade</label>
        <Select value={course} onChange={(e) => setCourse(e.target.value)} className="bg-card text-xs h-9.5">
          {courses.map((c) => (
            <option key={c.id || c._id} value={c.name}>
              {c.name}
            </option>
          ))}
          {courses.length === 0 && <option value="">No programs available</option>}
        </Select>
        <p className={`text-[10px] font-medium ${isUnder2 ? "text-amber-600 font-bold" : "text-muted-foreground"}`}>
          {getDobHint()}
        </p>
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
