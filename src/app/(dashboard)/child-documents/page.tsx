"use client"

import * as React from "react"
import {
  FolderOpen,
  Search,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  CheckCircle2,
  UploadCloud,
  ShieldCheck,
  FileText,
  User,
  Building2,
  BookOpen,
  Filter,
  X,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { useStore } from "@/store/useStore"
import { formatDate, cn } from "@/lib/utils"
import {
  CHILDREN,
  BRANCHES,
  CLASSES,
  DOCUMENT_TYPES,
  PARENT_CHILD_ID,
  childById,
  usePreschoolOps,
  type ChildRecord,
  type ChildDocument,
} from "@/lib/preschoolOps"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCompletionStats(docs: ChildDocument[]) {
  const verified = docs.filter((d) => d.status === "verified").length
  const uploaded = docs.filter((d) => d.status === "uploaded").length
  const missing = docs.filter((d) => d.status === "missing").length
  return { verified, uploaded, missing, total: docs.length }
}

function statusBadge(status: ChildDocument["status"]) {
  if (status === "verified")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-[11px] font-semibold">
        <CheckCircle2 className="h-3 w-3" /> Verified
      </span>
    )
  if (status === "uploaded")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 px-2.5 py-0.5 text-[11px] font-semibold">
        <Clock className="h-3 w-3" /> Uploaded
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border text-muted-foreground px-2.5 py-0.5 text-[11px] font-medium">
      <AlertCircle className="h-3 w-3" /> Missing
    </span>
  )
}

// ─── Doc type icons ───────────────────────────────────────────────────────────
const DOC_ICONS: Record<string, React.ElementType> = {
  birth_certificate: FileText,
  aadhaar: ShieldCheck,
  parent_id: User,
  child_photo: BookOpen,
  medical_form: FileText,
}

// ─── Student List View ────────────────────────────────────────────────────────
interface StudentListProps {
  isParent: boolean
  allDocs: ChildDocument[]
  onSelect: (child: ChildRecord) => void
}

const PAGE_SIZE = 5

function StudentList({ isParent, allDocs, onSelect }: StudentListProps) {
  const [search, setSearch] = React.useState("")
  const [branchFilter, setBranchFilter] = React.useState("all")
  const [classFilter, setClassFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "complete" | "pending" | "missing">("all")
  const [showFilters, setShowFilters] = React.useState(false)
  const [page, setPage] = React.useState(1)

  // Reset to page 1 whenever any filter / search changes
  React.useEffect(() => { setPage(1) }, [search, branchFilter, classFilter, statusFilter])

  const visibleChildren = isParent
    ? CHILDREN.filter((c) => c.id === PARENT_CHILD_ID)
    : CHILDREN

  const filtered = visibleChildren.filter((child) => {
    if (search && !child.name.toLowerCase().includes(search.toLowerCase())) return false
    if (branchFilter !== "all" && child.branch !== branchFilter) return false
    if (classFilter !== "all" && child.className !== classFilter) return false
    if (statusFilter !== "all") {
      const docs = allDocs.filter((d) => d.childId === child.id)
      const stats = getCompletionStats(docs)
      if (statusFilter === "complete" && !(stats.missing === 0 && stats.uploaded === 0)) return false
      if (statusFilter === "pending" && stats.uploaded === 0) return false
      if (statusFilter === "missing" && stats.missing === 0) return false
    }
    return true
  })

  const activeFilters =
    (branchFilter !== "all" ? 1 : 0) +
    (classFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Records</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
              <FolderOpen className="h-6 w-6 text-primary" />
              Student Documents
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Child-wise checklist: birth certificate, Aadhaar, parent ID, photo, and medical form.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-foreground">{visibleChildren.length}</p>
            <p className="text-xs text-muted-foreground">Children</p>
          </div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        {!isParent && (
          <button
            type="button"
            onClick={() => setShowFilters((p) => !p)}
            className={cn(
              "h-9 px-4 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors",
              showFilters
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilters > 0 && (
              <span className="h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Expanded filter panel */}
      {showFilters && !isParent && (
        <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-border/60 bg-card">
          {/* Branch */}
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-8 text-xs rounded-lg border border-border bg-card px-2 focus:outline-none focus:border-primary"
            >
              <option value="all">All Branches</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b.replace("ARKA KIDS ", "")}</option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-8 text-xs rounded-lg border border-border bg-card px-2 focus:outline-none focus:border-primary"
            >
              <option value="all">All Classes</option>
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Document status */}
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: "all", label: "All" },
                { id: "complete", label: "Complete" },
                { id: "pending", label: "Pending verify" },
                { id: "missing", label: "Has missing" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setStatusFilter(opt.id)}
                className={cn(
                  "h-8 px-3 rounded-lg text-[11px] font-semibold border transition-colors",
                  statusFilter === opt.id
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Clear */}
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => {
                setBranchFilter("all")
                setClassFilter("all")
                setStatusFilter("all")
              }}
              className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      {/* Summary pills */}
      {!isParent && (
        <div className="flex gap-2.5 flex-wrap">
          {(
            [
              {
                label: "All complete",
                count: visibleChildren.filter((c) => {
                  const s = getCompletionStats(allDocs.filter((d) => d.childId === c.id))
                  return s.missing === 0 && s.uploaded === 0
                }).length,
                badgeBg: "bg-emerald-600 text-white",
                color: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
              },
              {
                label: "Pending verify",
                count: visibleChildren.filter((c) => {
                  const s = getCompletionStats(allDocs.filter((d) => d.childId === c.id))
                  return s.missing === 0 && s.uploaded > 0
                }).length,
                badgeBg: "bg-sky-600 text-white",
                color: "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/30",
              },
              {
                label: "Has missing",
                count: visibleChildren.filter((c) => {
                  const s = getCompletionStats(allDocs.filter((d) => d.childId === c.id))
                  return s.missing > 0
                }).length,
                badgeBg: "bg-amber-600 text-white",
                color: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30",
              },
            ] as const
          ).map((pill) => (
            <span
              key={pill.label}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
                pill.color
              )}
            >
              <span className={cn("h-5 min-w-[20px] px-1.5 rounded-md flex items-center justify-center text-[11px] font-extrabold shadow-xs", pill.badgeBg)}>
                {pill.count}
              </span>
              <span className="font-bold">{pill.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* Student list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/60 rounded-xl text-center gap-2">
          <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No students match your filters</p>
          <p className="text-xs text-muted-foreground/70">Adjust the search or filter options above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((child) => {
            const docs = allDocs.filter((d) => d.childId === child.id)
            const stats = getCompletionStats(docs)

            return (
              <button
                key={child.id}
                type="button"
                onClick={() => onSelect(child)}
                className="w-full text-left rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-xs transition-all group overflow-hidden"
              >
                <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 border border-primary/15 group-hover:bg-primary group-hover:text-white transition-colors">
                      {child.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{child.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {child.className} · {child.branch.replace("ARKA KIDS ", "")}
                      </p>
                    </div>
                  </div>

                  {/* Progress + Chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Mini doc status dots */}
                    <div className="hidden sm:flex items-center gap-1">
                      {DOCUMENT_TYPES.map((type) => {
                        const doc = docs.find((d) => d.type === type.key)
                        const status = doc?.status || "missing"
                        return (
                          <span
                            key={type.key}
                            title={`${type.label}: ${status}`}
                            className={cn(
                              "h-2 w-2 rounded-full",
                              status === "verified" ? "bg-emerald-500" :
                              status === "uploaded" ? "bg-sky-500" :
                              "bg-border"
                            )}
                          />
                        )
                      })}
                    </div>

                    {/* Count badge */}
                    <span className="text-[11px] font-semibold text-foreground bg-muted border border-border px-2.5 py-1 rounded-full">
                      {stats.verified + stats.uploaded}/{stats.total} on file
                    </span>

                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-0.5 w-full bg-border/40 overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      stats.missing === 0 && stats.uploaded === 0 ? "bg-emerald-500" : "bg-primary"
                    )}
                    style={{ width: `${((stats.verified + stats.uploaded) / stats.total) * 100}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          {/* Results info */}
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            students
          </p>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page number pills */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isEllipsisBefore = p === 2 && safePage > 4
              const isEllipsisAfter = p === totalPages - 1 && safePage < totalPages - 3
              const isVisible =
                p === 1 ||
                p === totalPages ||
                Math.abs(p - safePage) <= 1

              if (!isVisible) {
                if (isEllipsisBefore || isEllipsisAfter) {
                  return (
                    <span key={`ellipsis-${p}`} className="px-1 text-xs text-muted-foreground select-none">
                      …
                    </span>
                  )
                }
                return null
              }

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={cn(
                    "h-8 min-w-8 px-2 rounded-lg border text-xs font-semibold transition-colors",
                    p === safePage
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  )}
                >
                  {p}
                </button>
              )
            })}

            {/* Next */}
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Document Detail View ─────────────────────────────────────────────────────
interface DocumentDetailProps {
  child: ChildRecord
  docs: ChildDocument[]
  canVerify: boolean
  onBack: () => void
  onUpload: (type: ChildDocument["type"], fileName: string) => void
  onVerify: (id: string) => void
}

function DocumentDetail({ child, docs, canVerify, onBack, onUpload, onVerify }: DocumentDetailProps) {
  const stats = getCompletionStats(docs)

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="border-b border-border/60 pb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Student List
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary text-white font-bold text-base flex items-center justify-center shrink-0">
              {child.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{child.name}</h1>
              <p className="text-xs text-muted-foreground">
                {child.className} · {child.branch} · Parent: {child.parentName}
              </p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex gap-3 shrink-0">
            <div className="text-center px-3.5 py-2 rounded-xl bg-card border border-border">
              <p className="text-lg font-bold text-emerald-600">{stats.verified}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Verified</p>
            </div>
            <div className="text-center px-3.5 py-2 rounded-xl bg-card border border-border">
              <p className="text-lg font-bold text-sky-600">{stats.uploaded}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Uploaded</p>
            </div>
            <div className="text-center px-3.5 py-2 rounded-xl bg-card border border-border">
              <p className="text-lg font-bold text-muted-foreground">{stats.missing}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Missing</p>
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Document completeness</span>
            <span className="font-semibold text-foreground">{stats.verified + stats.uploaded}/{stats.total} on file</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${((stats.verified + stats.uploaded) / stats.total) * 100}%` }}
            />
          </div>
          {stats.missing > 0 && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 text-amber-500" />
              Admission cannot be treated as complete until all required papers are verified.
            </p>
          )}
        </div>
      </div>

      {/* Document cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {DOCUMENT_TYPES.map((type) => {
          const doc = docs.find((d) => d.type === type.key)
          const status = doc?.status || "missing"
          const Icon = DOC_ICONS[type.key] || FileText

          return (
            <div
              key={type.key}
              className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30"
            >
              {/* Card header stripe */}
              <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{type.label}</span>
                </div>
                {statusBadge(status)}
              </div>

              {/* Card body */}
              <div className="px-4 py-3.5 space-y-3">
                {doc?.fileName ? (
                  <div>
                    <p className="text-xs font-medium text-foreground truncate">{doc.fileName}</p>
                    {doc.uploadedAt && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Received {formatDate(doc.uploadedAt)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No file uploaded yet</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {/* Upload */}
                  <label className="inline-flex flex-1">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onUpload(type.key, file.name)
                        e.target.value = ""
                      }}
                    />
                    <span className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg border border-border px-3 text-xs font-medium cursor-pointer hover:bg-muted/60 transition-colors">
                      <UploadCloud className="h-3.5 w-3.5" />
                      {doc?.fileName ? "Replace" : "Upload"}
                    </span>
                  </label>

                  {/* Verify */}
                  {canVerify && status === "uploaded" && doc && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={ShieldCheck}
                      onClick={() => onVerify(doc.id)}
                      className="h-8 text-xs flex-1"
                    >
                      Verify
                    </Button>
                  )}

                  {/* Verified tick */}
                  {status === "verified" && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ChildDocumentsPage() {
  const { user, addNotification } = useStore()
  const isParent = user?.role === "student"
  const canVerify =
    user?.role === "owner" ||
    user?.role === "super_admin" ||
    user?.role === "trainer"

  const { state, update, ready } = usePreschoolOps()
  const [selectedChild, setSelectedChild] = React.useState<ChildRecord | null>(null)

  // Auto-select for parent
  React.useEffect(() => {
    if (isParent) {
      const child = childById(PARENT_CHILD_ID)
      if (child) setSelectedChild(child)
    }
  }, [isParent])

  const markUploaded = (type: ChildDocument["type"], fileName: string) => {
    if (!selectedChild) return
    update((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) =>
        doc.childId === selectedChild.id && doc.type === type
          ? { ...doc, status: "uploaded", fileName, uploadedAt: new Date().toISOString() }
          : doc
      ),
    }))
    addNotification({
      title: "Document received",
      description: `${fileName} added to ${selectedChild.name}'s file.`,
      type: "system",
    })
  }

  const verify = (id: string) => {
    update((prev) => ({
      ...prev,
      documents: prev.documents.map((doc) =>
        doc.id === id ? { ...doc, status: "verified" } : doc
      ),
    }))
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading documents...
        </div>
      </div>
    )
  }

  // Detail view
  if (selectedChild) {
    const docs = state.documents.filter((d) => d.childId === selectedChild.id)
    return (
      <DocumentDetail
        child={selectedChild}
        docs={docs}
        canVerify={canVerify}
        onBack={() => !isParent && setSelectedChild(null)}
        onUpload={markUploaded}
        onVerify={verify}
      />
    )
  }

  // List view
  return (
    <StudentList
      isParent={isParent}
      allDocs={state.documents}
      onSelect={setSelectedChild}
    />
  )
}
