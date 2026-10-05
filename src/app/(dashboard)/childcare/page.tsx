"use client"

import * as React from "react"
import {
  HeartPulse, Utensils, Moon, Cake, Phone, AlertTriangle,
  Plus, X, Search, ChevronDown, Check, Printer, Download,
  User, Syringe, ShieldAlert, Clock, CalendarDays, Baby, Activity,
} from "lucide-react"
import { CHILDREN, type ChildRecord } from "@/lib/preschoolOps"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

// ─── Types ─────────────────────────────────────────────────────────────────────
type MedicalRecord = {
  childId: string
  bloodGroup: string
  allergies: string[]
  conditions: string[]
  vaccinations: { name: string; date: string; due?: string }[]
  incidents: { id: string; date: string; time: string; type: string; description: string; action: string; notifiedParent: boolean }[]
}

type MealLog = {
  id: string
  childId: string
  date: string
  meal: "Breakfast" | "Morning Snack" | "Lunch" | "Afternoon Snack"
  items: string
  eaten: "Full" | "Half" | "Refused"
  note: string
}

type NapLog = {
  id: string
  childId: string
  date: string
  start: string
  end: string
  quality: "Good" | "Restless" | "Skipped"
  note: string
}

type EmergencyContact = {
  childId: string
  contacts: { name: string; relation: string; phone: string; primary: boolean }[]
  doctorName: string
  doctorPhone: string
  hospital: string
}

// ─── Seed data ─────────────────────────────────────────────────────────────────
const INIT_MEDICAL: Record<string, MedicalRecord> = {
  "child-aanya": {
    childId: "child-aanya", bloodGroup: "O+",
    allergies: ["Peanuts", "Dust mites"],
    conditions: ["Mild Asthma"],
    vaccinations: [
      { name: "MMR", date: "2024-03-10", due: undefined },
      { name: "Hepatitis B", date: "2023-06-01", due: undefined },
      { name: "Chickenpox Booster", date: "", due: "2026-12-01" },
    ],
    incidents: [
      { id: "inc-1", date: "2026-08-14", time: "11:30 AM", type: "Minor Fall", description: "Slipped near sandbox. Small graze on left knee.", action: "First aid applied. Cleaned and bandaged.", notifiedParent: true },
    ],
  },
  "child-vihaan": { childId: "child-vihaan", bloodGroup: "A+", allergies: ["Lactose"], conditions: [], vaccinations: [{ name: "MMR", date: "2024-01-20" }], incidents: [] },
  "child-mira": { childId: "child-mira", bloodGroup: "B+", allergies: [], conditions: [], vaccinations: [{ name: "Polio (OPV)", date: "2023-11-10" }], incidents: [] },
  "child-arjun": { childId: "child-arjun", bloodGroup: "AB+", allergies: ["Eggs"], conditions: ["Eczema"], vaccinations: [], incidents: [] },
  "child-sara": { childId: "child-sara", bloodGroup: "O−", allergies: [], conditions: [], vaccinations: [], incidents: [] },
}

const today = new Date().toISOString().slice(0, 10)

const INIT_MEALS: MealLog[] = [
  { id: "m1", childId: "child-aanya", date: today, meal: "Breakfast", items: "Idli, Sambar, Juice", eaten: "Full", note: "" },
  { id: "m2", childId: "child-aanya", date: today, meal: "Morning Snack", items: "Banana, Milk", eaten: "Half", note: "Didn't finish milk" },
  { id: "m3", childId: "child-vihaan", date: today, meal: "Lunch", items: "Rice, Dal, Carrot Sabji", eaten: "Full", note: "" },
]

const INIT_NAPS: NapLog[] = [
  { id: "n1", childId: "child-aanya", date: today, start: "12:00", end: "13:30", quality: "Good", note: "" },
  { id: "n2", childId: "child-vihaan", date: today, start: "12:15", end: "13:00", quality: "Restless", note: "Woke up twice" },
]

const INIT_EMERGENCY: Record<string, EmergencyContact> = {
  "child-aanya": {
    childId: "child-aanya",
    contacts: [
      { name: "Neha Sharma", relation: "Mother", phone: "+91 98765 10001", primary: true },
      { name: "Raj Sharma", relation: "Father", phone: "+91 98765 10002", primary: false },
      { name: "Sunanda Sharma", relation: "Grandmother", phone: "+91 98765 10003", primary: false },
    ],
    doctorName: "Dr. Kavitha Rao", doctorPhone: "+91 80 4567 8901", hospital: "Manipal Hospital, Koramangala",
  },
  "child-vihaan": { childId: "child-vihaan", contacts: [{ name: "Kiran Reddy", relation: "Father", phone: "+91 98765 20001", primary: true }], doctorName: "Dr. Anand Kumar", doctorPhone: "+91 80 1234 5678", hospital: "Fortis Hospital, Whitefield" },
  "child-mira": { childId: "child-mira", contacts: [{ name: "Anjali Iyer", relation: "Mother", phone: "+91 98765 30001", primary: true }], doctorName: "Dr. Shreya Nair", doctorPhone: "+91 80 9876 5432", hospital: "Apollo Hospital, Koramangala" },
  "child-arjun": { childId: "child-arjun", contacts: [{ name: "Priya Menon", relation: "Mother", phone: "+91 98765 40001", primary: true }], doctorName: "Dr. Rohan Das", doctorPhone: "+91 80 2345 6789", hospital: "St. John's Hospital, Indiranagar" },
  "child-sara": { childId: "child-sara", contacts: [{ name: "Imran Khan", relation: "Father", phone: "+91 98765 50001", primary: true }], doctorName: "Dr. Fatima Sheikh", doctorPhone: "+91 80 3456 7890", hospital: "Cloudnine Hospital, Whitefield" },
}

// Staff + child DOBs for birthday tracker
const BIRTHDAYS = [
  { name: "Aanya Sharma", type: "child" as const, dob: "2022-09-05", class: "Nursery A", branch: "Koramangala" },
  { name: "Vihaan Reddy", type: "child" as const, dob: "2021-11-18", class: "LKG B", branch: "Whitefield" },
  { name: "Mira Iyer", type: "child" as const, dob: "2020-08-28", class: "UKG A", branch: "Koramangala" },
  { name: "Arjun Menon", type: "child" as const, dob: "2023-03-14", class: "Playgroup", branch: "Indiranagar" },
  { name: "Sara Khan", type: "child" as const, dob: "2021-10-02", class: "LKG A", branch: "Whitefield" },
  { name: "Anita Roy", type: "staff" as const, dob: "1992-09-10", class: "Lead Educator", branch: "Koramangala" },
  { name: "Kavita Menon", type: "staff" as const, dob: "1990-08-30", class: "Lead Educator", branch: "Whitefield" },
  { name: "Dev Sharma", type: "staff" as const, dob: "1998-11-22", class: "Assistant Teacher", branch: "Koramangala" },
]

function daysUntilBirthday(dob: string) {
  const now = new Date()
  const bd = new Date(dob)
  const next = new Date(now.getFullYear(), bd.getMonth(), bd.getDate())
  if (next < now) next.setFullYear(now.getFullYear() + 1)
  return Math.round((next.getTime() - now.getTime()) / 86400000)
}

function formatDob(dob: string) {
  return new Date(dob).toLocaleDateString("en-IN", { day: "numeric", month: "long" })
}

// ─── Shared helpers ────────────────────────────────────────────────────────────
const INPUT = "w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
const SELECT = "w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:border-primary"
const LABEL = "text-xs font-semibold text-foreground"

function SectionHeader({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/15">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

const STANDARD_VACCINES = [
  "BCG (Tuberculosis)",
  "Hepatitis B",
  "DTP / DTaP (Diphtheria, Tetanus, Pertussis)",
  "Polio (OPV / IPV)",
  "MMR (Measles, Mumps, Rubella)",
  "Rotavirus",
  "Pneumococcal (PCV)",
  "Chickenpox (Varicella)",
  "Hepatitis A",
  "Typhoid",
  "Influenza (Flu)",
  "Hib (Haemophilus influenzae type b)",
]

// ─── Tab 1: Health & Medical ───────────────────────────────────────────────────
function HealthTab({ child }: { child: ChildRecord }) {
  const [rec, setRec] = React.useState<MedicalRecord>({
    childId: child.id, bloodGroup: "", allergies: [], conditions: [], vaccinations: [], incidents: [],
  })
  const [docId, setDocId] = React.useState<string | null>(null)
  const [allergyInput, setAllergyInput] = React.useState("")
  const [condInput, setCondInput] = React.useState("")
  const [showVaxForm, setShowVaxForm] = React.useState(false)
  const [vaxName, setVaxName] = React.useState(""); const [vaxDate, setVaxDate] = React.useState(""); const [vaxDue, setVaxDue] = React.useState("")

  React.useEffect(() => {
    fetch(`/api/childcare?studentId=${child.id}&type=medical_profile`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const d = data[0]
          setDocId(d._id)
          setRec(p => ({
            ...p,
            bloodGroup: d.bloodGroup || "",
            allergies: d.allergies || [],
            conditions: d.conditions || [],
            vaccinations: d.vaccinations || [],
          }))
        } else {
          setDocId(null)
          setRec(p => ({ ...p, bloodGroup: "", allergies: [], conditions: [], vaccinations: [] }))
        }
      })
  }, [child.id])

  const saveProfile = async (updates: Partial<MedicalRecord>) => {
    const payload = {
      studentId: child.id,
      studentName: child.name,
      type: "medical_profile",
      bloodGroup: updates.bloodGroup ?? rec.bloodGroup,
      allergies: updates.allergies ?? rec.allergies,
      conditions: updates.conditions ?? rec.conditions,
      vaccinations: updates.vaccinations ?? rec.vaccinations
    }
    if (docId) {
      await fetch(`/api/childcare/${docId}`, { method: "PUT", body: JSON.stringify(payload) })
    } else {
      const res = await fetch("/api/childcare", { method: "POST", body: JSON.stringify(payload) })
      const data = await res.json()
      setDocId(data._id)
    }
    setRec(p => ({ ...p, ...updates }))
  }

  const addAllergy = () => { if (!allergyInput.trim()) return; saveProfile({ allergies: [...rec.allergies, allergyInput.trim()] }); setAllergyInput("") }
  const addCondition = () => { if (!condInput.trim()) return; saveProfile({ conditions: [...rec.conditions, condInput.trim()] }); setCondInput("") }
  const addVax = () => {
    if (!vaxName.trim()) return
    saveProfile({ vaccinations: [...rec.vaccinations, { name: vaxName.trim(), date: vaxDate, due: vaxDue || undefined }] })
    setVaxName(""); setVaxDate(""); setVaxDue(""); setShowVaxForm(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Overview row */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Blood Group */}
        <div className="rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/80 to-white p-5 shadow-xs relative overflow-hidden group">

          <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600/80 mb-1 flex items-center gap-1.5"><HeartPulse className="h-3.5 w-3.5" /> Blood Group</p>
              <p className="text-4xl font-black text-rose-700 tracking-tighter">{rec.bloodGroup || "—"}</p>
            </div>
            <input className={INPUT + " h-8 text-xs bg-white/80 border-rose-200 focus:border-rose-400 focus:ring-rose-400/20 shadow-xs font-bold"} placeholder="Update (e.g. O+)" value={rec.bloodGroup}
              onChange={e => setRec(p => ({ ...p, bloodGroup: e.target.value }))} onBlur={() => saveProfile({ bloodGroup: rec.bloodGroup })} />
          </div>
        </div>
        
        {/* Allergies */}
        <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-xs relative overflow-hidden group">

          <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80 mb-2 flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Allergies</p>
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {rec.allergies.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100/50 border border-amber-200 text-amber-800 text-[10px] px-2 py-1 font-bold shadow-xs">
                    {a}<button type="button" onClick={() => saveProfile({ allergies: rec.allergies.filter((_, j) => j !== i) })} className="hover:text-red-600 transition-colors opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {rec.allergies.length === 0 && <span className="text-xs font-bold text-amber-700/40">No allergies recorded</span>}
              </div>
            </div>
            <div className="flex gap-1.5">
              <input className={INPUT + " h-8 text-xs bg-white/80 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 font-bold shadow-xs"} placeholder="Add allergy..." value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addAllergy()} />
              <button type="button" onClick={addAllergy} className="h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 transition-colors text-white text-xs flex items-center shadow-xs"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-xs relative overflow-hidden group">

          <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/80 mb-2 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Medical Conditions</p>
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {rec.conditions.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100/50 border border-blue-200 text-blue-800 text-[10px] px-2 py-1 font-bold shadow-xs">
                    {c}<button type="button" onClick={() => saveProfile({ conditions: rec.conditions.filter((_, j) => j !== i) })} className="hover:text-red-600 transition-colors opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {rec.conditions.length === 0 && <span className="text-xs font-bold text-blue-700/40">No conditions recorded</span>}
              </div>
            </div>
            <div className="flex gap-1.5">
              <input className={INPUT + " h-8 text-xs bg-white/80 border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 font-bold shadow-xs"} placeholder="Add condition..." value={condInput} onChange={e => setCondInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addCondition()} />
              <button type="button" onClick={addCondition} className="h-8 px-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors text-white text-xs flex items-center shadow-xs"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Vaccinations */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs mt-6">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader icon={Syringe} title="Vaccination Record" sub="Immunisation history and due dates" />
          <button type="button" onClick={() => setShowVaxForm(p => !p)}
            className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-primary/90 shadow-xs transition-colors">
            <Plus className="h-4 w-4" /> Add Vaccination
          </button>
        </div>
        
        {showVaxForm && (
          <div className="space-y-4 mb-6 p-5 bg-muted/30 rounded-2xl border border-border/60 shadow-inner">
            <div>
              <label className={LABEL}>Select Standard Vaccine</label>
              <select
                className={SELECT + " mt-1"}
                value={STANDARD_VACCINES.includes(vaxName) ? vaxName : ""}
                onChange={e => setVaxName(e.target.value)}
              >
                <option value="">-- Choose standard vaccine or type custom name below --</option>
                {STANDARD_VACCINES.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Vaccine Name <span className="text-red-500">*</span></label>
                <input className={INPUT + " mt-1"} placeholder="e.g. MMR, Hepatitis B" value={vaxName} onChange={e => setVaxName(e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Date Given</label>
                <input type="date" className={INPUT + " mt-1"} value={vaxDate} onChange={e => setVaxDate(e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Next Due (optional)</label>
                <input type="date" className={INPUT + " mt-1"} value={vaxDue} onChange={e => setVaxDue(e.target.value)} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Quick Select Common Vaccines:</p>
              <div className="flex flex-wrap gap-2">
                {["BCG", "Hepatitis B", "DTP", "Polio", "MMR", "Chickenpox", "Rotavirus", "Influenza", "Typhoid"].map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setVaxName(name)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                      vaxName === name ? "bg-primary text-white border-primary shadow-xs" : "bg-card text-foreground border-border hover:border-primary/50"
                    )}
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-border/40 mt-2">
              <button type="button" onClick={() => setShowVaxForm(false)} className="h-9 px-4 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-card">Cancel</button>
              <button type="button" onClick={addVax} disabled={!vaxName.trim()} className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-50 shadow-xs transition-colors">Save Vaccination</button>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {rec.vaccinations.length === 0 && <p className="text-sm font-medium text-muted-foreground text-center py-6 border border-dashed rounded-xl border-border/60">No vaccinations recorded yet.</p>}
          {rec.vaccinations.map((v, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/60 bg-muted/10 flex items-center justify-between group hover:bg-muted/30 transition-colors">
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Syringe className="h-3.5 w-3.5 text-muted-foreground" />
                  {v.name}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  {v.date ? (
                     <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">Given: {new Date(v.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  ) : (
                     <p className="text-xs font-medium text-muted-foreground">Date not recorded</p>
                  )}
                  {v.due && (
                     <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">Due: {new Date(v.due).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {v.date && <span className="text-[10px] uppercase tracking-wider bg-emerald-500 text-white rounded-full px-3 py-1 font-bold shadow-xs">Done</span>}
                {!v.date && v.due && <span className="text-[10px] uppercase tracking-wider bg-amber-500 text-white rounded-full px-3 py-1 font-bold shadow-xs">Pending</span>}
                <button type="button" onClick={() => saveProfile({ vaccinations: rec.vaccinations.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-lg p-1.5"><X className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: Meal Tracker ───────────────────────────────────────────────────────
function MealTab({ child }: { child: ChildRecord }) {
  const [meals, setMeals] = React.useState<any[]>([])
  const [date, setDate] = React.useState(today)
  const [showForm, setShowForm] = React.useState(false)
  const [meal, setMeal] = React.useState("Breakfast")
  const [items, setItems] = React.useState(""); const [eaten, setEaten] = React.useState("Full"); const [note, setNote] = React.useState("")

  React.useEffect(() => {
    fetch(`/api/childcare?studentId=${child.id}&type=meal`)
      .then(res => res.json())
      .then(data => setMeals(Array.isArray(data) ? data : []))
  }, [child.id])

  const dayMeals = meals.filter(m => m.date === date)

  const addMeal = async () => {
    if (!items.trim()) return
    const payload = {
      studentId: child.id,
      studentName: child.name,
      type: "meal",
      date, meal, items: items.trim(), eaten, note
    }
    const res = await fetch("/api/childcare", { method: "POST", body: JSON.stringify(payload) })
    const data = await res.json()
    setMeals(prev => [data, ...prev])
    setItems(""); setNote(""); setShowForm(false)
  }

  const deleteMeal = async (id: string) => {
    await fetch(`/api/childcare/${id}`, { method: "DELETE" })
    setMeals(prev => prev.filter(m => m._id !== id))
  }

  const eatenColor = (e: string) => e === "Full" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : e === "Half" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200"

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SectionHeader icon={Utensils} title="Meal / Nutrition Log" sub={`${dayMeals.length} meals logged for ${new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`} />
        <div className="flex gap-2 items-center">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT + " w-40 h-8 text-xs"} />
          <button type="button" onClick={() => setShowForm(p => !p)}
            className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold flex items-center gap-1 shrink-0">
            <Plus className="h-3.5 w-3.5" /> Log Meal
          </button>
        </div>
      </div>

      {showForm && (
        <div className="grid sm:grid-cols-2 gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
          <div><label className={LABEL}>Meal Time</label>
            <select className={SELECT + " mt-1"} value={meal} onChange={e => setMeal(e.target.value)}>
              {["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div><label className={LABEL}>Amount Eaten</label>
            <select className={SELECT + " mt-1"} value={eaten} onChange={e => setEaten(e.target.value)}>
              {["Full", "Half", "Refused"].map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className={LABEL}>Food Items</label><input className={INPUT + " mt-1"} placeholder="e.g. Idli, Sambar, Juice" value={items} onChange={e => setItems(e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={LABEL}>Note (optional)</label><input className={INPUT + " mt-1"} placeholder="Any observation..." value={note} onChange={e => setNote(e.target.value)} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground">Cancel</button>
            <button type="button" onClick={addMeal} className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold">Save Meal</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {dayMeals.length === 0 && <div className="text-center py-10 text-sm text-muted-foreground border border-dashed border-border rounded-xl">No meals logged for this date.</div>}
        {dayMeals.map(m => (
          <div key={m._id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15">
              <Utensils className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{m.meal}</p>
              <p className="text-xs text-muted-foreground truncate">{m.items}</p>
              {m.note && <p className="text-[11px] text-muted-foreground italic mt-0.5">{m.note}</p>}
            </div>
            <span className={`text-[10px] font-bold rounded-full border px-2.5 py-0.5 shrink-0 ${eatenColor(m.eaten)}`}>{m.eaten}</span>
            <button type="button" onClick={() => deleteMeal(m._id)} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab 3: Nap / Sleep Log ────────────────────────────────────────────────────
function NapTab({ child }: { child: ChildRecord }) {
  const [naps, setNaps] = React.useState<any[]>([])
  const [date, setDate] = React.useState(today)
  const [showForm, setShowForm] = React.useState(false)
  const [start, setStart] = React.useState("12:00"); const [end, setEnd] = React.useState("13:30")
  const [quality, setQuality] = React.useState("Good"); const [note, setNote] = React.useState("")

  React.useEffect(() => {
    fetch(`/api/childcare?studentId=${child.id}&type=nap`)
      .then(res => res.json())
      .then(data => setNaps(Array.isArray(data) ? data : []))
  }, [child.id])

  const dayNaps = naps.filter(n => n.date === date)
  const totalMins = dayNaps.reduce((s, n) => {
    if (!n.start || !n.end || n.quality === "Skipped") return s
    const [sh, sm] = n.start.split(":").map(Number); const [eh, em] = n.end.split(":").map(Number)
    return s + (eh * 60 + em) - (sh * 60 + sm)
  }, 0)

  const addNap = async () => {
    const payload = {
      studentId: child.id,
      studentName: child.name,
      type: "nap",
      date, start, end, quality, note
    }
    const res = await fetch("/api/childcare", { method: "POST", body: JSON.stringify(payload) })
    const data = await res.json()
    setNaps(prev => [data, ...prev])
    setNote(""); setShowForm(false)
  }

  const deleteNap = async (id: string) => {
    await fetch(`/api/childcare/${id}`, { method: "DELETE" })
    setNaps(prev => prev.filter(n => n._id !== id))
  }

  const qualityColor = (q: string) => q === "Good" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : q === "Restless" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-muted-foreground bg-muted border-border"

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SectionHeader icon={Moon} title="Nap / Sleep Log" sub={totalMins > 0 ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m total sleep today` : "No nap recorded today"} />
        <div className="flex gap-2 items-center">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT + " w-40 h-8 text-xs"} />
          <button type="button" onClick={() => setShowForm(p => !p)}
            className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold flex items-center gap-1 shrink-0">
            <Plus className="h-3.5 w-3.5" /> Log Nap
          </button>
        </div>
      </div>

      {showForm && (
        <div className="grid sm:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
          <div><label className={LABEL}>Start Time</label><input type="time" className={INPUT + " mt-1"} value={start} onChange={e => setStart(e.target.value)} /></div>
          <div><label className={LABEL}>End Time</label><input type="time" className={INPUT + " mt-1"} value={end} onChange={e => setEnd(e.target.value)} /></div>
          <div><label className={LABEL}>Quality</label>
            <select className={SELECT + " mt-1"} value={quality} onChange={e => setQuality(e.target.value)}>
              {["Good", "Restless", "Skipped"].map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3"><label className={LABEL}>Note</label><input className={INPUT + " mt-1"} placeholder="Any observations..." value={note} onChange={e => setNote(e.target.value)} /></div>
          <div className="sm:col-span-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground">Cancel</button>
            <button type="button" onClick={addNap} className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold">Save</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {dayNaps.length === 0 && <div className="text-center py-10 text-sm text-muted-foreground border border-dashed border-border rounded-xl">No nap records for this date.</div>}
        {dayNaps.map(n => (
          <div key={n._id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15">
              <Moon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {n.quality === "Skipped" ? "Nap Skipped" : `${n.start} — ${n.end}`}
              </p>
              {n.note && <p className="text-xs text-muted-foreground">{n.note}</p>}
            </div>
            <span className={`text-[10px] font-bold rounded-full border px-2.5 py-0.5 shrink-0 ${qualityColor(n.quality)}`}>{n.quality}</span>
            <button type="button" onClick={() => deleteNap(n._id)} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab 4: Emergency Contacts ─────────────────────────────────────────────────
function EmergencyTab({ child }: { child: ChildRecord }) {
  const [docId, setDocId] = React.useState<string | null>(null)
  const [ec, setEc] = React.useState<any>({ contacts: [], doctorName: "", doctorPhone: "", hospital: "" })
  const [showForm, setShowForm] = React.useState(false)
  const [cName, setCName] = React.useState(""); const [cRel, setCRel] = React.useState(""); const [cPhone, setCPhone] = React.useState("")

  React.useEffect(() => {
    fetch(`/api/childcare?studentId=${child.id}&type=emergency`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setDocId(data[0]._id)
          setEc({
            contacts: data[0].contacts || [],
            doctorName: data[0].doctorName || "",
            doctorPhone: data[0].doctorPhone || "",
            hospital: data[0].hospital || ""
          })
        } else {
          setDocId(null)
          setEc({ contacts: [], doctorName: "", doctorPhone: "", hospital: "" })
        }
      })
  }, [child.id])

  const saveEmergency = async (updates: any) => {
    const payload = {
      studentId: child.id,
      studentName: child.name,
      type: "emergency",
      contacts: updates.contacts ?? ec.contacts,
      doctorName: updates.doctorName ?? ec.doctorName,
      doctorPhone: updates.doctorPhone ?? ec.doctorPhone,
      hospital: updates.hospital ?? ec.hospital,
    }
    if (docId) {
      await fetch(`/api/childcare/${docId}`, { method: "PUT", body: JSON.stringify(payload) })
    } else {
      const res = await fetch("/api/childcare", { method: "POST", body: JSON.stringify(payload) })
      const data = await res.json()
      setDocId(data._id)
    }
    setEc((p: any) => ({ ...p, ...updates }))
  }

  const addContact = () => {
    if (!cName.trim() || !cPhone.trim()) return
    const newContacts = [...ec.contacts, { name: cName.trim(), relation: cRel.trim(), phone: cPhone.trim(), primary: ec.contacts.length === 0 }]
    saveEmergency({ contacts: newContacts })
    setCName(""); setCRel(""); setCPhone(""); setShowForm(false)
  }

  const deleteContact = (i: number) => saveEmergency({ contacts: ec.contacts.filter((_: any, j: number) => j !== i) })
  const setPrimary = (i: number) => saveEmergency({ contacts: ec.contacts.map((x: any, j: number) => ({ ...x, primary: j === i })) })

  return (
    <div className="space-y-5">
      {/* Primary contact highlight */}
      {ec.contacts.length > 0 && (() => {
        const primary = ec.contacts.find((c: any) => c.primary) ?? ec.contacts[0]
        return (
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center shrink-0">
              {primary.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">Primary Emergency Contact</p>
              <p className="text-base font-bold text-foreground">{primary.name}</p>
              <p className="text-xs text-muted-foreground">{primary.relation} · {primary.phone}</p>
            </div>
            <a href={`tel:${primary.phone}`} className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2 hover:bg-primary/90">
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
          </div>
        )
      })()}

      {/* All contacts */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionHeader icon={Phone} title="Authorised Pickup Persons" />
          <button type="button" onClick={() => setShowForm(p => !p)}
            className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {showForm && (
          <div className="grid sm:grid-cols-3 gap-2 mb-3 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div><label className={LABEL}>Name</label><input className={INPUT + " mt-1"} value={cName} onChange={e => setCName(e.target.value)} placeholder="Full name" /></div>
            <div><label className={LABEL}>Relation</label><input className={INPUT + " mt-1"} value={cRel} onChange={e => setCRel(e.target.value)} placeholder="e.g. Father" /></div>
            <div><label className={LABEL}>Phone</label><input className={INPUT + " mt-1"} value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="+91 ..." /></div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground">Cancel</button>
              <button type="button" onClick={addContact} className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold">Add Contact</button>
            </div>
          </div>
        )}
        <div className="divide-y divide-border/40">
          {ec.contacts.map((c: any, i: number) => (
            <div key={i} className="py-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/10 shrink-0">
                {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.relation} · {c.phone}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.primary && <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-bold">Primary</span>}
                {!c.primary && (
                  <button type="button" onClick={() => setPrimary(i)}
                    className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5 hover:text-primary hover:border-primary/30">Set Primary</button>
                )}
                <button type="button" onClick={() => deleteContact(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {ec.contacts.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No contacts added yet.</p>}
        </div>
      </div>

      {/* Doctor info */}
      <div className="rounded-xl border border-border bg-card p-4">
        <SectionHeader icon={HeartPulse} title="Doctor & Hospital" sub="Preferred medical facility for this child" />
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className={LABEL}>Doctor Name</label><input className={INPUT + " mt-1"} value={ec.doctorName} onChange={e => setEc((p: any) => ({ ...p, doctorName: e.target.value }))} onBlur={() => saveEmergency({ doctorName: ec.doctorName })} placeholder="Dr. Name" /></div>
          <div><label className={LABEL}>Doctor Phone</label><input className={INPUT + " mt-1"} value={ec.doctorPhone} onChange={e => setEc((p: any) => ({ ...p, doctorPhone: e.target.value }))} onBlur={() => saveEmergency({ doctorPhone: ec.doctorPhone })} placeholder="+91 ..." /></div>
          <div><label className={LABEL}>Preferred Hospital</label><input className={INPUT + " mt-1"} value={ec.hospital} onChange={e => setEc((p: any) => ({ ...p, hospital: e.target.value }))} onBlur={() => saveEmergency({ hospital: ec.hospital })} placeholder="Hospital name & location" /></div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 5: Incident Report ────────────────────────────────────────────────────
function IncidentTab({ child }: { child: ChildRecord }) {
  const [incidents, setIncidents] = React.useState<any[]>([])
  const [showForm, setShowForm] = React.useState(false)
  const [iDate, setIDate] = React.useState(today); const [iTime, setITime] = React.useState("10:00")
  const [iType, setIType] = React.useState("Minor Fall"); const [iDesc, setIDesc] = React.useState("")
  const [iAction, setIAction] = React.useState(""); const [iNotified, setINotified] = React.useState(true)

  React.useEffect(() => {
    fetch(`/api/childcare?studentId=${child.id}&type=incident`)
      .then(res => res.json())
      .then(data => setIncidents(Array.isArray(data) ? data : []))
  }, [child.id])

  const addIncident = async () => {
    if (!iDesc.trim()) return
    const payload = {
      studentId: child.id,
      studentName: child.name,
      type: "incident",
      date: iDate,
      time: iTime,
      incidentType: iType,
      description: iDesc.trim(),
      action: iAction.trim(),
      notifiedParent: iNotified
    }
    const res = await fetch("/api/childcare", { method: "POST", body: JSON.stringify(payload) })
    const data = await res.json()
    setIncidents(p => [data, ...p])
    setIDesc(""); setIAction(""); setShowForm(false)
  }

  const deleteIncident = async (id: string) => {
    await fetch(`/api/childcare/${id}`, { method: "DELETE" })
    setIncidents(p => p.filter(i => i._id !== id))
  }

  const severityColor = (t: string) => {
    if (t.includes("Emergency") || t.includes("Injury")) return "text-red-700 bg-red-50 border-red-200"
    if (t.includes("Illness") || t.includes("Fever")) return "text-amber-700 bg-amber-50 border-amber-200"
    return "text-sky-700 bg-sky-50 border-sky-200"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader icon={ShieldAlert} title="Incident / Accident Reports" sub={`${incidents.length} incident${incidents.length !== 1 ? "s" : ""} on record`} />
        <button type="button" onClick={() => setShowForm(p => !p)}
          className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> Log Incident
        </button>
      </div>

      {showForm && (
        <div className="grid sm:grid-cols-2 gap-3 p-4 bg-red-50/60 border border-red-200/60 rounded-xl">
          <div className="flex items-center gap-2 sm:col-span-2 text-xs font-bold text-red-700"><AlertTriangle className="h-4 w-4" /> New Incident Report</div>
          <div><label className={LABEL}>Date</label><input type="date" className={INPUT + " mt-1"} value={iDate} onChange={e => setIDate(e.target.value)} /></div>
          <div><label className={LABEL}>Time</label><input type="time" className={INPUT + " mt-1"} value={iTime} onChange={e => setITime(e.target.value)} /></div>
          <div><label className={LABEL}>Incident Type</label>
            <select className={SELECT + " mt-1"} value={iType} onChange={e => setIType(e.target.value)}>
              {["Minor Fall", "Head Injury", "Skin Injury / Graze", "Fever / Illness", "Allergic Reaction", "Bite / Insect Sting", "Emotional Distress", "Other Emergency"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-5">
            <input type="checkbox" id="notified" checked={iNotified} onChange={e => setINotified(e.target.checked)} className="h-4 w-4 accent-primary" />
            <label htmlFor="notified" className="text-xs font-semibold text-foreground">Parent notified immediately</label>
          </div>
          <div className="sm:col-span-2"><label className={LABEL}>What happened?</label>
            <textarea className={INPUT + " mt-1 h-20 resize-none py-2"} placeholder="Describe the incident in detail..." value={iDesc} onChange={e => setIDesc(e.target.value)} />
          </div>
          <div className="sm:col-span-2"><label className={LABEL}>Action Taken</label>
            <textarea className={INPUT + " mt-1 h-16 resize-none py-2"} placeholder="First aid, called parent, doctor referral..." value={iAction} onChange={e => setIAction(e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground">Cancel</button>
            <button type="button" onClick={addIncident} className="h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold">Submit Report</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {incidents.length === 0 && <div className="text-center py-10 text-sm text-muted-foreground border border-dashed border-border rounded-xl">No incidents recorded. Good!</div>}
        {incidents.map(inc => (
          <div key={inc._id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-foreground">{inc.incidentType}</p>
                  <span className={`text-[10px] font-semibold rounded-full border px-2 py-0.5 ${severityColor(inc.incidentType || "")}`}>{((inc.incidentType || "").includes("Emergency") || (inc.incidentType || "").includes("Injury")) ? "Serious" : "Minor"}</span>
                  {inc.notifiedParent && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-semibold flex items-center gap-0.5"><Check className="h-2.5 w-2.5" />Parent Notified</span>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {new Date(inc.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {inc.time}
                </p>
                <p className="text-xs text-foreground mt-1.5">{inc.description}</p>
                {inc.action && <p className="text-xs text-muted-foreground mt-1 italic">Action: {inc.action}</p>}
              </div>
              <button type="button" onClick={() => deleteIncident(inc._id)} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Birthday Tracker (standalone, not per-child) ─────────────────────────────
function BirthdayTracker() {
  const sorted = [...BIRTHDAYS].sort((a, b) => daysUntilBirthday(a.dob) - daysUntilBirthday(b.dob))
  const upcoming = sorted.filter(b => daysUntilBirthday(b.dob) <= 30)
  const rest = sorted.filter(b => daysUntilBirthday(b.dob) > 30)

  const ring = (days: number) => days === 0 ? "border-2 border-primary bg-primary/5" : days <= 7 ? "border border-amber-300 bg-amber-50/50" : "border border-border bg-card"

  return (
    <div className="space-y-5">
      <SectionHeader icon={Cake} title="Birthday Tracker" sub="Children & staff birthdays for the next 30 days" />

      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">🎂 Coming up in 30 days</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map((b, i) => {
              const days = daysUntilBirthday(b.dob)
              return (
                <div key={i} className={`rounded-xl p-4 flex items-center gap-3 ${ring(days)}`}>
                  <div className={`h-10 w-10 rounded-full font-bold text-sm flex items-center justify-center shrink-0 ${b.type === "child" ? "bg-primary text-white" : "bg-muted text-foreground border border-border"}`}>
                    {b.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{b.name}</p>
                    <p className="text-[11px] text-muted-foreground">{b.class} · {b.branch}</p>
                    <p className="text-[11px] text-primary font-semibold mt-0.5">{formatDob(b.dob)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {days === 0
                      ? <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">Today! 🎉</span>
                      : <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${days <= 7 ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-muted text-muted-foreground border border-border"}`}>In {days}d</span>
                    }
                    <p className="text-[9px] text-muted-foreground mt-1">{b.type === "child" ? "Child" : "Staff"}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">All birthdays</p>
        <div className="divide-y divide-border/40 rounded-xl border border-border bg-card overflow-hidden">
          {rest.map((b, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${b.type === "child" ? "bg-primary/10 text-primary border border-primary/15" : "bg-muted text-foreground border border-border"}`}>
                {b.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{b.name}</p>
                <p className="text-[11px] text-muted-foreground">{b.type === "child" ? "Child" : "Staff"} · {b.class} · {b.branch}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-foreground">{formatDob(b.dob)}</p>
                <p className="text-[10px] text-muted-foreground">In {daysUntilBirthday(b.dob)} days</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const MAIN_TABS = [
  { id: "health", label: "Health & Medical", icon: HeartPulse },
  { id: "meals", label: "Meals", icon: Utensils },
  { id: "naps", label: "Nap Log", icon: Moon },
  { id: "emergency", label: "Emergency", icon: Phone },
  { id: "incidents", label: "Incidents", icon: ShieldAlert },
  { id: "birthdays", label: "Birthdays", icon: Cake },
] as const
type MainTab = typeof MAIN_TABS[number]["id"]

export default function ChildCarePage() {
  const [activeTab, setActiveTab] = React.useState<MainTab>("health")
  const [allChildren, setAllChildren] = React.useState<any[]>([])
  const [selectedChildId, setSelectedChildId] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [studentSearch, setStudentSearch] = React.useState("")
  const [studentDropdownOpen, setStudentDropdownOpen] = React.useState(false)
  const [batchSearch, setBatchSearch] = React.useState("")
  const [batchDropdownOpen, setBatchDropdownOpen] = React.useState(false)

  React.useEffect(() => {
    async function loadData() {
      try {
        const [batchesRes, studentsRes] = await Promise.all([
          api.getBatches(),
          api.getStudents()
        ])
        const rawBatches = Array.isArray(batchesRes) ? batchesRes : []
        const rawStudents = Array.isArray(studentsRes) ? studentsRes : (studentsRes?.students ?? studentsRes?.data ?? [])
        
        const studentOpts = rawStudents.map((s: any) => {
          const batchInfo = rawBatches.find((b: any) => b.studentNames?.includes(s.name))
          return {
            id: s.id || s._id,
            name: s.name,
            parentName: s.parentName,
            className: batchInfo ? `${batchInfo.courseName || "Batch"} — ${batchInfo.section || batchInfo.code || "A"}` : "Unassigned",
            branch: s.tenantId || "Main",
          }
        }).sort((a: any, b: any) => a.name.localeCompare(b.name))
        
        setAllChildren(studentOpts)
        if (studentOpts.length > 0) setSelectedChildId(studentOpts[0].id)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const selectedChild = allChildren.find(c => c.id === selectedChildId) ?? allChildren[0]
  const isBirthdayTab = activeTab === "birthdays"

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse text-sm">Loading records...</div>
  }

  if (allChildren.length === 0) {
    return <div className="p-8 text-center text-muted-foreground text-sm">No children found.</div>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-border/60 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Child Welfare</p>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
          <Baby className="h-6 w-6 text-primary" />
          Child Care Records
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Health logs, nutrition, sleep, emergency contacts, incident reports, and birthdays.
        </p>
      </div>

      {/* Main tab bar */}
      <div className="flex gap-1 flex-wrap bg-muted/50 border border-border/50 rounded-xl p-1">
        {MAIN_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              activeTab === t.id ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5 shrink-0" />{t.label}
          </button>
        ))}
      </div>

      {/* Birthday tab — no child selector */}
      {isBirthdayTab && <BirthdayTracker />}

      {/* Per-child tabs — show child selector */}
      {!isBirthdayTab && (
        <div className="space-y-4">
          {/* Child selector top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-muted/30 border border-border/60 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <div className="relative flex-1">
                <button
                  type="button"
                  onClick={() => setBatchDropdownOpen(!batchDropdownOpen)}
                  className="w-full h-10 pl-4 pr-4 bg-card border border-border rounded-xl text-sm font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-left shadow-xs flex items-center justify-between"
                >
                  <span className="truncate">{selectedChild?.className || "Select batch"}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </button>

                {batchDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setBatchDropdownOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden flex flex-col min-w-[200px]">
                      <div className="p-2 border-b border-border">
                        <input 
                          autoFocus
                          type="text"
                          placeholder="Search batch..."
                          value={batchSearch}
                          onChange={e => setBatchSearch(e.target.value)}
                          className="w-full h-8 px-3 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1">
                        {Array.from(new Set(allChildren.map((c: any) => c.className)))
                          .filter((cls: string) => cls.toLowerCase().includes(batchSearch.toLowerCase()))
                          .map((cls: string) => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => {
                              const firstInClass = allChildren.find((c: any) => c.className === cls)
                              if (firstInClass) setSelectedChildId(firstInClass.id)
                              setBatchDropdownOpen(false)
                              setBatchSearch("")
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted/60 transition-colors",
                              cls === selectedChild?.className && "bg-primary/10 text-primary font-bold"
                            )}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="relative flex-[1.5]">
                <button
                  type="button"
                  onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
                  className="w-full h-10 pl-9 pr-4 bg-card border border-border rounded-xl text-sm font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-left shadow-xs flex items-center justify-between"
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <span className="truncate">{selectedChild?.name || "Select student"}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </button>

                {studentDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setStudentDropdownOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-border">
                        <input 
                          autoFocus
                          type="text"
                          placeholder="Search student..."
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                          className="w-full h-8 px-3 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1">
                        {allChildren.filter(c => c.className === selectedChild.className && c.name.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 && (
                          <p className="text-xs text-muted-foreground p-2 text-center">No students found.</p>
                        )}
                        {allChildren.filter(c => c.className === selectedChild.className && c.name.toLowerCase().includes(studentSearch.toLowerCase())).map(child => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => {
                              setSelectedChildId(child.id)
                              setStudentDropdownOpen(false)
                              setStudentSearch("")
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted/60 transition-colors",
                              child.id === selectedChildId && "bg-primary/10 text-primary font-bold"
                            )}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Child header quick summary */}
            <div className="hidden sm:flex items-center gap-3 ml-auto pr-2 border-l border-border/60 pl-6">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
                {selectedChild.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0 text-right">
                <p className="text-sm font-bold text-foreground leading-none">{selectedChild.name}</p>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">{selectedChild.className} · {selectedChild.branch.replace("ARKA KIDS ", "")}</p>
              </div>
            </div>
          </div>

          {/* Content panel */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 lg:p-6 shadow-sm min-h-[400px]">
            {activeTab === "health" && <HealthTab child={selectedChild} />}
            {activeTab === "meals" && <MealTab child={selectedChild} />}
            {activeTab === "naps" && <NapTab child={selectedChild} />}
            {activeTab === "emergency" && <EmergencyTab child={selectedChild} />}
            {activeTab === "incidents" && <IncidentTab child={selectedChild} />}
          </div>
        </div>
      )}
    </div>
  )
}
