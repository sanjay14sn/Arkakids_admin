"use client"

import * as React from "react"
import {
  ClipboardCheck,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  BookOpen,
  Brain,
  Hand,
  Users2,
  Star,
  TrendingUp,
  FileText,
  Save,
  Info,
  BarChart3,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { useStore } from "@/store/useStore"
import { formatDate } from "@/lib/utils"
import {
  CHILDREN,
  PARENT_CHILD_ID,
  SKILL_LEVELS,
  childById,
  emptyDomains,
  parentChildFilter,
  usePreschoolOps,
  type AssessmentDomain,
  type AssessmentReport,
  type SkillLevel,
} from "@/lib/preschoolOps"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts"

// ─── International Framework Alignment ───────────────────────────────────────
// Based on EYFS (Early Years Foundation Stage, UK), NAEYC (USA), and
// Australian EYLF (Early Years Learning Framework) domain standards.

const DOMAIN_META: Record<
  AssessmentDomain["key"],
  {
    label: string
    icon: React.ElementType
    description: string
    standard: string
    criteriaByLevel: Record<SkillLevel, string>
  }
> = {
  communication: {
    label: "Communication & Language",
    icon: BookOpen,
    description: "Listening, understanding, and speaking in context",
    standard: "EYFS — Communication & Language",
    criteriaByLevel: {
      emerging: "Responds to simple instructions; recognises own name; uses 2–3 word utterances",
      developing: "Uses sentences; asks questions; understands role-play narratives",
      secure: "Communicates clearly; retells stories; initiates and sustains conversations",
    },
  },
  motor: {
    label: "Physical & Motor Development",
    icon: Hand,
    description: "Fine and gross motor coordination, body awareness",
    standard: "NAEYC — Physical Development",
    criteriaByLevel: {
      emerging: "Attempts pincer grip; walks independently; some balance challenges",
      developing: "Uses crayons with control; hops; manages simple tools like scissors",
      secure: "Fluent pencil grip; coordinates movements with confidence; active in outdoor play",
    },
  },
  cognitive: {
    label: "Cognitive & Problem-Solving",
    icon: Brain,
    description: "Early numeracy, logic, memory, and inquiry-based thinking",
    standard: "EYLF — Outcome 4: Learning",
    criteriaByLevel: {
      emerging: "Recognises shapes and colours; explores objects; some cause-and-effect understanding",
      developing: "Counts to 10; classifies objects; begins simple problem-solving with guidance",
      secure: "Applies reasoning; experiments independently; engages in sustained inquiry tasks",
    },
  },
  social: {
    label: "Social & Emotional Development",
    icon: Users2,
    description: "Self-regulation, empathy, peer relationships, and emotional expression",
    standard: "EYFS — Personal, Social & Emotional",
    criteriaByLevel: {
      emerging: "Beginning to share; prefers parallel play; needs adult support for conflict resolution",
      developing: "Takes turns; shows empathy; can express emotions with some adult support",
      secure: "Cooperates in groups; manages feelings independently; builds friendships confidently",
    },
  },
  participation: {
    label: "Participation & Independence",
    icon: Star,
    description: "Engagement in routines, self-help skills, and group activities",
    standard: "EYLF — Outcome 3: Wellbeing",
    criteriaByLevel: {
      emerging: "Requires adult prompting; hesitant in group settings; exploring routines",
      developing: "Follows most routines independently; joins group activities with encouragement",
      secure: "Fully self-directed; leads in group tasks; consistent and confident in routines",
    },
  },
}

// ─── Level helpers ────────────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<
  SkillLevel,
  { label: string; color: string; bg: string; ring: string; dot: string; radarValue: number }
> = {
  emerging: {
    label: "Emerging",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    ring: "ring-amber-400",
    dot: "bg-amber-400",
    radarValue: 1,
  },
  developing: {
    label: "Developing",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    ring: "ring-blue-400",
    dot: "bg-blue-400",
    radarValue: 2,
  },
  secure: {
    label: "Secure",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    ring: "ring-emerald-400",
    dot: "bg-emerald-500",
    radarValue: 3,
  },
}

function LevelPill({ level }: { level: SkillLevel }) {
  const cfg = LEVEL_CONFIG[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${cfg.bg} ${cfg.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function OverallProgress({ domains }: { domains: AssessmentDomain[] }) {
  const values = domains.map((d) => LEVEL_CONFIG[d.level].radarValue)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const pct = Math.round((avg / 3) * 100)

  let label = "Emerging Learner"
  let color = "text-amber-600"
  let bg = "bg-amber-100"
  if (avg >= 2.5) { label = "Secure Learner"; color = "text-emerald-600"; bg = "bg-emerald-100" }
  else if (avg >= 1.5) { label = "Developing Learner"; color = "text-blue-600"; bg = "bg-blue-100" }

  return (
    <div className="flex items-center gap-3">
      <div className={`px-3 py-1 rounded-full text-xs font-bold ${bg} ${color}`}>{label}</div>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-blue-400 to-emerald-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-foreground">{pct}%</span>
    </div>
  )
}

function AssessmentRadar({ domains }: { domains: AssessmentDomain[] }) {
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => { setReady(true) }, [])

  const data = domains.map((d) => ({
    subject: DOMAIN_META[d.key].label.split(" ")[0],
    value: LEVEL_CONFIG[d.level].radarValue,
    fullMark: 3,
  }))

  if (!ready) return <div className="h-48 w-full bg-muted/20 animate-pulse rounded-xl" />

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <Radar
            name="Child"
            dataKey="value"
            stroke="#8B0000"
            fill="#8B0000"
            fillOpacity={0.18}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              borderRadius: "8px",
              fontSize: "11px",
            }}
            formatter={(value) => {
              const num = typeof value === "number" ? value : Number(value)
              const lvl = Object.entries(LEVEL_CONFIG).find(
                ([, v]) => v.radarValue === num
              )?.[0] as SkillLevel | undefined
              return [lvl ? LEVEL_CONFIG[lvl].label : value, "Level"]
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Domain Selector Card ─────────────────────────────────────────────────────
function DomainSelector({
  domain,
  onChange,
}: {
  domain: AssessmentDomain
  onChange: (level: SkillLevel) => void
}) {
  const meta = DOMAIN_META[domain.key]
  const Icon = meta.icon

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
      {/* Domain header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{meta.label}</p>
          <p className="text-[11px] text-muted-foreground">{meta.description}</p>
          <p className="text-[10px] text-primary/70 font-medium mt-0.5">{meta.standard}</p>
        </div>
      </div>

      {/* Level selector row */}
      <div className="px-4 py-3 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {SKILL_LEVELS.map((lvl) => {
            const cfg = LEVEL_CONFIG[lvl.id]
            const isSelected = domain.level === lvl.id
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => onChange(lvl.id)}
                className={`relative rounded-lg border-2 px-2 py-2.5 text-[11px] font-semibold transition-all cursor-pointer text-center ${
                  isSelected
                    ? `${cfg.bg} ${cfg.color} border-current`
                    : "border-border/60 text-muted-foreground hover:bg-muted/30"
                }`}
              >
                {isSelected && (
                  <CheckCircle2 className="absolute top-1 right-1 h-3 w-3" />
                )}
                <span className={`block h-1.5 w-1.5 rounded-full mx-auto mb-1.5 ${isSelected ? cfg.dot : "bg-muted-foreground/30"}`} />
                {lvl.label}
              </button>
            )
          })}
        </div>

        {/* Criteria hint for selected level */}
        <div className="rounded-lg bg-muted/30 px-3 py-2">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">{LEVEL_CONFIG[domain.level].label}: </span>
            {meta.criteriaByLevel[domain.level]}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Report Card (read-only view) ─────────────────────────────────────────────
function ReportCard({ report }: { report: AssessmentReport }) {
  const [expanded, setExpanded] = React.useState(false)
  const child = childById(report.childId)

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {report.term.replace("Term ", "T")}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{report.term}</p>
            <p className="text-[11px] text-muted-foreground">
              {formatDate(report.date)} · {report.teacher}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {child && (
            <span className="hidden sm:inline text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
              {child.ageBand}
            </span>
          )}
          <OverallProgress domains={report.domains} />
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border/50 px-5 py-4 space-y-4">
          {/* Radar + Domain rows */}
          <div className="grid gap-4 sm:grid-cols-2">
            <AssessmentRadar domains={report.domains} />
            <div className="space-y-2.5">
              {report.domains.map((domain) => {
                const meta = DOMAIN_META[domain.key]
                const Icon = meta.icon
                return (
                  <div key={domain.key} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-foreground font-medium truncate">{meta.label}</span>
                    </div>
                    <LevelPill level={domain.level} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Remarks */}
          <div className="rounded-xl bg-muted/20 border border-border/50 px-4 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Teacher Remarks
            </p>
            <p className="text-sm text-foreground leading-relaxed">{report.remarks}</p>
          </div>

          {/* Standard alignment footer */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Info className="h-3 w-3 shrink-0" />
            <span>Assessment aligned with EYFS, NAEYC, and Australian EYLF international standards.</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProgressPage() {
  const { user, addNotification } = useStore()
  const isParent = user?.role === "student"
  const canEdit = !isParent
  const { state, update, ready } = usePreschoolOps()

  const [childId, setChildId] = React.useState(isParent ? PARENT_CHILD_ID : CHILDREN[0].id)
  const [term, setTerm] = React.useState<AssessmentReport["term"]>("Term 1")
  const [domains, setDomains] = React.useState<AssessmentDomain[]>(emptyDomains())
  const [remarks, setRemarks] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<"entry" | "history">(canEdit ? "entry" : "history")
  const [showFramework, setShowFramework] = React.useState(false)

  const selectedChild = childById(childId)

  const reports = parentChildFilter(state.assessments, isParent)
    .filter((r) => r.childId === childId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))

  const setDomainLevel = (key: AssessmentDomain["key"], level: SkillLevel) => {
    setDomains((curr) =>
      curr.map((d) => (d.key === key ? { ...d, level } : d))
    )
  }

  const saveReport = () => {
    if (!remarks.trim()) return
    const report: AssessmentReport = {
      id: `as-${Date.now()}`,
      childId,
      term,
      date: new Date().toISOString().slice(0, 10),
      teacher: user?.name || "Coordinator",
      remarks: remarks.trim(),
      domains: [...domains],
    }
    update((prev) => ({ ...prev, assessments: [report, ...prev.assessments] }))
    addNotification({
      title: "Progress report saved",
      description: `${selectedChild?.name} ${term} checklist is ready for parents.`,
      type: "assignments",
    })
    setRemarks("")
    setDomains(emptyDomains())
    setActiveTab("history")
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading assessments...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="border-b border-border/60 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Learning</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              Developmental Assessments
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Age-band observation checklists based on international early childhood frameworks.
              Not quizzes or certificates — structured developmental milestone tracking.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowFramework((p) => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {showFramework ? "Hide" : "View"} Framework Standards
          </button>
        </div>

        {/* Framework info banner */}
        {showFramework && (
          <div className="mt-4 p-4 rounded-xl border border-primary/15 bg-primary/5 space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-primary" />
              International Framework Alignment
            </p>
            <div className="grid sm:grid-cols-3 gap-3 text-[11px]">
              <div className="bg-card rounded-lg border border-border/60 px-3 py-2">
                <p className="font-bold text-foreground">EYFS (UK)</p>
                <p className="text-muted-foreground">Early Years Foundation Stage — Communication, PSED, Physical Development</p>
              </div>
              <div className="bg-card rounded-lg border border-border/60 px-3 py-2">
                <p className="font-bold text-foreground">NAEYC (USA)</p>
                <p className="text-muted-foreground">National Association for Education of Young Children — Physical & Social standards</p>
              </div>
              <div className="bg-card rounded-lg border border-border/60 px-3 py-2">
                <p className="font-bold text-foreground">EYLF (Australia)</p>
                <p className="text-muted-foreground">Early Years Learning Framework — Outcomes 3 & 4: Wellbeing and Learning</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-2 text-[11px] pt-1">
              {(["emerging", "developing", "secure"] as SkillLevel[]).map((lvl) => {
                const cfg = LEVEL_CONFIG[lvl]
                return (
                  <div key={lvl} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${cfg.bg}`}>
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    <div>
                      <p className={`font-bold ${cfg.color}`}>{cfg.label}</p>
                      <p className="text-muted-foreground">
                        {lvl === "emerging" && "Working towards the milestone"}
                        {lvl === "developing" && "Making expected progress"}
                        {lvl === "secure" && "Exceeding age-band expectation"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Child & Term Selectors ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="h-9 text-xs w-56"
            disabled={isParent}
          >
            {(isParent ? CHILDREN.filter((c) => c.id === PARENT_CHILD_ID) : CHILDREN).map((child) => (
              <option key={child.id} value={child.id}>
                {child.name} — {child.className}
              </option>
            ))}
          </Select>
        </div>

        {selectedChild && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
            <span>{selectedChild.ageBand} age band</span>
            <span className="text-primary/50">·</span>
            <span>{selectedChild.branch.replace("ARKA KIDS ", "")}</span>
          </span>
        )}

        {canEdit && (
          <Select
            value={term}
            onChange={(e) => setTerm(e.target.value as AssessmentReport["term"])}
            className="h-9 text-xs w-36"
          >
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </Select>
        )}
      </div>

      {/* ── Tab Switcher ── */}
      {canEdit && (
        <div className="flex border-b border-border/60">
          {(["entry", "history"] as const).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "entry" ? (
                  <><FileText className="h-3.5 w-3.5" />Enter Observations</>
                ) : (
                  <><BarChart3 className="h-3.5 w-3.5" />Term-wise Reports ({reports.length})</>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Entry Form Tab ── */}
      {(canEdit && activeTab === "entry") && (
        <div className="space-y-5">
          {/* Current child + term context */}
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {selectedChild?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedChild?.name}</p>
                <p className="text-[11px] text-muted-foreground">{selectedChild?.className} · {term} Observation Checklist</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>

          {/* Live radar preview */}
          <Card className="border-border/70 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Live Developmental Profile
              </CardTitle>
              <CardDescription className="text-xs">
                Updates in real-time as you set observation levels below.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid sm:grid-cols-2 gap-4 items-center">
                <AssessmentRadar domains={domains} />
                <div className="space-y-2">
                  <OverallProgress domains={domains} />
                  <div className="space-y-1.5 mt-2">
                    {domains.map((d) => (
                      <div key={d.key} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{DOMAIN_META[d.key].label.split(" ")[0]}</span>
                        <LevelPill level={d.level} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Domain observation selectors */}
          <div className="grid gap-3 sm:grid-cols-2">
            {domains.map((domain) => (
              <DomainSelector
                key={domain.key}
                domain={domain}
                onChange={(level) => setDomainLevel(domain.key, level)}
              />
            ))}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Teacher Remarks for Parents
              <span className="text-destructive ml-0.5">*</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Describe the child's progress, notable milestones, and any areas that need support at home..."
              className="w-full min-h-28 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                {remarks.length}/1000 characters · Visible to parents in the app
              </p>
              {remarks.length > 0 && remarks.length < 50 && (
                <p className="text-[10px] text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Please add more detail for parents
                </p>
              )}
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              size="sm"
              onClick={saveReport}
              disabled={!remarks.trim() || remarks.trim().length < 20}
              icon={Save}
              variant="primary"
            >
              Save Progress Report
            </Button>
            <p className="text-[11px] text-muted-foreground">
              This will be visible to the parent immediately.
            </p>
          </div>
        </div>
      )}

      {/* ── Reports / History Tab ── */}
      {(activeTab === "history" || !canEdit) && (
        <div className="space-y-4">
          {/* Parent-only heading */}
          {isParent && selectedChild && (
            <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Developmental assessments for {selectedChild.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Prepared by your center coordinator · {selectedChild.className} · {selectedChild.branch}
                </p>
              </div>
            </div>
          )}

          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/60 rounded-xl text-center gap-2">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No assessments recorded yet</p>
              <p className="text-xs text-muted-foreground/70">
                {canEdit ? "Use the 'Enter Observations' tab to add the first report." : "Your coordinator will publish reports at the end of each term."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}

          {/* Bottom framework note */}
          <div className="flex items-start gap-2 text-[10px] text-muted-foreground pt-2 border-t border-border/40">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              Reports follow international early childhood standards: EYFS (UK), NAEYC (USA), and EYLF (Australia).
              Assessment levels are observation-based, not test scores.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
