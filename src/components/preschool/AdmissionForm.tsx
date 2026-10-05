"use client"

import * as React from "react"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { useStore } from "@/store/useStore"
import { useBranches } from "@/hooks/useBranches"
import {
  PROGRAMS,
  suggestProgram,
  type AdmissionApplication,
  type ProgramId,
} from "@/lib/parentPortal"

function fileName(files: FileList | null) {
  return files?.[0]?.name
}

export function AdmissionForm({
  onCreated,
}: {
  onCreated?: (application: AdmissionApplication) => void
}) {
  const { addNotification } = useStore()
  const [childName, setChildName] = React.useState("")
  const [dob, setDob] = React.useState("")
  const [gender, setGender] = React.useState("Girl")
  const [session, setSession] = React.useState<"morning" | "afternoon">("morning")
  const { branches, loading } = useBranches()
  const [branch, setBranch] = React.useState<string>("")
  const [fatherName, setFatherName] = React.useState("")
  const [motherName, setMotherName] = React.useState("")

  React.useEffect(() => {
    if (branches.length > 0 && !branch) {
      setBranch(branches[0])
    }
  }, [branches, branch])
  const [fatherOccupation, setFatherOccupation] = React.useState("")
  const [motherOccupation, setMotherOccupation] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [emergencyName, setEmergencyName] = React.useState("")
  const [emergencyPhone, setEmergencyPhone] = React.useState("")
  const [bloodGroup, setBloodGroup] = React.useState("O+")
  const [allergies, setAllergies] = React.useState("None")
  const [pickupPersons, setPickupPersons] = React.useState("")
  const [siblingInSchool, setSiblingInSchool] = React.useState(false)
  const [visitDate, setVisitDate] = React.useState("")
  const [trialVisit, setTrialVisit] = React.useState(false)
  const [files, setFiles] = React.useState<AdmissionApplication["files"]>({})

  const suggested = suggestProgram(dob)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!childName.trim() || !dob || !fatherName.trim() || !motherName.trim() || !phone || !email) return

    const waitlist = suggested.id === "waitlist"
    const application: AdmissionApplication = {
      id: `adm-${Date.now()}`,
      status: waitlist ? "waitlist" : "pending",
      childName: childName.trim(),
      dob,
      gender,
      programId: suggested.id as ProgramId,
      session,
      branch,
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      fatherOccupation,
      motherOccupation,
      phone,
      email,
      address,
      emergencyName,
      emergencyPhone,
      bloodGroup,
      allergies,
      pickupPersons,
      siblingInSchool,
      visitDate: visitDate || undefined,
      trialVisit,
      files,
      createdAt: new Date().toISOString(),
    }

    onCreated?.(application)
    addNotification({
      title: waitlist ? "Added to waitlist" : "Admission submitted",
      description: waitlist
        ? `${application.childName} is under 2 and was placed on the waitlist.`
        : `${application.childName} · ${suggested.label} at ${branch}`,
      type: "admissions",
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-bold">Child details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder="Child name" value={childName} onChange={(e) => setChildName(e.target.value)} required />
          <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
          <Select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option>Girl</option>
            <option>Boy</option>
            <option>Other</option>
          </Select>
          <Select value={session} onChange={(e) => setSession(e.target.value as "morning" | "afternoon")}>
            <option value="morning">Morning session</option>
            <option value="afternoon">Afternoon session</option>
          </Select>
          <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
            {branches.map((item) => (
              <option key={`adm-branch-${item}`} value={item}>{item}</option>
            ))}
          </Select>
          <div>
            <Select value={suggested.label} disabled>
              {PROGRAMS.map((program) => (
                <option key={`adm-program-${program.id}`}>{program.label}</option>
              ))}
              <option>Waitlist</option>
              <option>Above Sr KG</option>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">{suggested.hint}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold">Parents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder="Father name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} required />
          <Input placeholder="Mother name" value={motherName} onChange={(e) => setMotherName(e.target.value)} required />
          <Input placeholder="Father occupation" value={fatherOccupation} onChange={(e) => setFatherOccupation(e.target.value)} />
          <Input placeholder="Mother occupation" value={motherOccupation} onChange={(e) => setMotherOccupation(e.target.value)} />
          <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Input placeholder="Residential address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold">Emergency, health & pickup</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder="Emergency contact name" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
          <Input placeholder="Emergency phone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
          <Select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((group) => (
              <option key={`bg-${group}`}>{group}</option>
            ))}
          </Select>
          <Input placeholder="Allergies / medical notes" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
        </div>
        <Input placeholder="Authorized pickup persons" value={pickupPersons} onChange={(e) => setPickupPersons(e.target.value)} />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={siblingInSchool} onChange={(e) => setSiblingInSchool(e.target.checked)} />
          Sibling already enrolled
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold">Visit / trial class</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={trialVisit} onChange={(e) => setTrialVisit(e.target.checked)} />
            Book a trial class
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold">Documents</h3>
        <p className="text-[11px] text-muted-foreground">Preview stores file names only — no upload API.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="space-y-1">
            <span className="text-muted-foreground">Birth certificate</span>
            <Input type="file" onChange={(e) => setFiles((prev) => ({ ...prev, birth: fileName(e.target.files) }))} />
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">Child photo</span>
            <Input type="file" accept="image/*" onChange={(e) => setFiles((prev) => ({ ...prev, photo: fileName(e.target.files) }))} />
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">Parent ID</span>
            <Input type="file" onChange={(e) => setFiles((prev) => ({ ...prev, parentId: fileName(e.target.files) }))} />
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">Aadhaar</span>
            <Input type="file" onChange={(e) => setFiles((prev) => ({ ...prev, aadhaar: fileName(e.target.files) }))} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-muted-foreground">Medical form</span>
            <Input type="file" onChange={(e) => setFiles((prev) => ({ ...prev, medical: fileName(e.target.files) }))} />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit">{suggested.id === "waitlist" ? "Join waitlist" : "Submit application"}</Button>
      </div>
    </form>
  )
}
