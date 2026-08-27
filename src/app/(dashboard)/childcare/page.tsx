"use client"

import * as React from "react"
import {
  HeartPulse, Utensils, Moon, Cake, Phone, AlertTriangle,
  Plus, X, Search, ChevronDown, Check, Printer, Download,
  User, Syringe, ShieldAlert, Clock, CalendarDays, Baby,
} from "lucide-react"
import { CHILDREN, type ChildRecord } from "@/lib/preschoolOps"
import { cn } from "@/lib/utils"

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

// ─── Tab 1: Health & Medical ───────────────────────────────────────────────────
function HealthTab({ child }: { child: ChildRecord }) {
  const [rec, setRec] = React.useState<MedicalRecord>(() => INIT_MEDICAL[child.id] ?? {
    childId: child.id, bloodGroup: "", allergies: [], conditions: [], vaccinations: [], incidents: [],
  })
  const [allergyInput, setAllergyInput] = React.useState("")
  const [condInput, setCondInput] = React.useState("")
  const [showVaxForm, setShowVaxForm] = React.useState(false)
  const [vaxName, setVaxName] = React.useState(""); const [vaxDate, setVaxDate] = React.useState(""); const [vaxDue, setVaxDue] = React.useState("")

  const addAllergy = () => { if (!allergyInput.trim()) return; setRec(p => ({ ...p, allergies: [...p.allergies, allergyInput.trim()] })); setAllergyInput("") }
  const addCondition = () => { if (!condInput.trim()) return; setRec(p => ({ ...p, conditions: [...p.conditions, condInput.trim()] })); setCondInput("") }
  const addVax = () => {
    if (!vaxName.trim()) return
    setRec(p => ({ ...p, vaccinations: [...p.vaccinations, { name: vaxName.trim(), date: vaxDate, due: vaxDue || undefined }] }))
    setVaxName(""); setVaxDate(""); setVaxDue(""); setShowVaxForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Overview row */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Blood Group</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{rec.bloodGroup || "—"}</p>
          <input className={INPUT + " mt-2 h-8 text-xs"} placeholder="e.g. O+" value={rec.bloodGroup}
            onChange={e => setRec(p => ({ ...p, bloodGroup: e.target.value }))} />
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Allergies</p>
          <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
            {rec.allergies.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] px-2 py-0.5 font-semibold">
                {a}<button type="button" onClick={() => setRec(p => ({ ...p, allergies: p.allergies.filter((_, j) => j !== i) }))}><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
            {rec.allergies.length === 0 && <span className="text-[11px] text-muted-foreground">None recorded</span>}
          </div>
          <div className="flex gap-1">
            <input className={INPUT + " h-7 text-xs"} placeholder="Add allergy" value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addAllergy()} />
            <button type="button" onClick={addAllergy} className="h-7 px-2 rounded-lg bg-primary text-white text-xs flex items-center"><Plus className="h-3 w-3" /></button>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Medical Conditions</p>
          <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
            {rec.conditions.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] px-2 py-0.5 font-semibold">
                {c}<button type="button" onClick={() => setRec(p => ({ ...p, conditions: p.conditions.filter((_, j) => j !== i) }))}><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
            {rec.conditions.length === 0 && <span className="text-[11px] text-muted-foreground">None recorded</span>}
          </div>
          <div className="flex gap-1">
            <input className={INPUT + " h-7 text-xs"} placeholder="Add condition" value={condInput} onChange={e => setCondInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCondition()} />
            <button type="button" onClick={addCondition} className="h-7 px-2 rounded-lg bg-primary text-white text-xs flex items-center"><Plus className="h-3 w-3" /></button>
          </div>
        </div>
      </div>

      {/* Vaccinations */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionHeader icon={Syringe} title="Vaccination Record" />
          <button type="button" onClick={() => setShowVaxForm(p => !p)}
            className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold flex items-center gap-1 hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {showVaxForm && (
          <div className="grid sm:grid-cols-3 gap-2 mb-3 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div><label className={LABEL}>Vaccine Name</label><input className={INPUT + " mt-1"} placeholder="e.g. MMR" value={vaxName} onChange={e => setVaxName(e.target.value)} /></div>
            <div><label className={LABEL}>Date Given</label><input type="date" className={INPUT + " mt-1"} value={vaxDate} onChange={e => setVaxDate(e.target.value)} /></div>
            <div><label className={LABEL}>Next Due (optional)</label><input type="date" className={INPUT + " mt-1"} value={vaxDue} onChange={e => setVaxDue(e.target.value)} /></div>
            <div className="sm:col-span-3 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowVaxForm(false)} className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              <button type="button" onClick={addVax} className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold">Save</button>
            </div>
          </div>
        )}
        <div className="divide-y divide-border/40">
          {rec.vaccinations.length === 0 && <p className="text-xs text-muted-foreground py-3">No vaccinations recorded yet.</p>}
          {rec.vaccinations.map((v, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{v.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {v.date ? `Given: ${new Date(v.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "Date not recorded"}
                  {v.due ? ` · Due: ${new Date(v.due).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {v.date && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-semibold">Done</span>}
                {!v.date && v.due && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-semibold">Pending</span>}
                <button type="button" onClick={() => setRec(p => ({ ...p, vaccinations: p.vaccinations.filter((_, j) => j !== i) }))} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
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
  const [meals, setMeals] = React.useState<MealLog[]>(INIT_MEALS.filter(m => m.childId === child.id))
  const [date, setDate] = React.useState(today)
  const [showForm, setShowForm] = React.useState(false)
  const [meal, setMeal] = React.useState<MealLog["meal"]>("Breakfast")
  const [items, setItems] = React.useState(""); const [eaten, setEaten] = React.useState<MealLog["eaten"]>("Full"); const [note, setNote] = React.useState("")

  const dayMeals = meals.filter(m => m.date === date)

  const addMeal = () => {
    if (!items.trim()) return
    setMeals(prev => [...prev, { id: `m-${Date.now()}`, childId: child.id, date, meal, items: items.trim(), eaten, note }])
    setItems(""); setNote(""); setShowForm(false)
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
            <select className={SELECT + " mt-1"} value={meal} onChange={e => setMeal(e.target.value as MealLog["meal"])}>
              {["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div><label className={LABEL}>Amount Eaten</label>
            <select className={SELECT + " mt-1"} value={eaten} onChange={e => setEaten(e.target.value as MealLog["eaten"])}>
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
          <div key={m.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15">
              <Utensils className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{m.meal}</p>
              <p className="text-xs text-muted-foreground truncate">{m.items}</p>
              {m.note && <p className="text-[11px] text-muted-foreground italic mt-0.5">{m.note}</p>}
            </div>
            <span className={`text-[10px] font-bold rounded-full border px-2.5 py-0.5 shrink-0 ${eatenColor(m.eaten)}`}>{m.eaten}</span>
            <button type="button" onClick={() => setMeals(p => p.filter(x => x.id !== m.id))} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab 3: Nap / Sleep Log ────────────────────────────────────────────────────
function NapTab({ child }: { child: ChildRecord }) {
  const [naps, setNaps] = React.useState<NapLog[]>(INIT_NAPS.filter(n => n.childId === child.id))
  const [date, setDate] = React.useState(today)
  const [showForm, setShowForm] = React.useState(false)
  const [start, setStart] = React.useState("12:00"); const [end, setEnd] = React.useState("13:30")
  const [quality, setQuality] = React.useState<NapLog["quality"]>("Good"); const [note, setNote] = React.useState("")

  const dayNaps = naps.filter(n => n.date === date)
  const totalMins = dayNaps.reduce((s, n) => {
    if (!n.start || !n.end || n.quality === "Skipped") return s
    const [sh, sm] = n.start.split(":").map(Number); const [eh, em] = n.end.split(":").map(Number)
    return s + (eh * 60 + em) - (sh * 60 + sm)
  }, 0)

  const addNap = () => {
    setNaps(p => [...p, { id: `n-${Date.now()}`, childId: child.id, date, start, end, quality, note }])
    setNote(""); setShowForm(false)
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
            <select className={SELECT + " mt-1"} value={quality} onChange={e => setQuality(e.target.value as NapLog["quality"])}>
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
          <div key={n.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-4">
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
            <button type="button" onClick={() => setNaps(p => p.filter(x => x.id !== n.id))} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab 4: Emergency Contacts ─────────────────────────────────────────────────
function EmergencyTab({ child }: { child: ChildRecord }) {
  const [ec, setEc] = React.useState<EmergencyContact>(() => INIT_EMERGENCY[child.id] ?? {
    childId: child.id, contacts: [], doctorName: "", doctorPhone: "", hospital: "",
  })
  const [showForm, setShowForm] = React.useState(false)
  const [cName, setCName] = React.useState(""); const [cRel, setCRel] = React.useState(""); const [cPhone, setCPhone] = React.useState("")

  const addContact = () => {
    if (!cName.trim() || !cPhone.trim()) return
    setEc(p => ({ ...p, contacts: [...p.contacts, { name: cName.trim(), relation: cRel.trim(), phone: cPhone.trim(), primary: p.contacts.length === 0 }] }))
    setCName(""); setCRel(""); setCPhone(""); setShowForm(false)
  }

  return (
    <div className="space-y-5">
      {/* Primary contact highlight */}
      {ec.contacts.length > 0 && (() => {
        const primary = ec.contacts.find(c => c.primary) ?? ec.contacts[0]
        return (
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary text-white font-bold text-lg flex items-center justify-center shrink-0">
              {primary.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
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
          {ec.contacts.map((c, i) => (
            <div key={i} className="py-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/10 shrink-0">
                {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.relation} · {c.phone}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.primary && <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-bold">Primary</span>}
                {!c.primary && (
                  <button type="button" onClick={() => setEc(p => ({ ...p, contacts: p.contacts.map((x, j) => ({ ...x, primary: j === i })) }))}
                    className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5 hover:text-primary hover:border-primary/30">Set Primary</button>
                )}
                <button type="button" onClick={() => setEc(p => ({ ...p, contacts: p.contacts.filter((_, j) => j !== i) }))} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
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
          <div><label className={LABEL}>Doctor Name</label><input className={INPUT + " mt-1"} value={ec.doctorName} onChange={e => setEc(p => ({ ...p, doctorName: e.target.value }))} placeholder="Dr. Name" /></div>
          <div><label className={LABEL}>Doctor Phone</label><input className={INPUT + " mt-1"} value={ec.doctorPhone} onChange={e => setEc(p => ({ ...p, doctorPhone: e.target.value }))} placeholder="+91 ..." /></div>
          <div><label className={LABEL}>Preferred Hospital</label><input className={INPUT + " mt-1"} value={ec.hospital} onChange={e => setEc(p => ({ ...p, hospital: e.target.value }))} placeholder="Hospital name & location" /></div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 5: Incident Report ────────────────────────────────────────────────────
function IncidentTab({ child }: { child: ChildRecord }) {
  const initIncidents = INIT_MEDICAL[child.id]?.incidents ?? []
  const [incidents, setIncidents] = React.useState(initIncidents)
  const [showForm, setShowForm] = React.useState(false)
  const [iDate, setIDate] = React.useState(today); const [iTime, setITime] = React.useState("10:00")
  const [iType, setIType] = React.useState("Minor Fall"); const [iDesc, setIDesc] = React.useState("")
  const [iAction, setIAction] = React.useState(""); const [iNotified, setINotified] = React.useState(true)

  const addIncident = () => {
    if (!iDesc.trim()) return
    setIncidents(p => [{ id: `inc-${Date.now()}`, date: iDate, time: iTime, type: iType, description: iDesc.trim(), action: iAction.trim(), notifiedParent: iNotified }, ...p])
    setIDesc(""); setIAction(""); setShowForm(false)
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
          <div key={inc.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-foreground">{inc.type}</p>
                  <span className={`text-[10px] font-semibold rounded-full border px-2 py-0.5 ${severityColor(inc.type)}`}>{inc.type.includes("Emergency") || inc.type.includes("Injury") ? "Serious" : "Minor"}</span>
                  {inc.notifiedParent && <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-semibold flex items-center gap-0.5"><Check className="h-2.5 w-2.5" />Parent Notified</span>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {new Date(inc.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {inc.time}
                </p>
                <p className="text-xs text-foreground mt-1.5">{inc.description}</p>
                {inc.action && <p className="text-xs text-muted-foreground mt-1 italic">Action: {inc.action}</p>}
              </div>
              <button type="button" onClick={() => setIncidents(p => p.filter(x => x.id !== inc.id))} className="text-muted-foreground hover:text-destructive shrink-0"><X className="h-3.5 w-3.5" /></button>
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
                    {b.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
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
                {b.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
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
  { id: "health",    label: "Health & Medical", icon: HeartPulse },
  { id: "meals",     label: "Meals",            icon: Utensils },
  { id: "naps",      label: "Nap Log",          icon: Moon },
  { id: "emergency", label: "Emergency",        icon: Phone },
  { id: "incidents", label: "Incidents",        icon: ShieldAlert },
  { id: "birthdays", label: "Birthdays",        icon: Cake },
] as const
type MainTab = typeof MAIN_TABS[number]["id"]

export default function ChildCarePage() {
  const [activeTab, setActiveTab] = React.useState<MainTab>("health")
  const [selectedChildId, setSelectedChildId] = React.useState(CHILDREN[0].id)
  const [search, setSearch] = React.useState("")

  const filteredChildren = CHILDREN.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.className.toLowerCase().includes(search.toLowerCase())
  )
  const selectedChild = CHILDREN.find(c => c.id === selectedChildId) ?? CHILDREN[0]
  const isBirthdayTab = activeTab === "birthdays"

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
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Child selector sidebar */}
          <div className="lg:w-52 shrink-0 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input type="text" placeholder="Search child..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
            </div>
            <div className="space-y-1">
              {filteredChildren.map(child => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl border flex items-center gap-2.5 transition-colors",
                    selectedChildId === child.id
                      ? "bg-primary text-white border-primary"
                      : "bg-card border-border hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0",
                    selectedChildId === child.id ? "bg-white/20 text-white" : "bg-primary/10 text-primary border border-primary/15"
                  )}>
                    {child.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-xs font-semibold truncate", selectedChildId === child.id ? "text-white" : "text-foreground")}>{child.name}</p>
                    <p className={cn("text-[10px] truncate", selectedChildId === child.id ? "text-white/70" : "text-muted-foreground")}>{child.className}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content panel */}
          <div className="flex-1 min-w-0 rounded-xl border border-border bg-card p-4">
            {/* Child header */}
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border/50">
              <div className="h-10 w-10 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                {selectedChild.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{selectedChild.name}</p>
                <p className="text-[11px] text-muted-foreground">{selectedChild.className} · {selectedChild.branch.replace("ARKA KIDS ", "")}</p>
              </div>
            </div>

            {activeTab === "health"    && <HealthTab    child={selectedChild} />}
            {activeTab === "meals"     && <MealTab      child={selectedChild} />}
            {activeTab === "naps"      && <NapTab       child={selectedChild} />}
            {activeTab === "emergency" && <EmergencyTab child={selectedChild} />}
            {activeTab === "incidents" && <IncidentTab  child={selectedChild} />}
          </div>
        </div>
      )}
    </div>
  )
}
