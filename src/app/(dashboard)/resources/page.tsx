"use client"

import * as React from "react"
import {
  Library, FileText, PlayCircle, Upload, Plus, Search, Trash2, ExternalLink, Download, Link2, X, Loader2, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { Badge } from "@/components/ui/Badge"
import { useStore } from "@/store/useStore"
import { api } from "@/lib/api"
import { getYoutubeEmbedUrl } from "@/lib/lms"
import { GRADES } from "@/lib/preschoolBatch"
import { cn } from "@/lib/utils"

type ResourceKind = "material" | "video"

interface Resource {
  _id: string
  title: string
  description?: string
  kind: ResourceKind
  category?: string
  program?: string
  url: string
  fileName?: string
  format?: string
  size?: number
  audience?: string[]
  tenantId: string
  centerName?: string
  uploadedByName?: string
  createdAt?: string
}

const CATEGORIES = [
  "Teacher Training",
  "Curriculum & Lesson Plans",
  "Abacus Methodology",
  "Classroom Activities",
  "Parent Orientation",
  "Centre Operations / SOP",
  "Marketing & Branding",
  "Other",
]

const TABS: { id: "all" | ResourceKind; label: string; icon: typeof Library }[] = [
  { id: "all", label: "All Resources", icon: Library },
  { id: "material", label: "Training Materials", icon: FileText },
  { id: "video", label: "Training Videos", icon: PlayCircle },
]

function formatSize(bytes?: number) {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageResource(r?: Resource | null): boolean {
  if (!r) return false
  const format = (r.format || "").toLowerCase()
  const url = (r.url || "").toLowerCase()
  const fileName = (r.fileName || "").toLowerCase()
  return (
    ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "avif"].includes(format) ||
    /\.(png|jpe?g|webp|gif|svg|bmp|avif)(\?.*)?$/i.test(url) ||
    /\.(png|jpe?g|webp|gif|svg|bmp|avif)$/i.test(fileName)
  )
}

export default function ResourcesPage() {
  const { user, addNotification } = useStore()
  // Only Super Admin (Head Office) has upload & management permissions; other roles have view-only access
  const canManage = user?.role === "super_admin"

  const [resources, setResources] = React.useState<Resource[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState<"all" | ResourceKind>("all")
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [viewing, setViewing] = React.useState<Resource | null>(null)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Resource | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getResources()
      setResources(Array.isArray(data) ? data : [])
    } catch (err: any) {
      addNotification({ title: "Could not load resources", description: err.message || "Try again", type: "system" })
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  React.useEffect(() => { load() }, [load])

  const filtered = resources.filter((r) => {
    if (tab !== "all" && r.kind !== tab) return false
    if (category && r.category !== category) return false
    if (query) {
      const hay = `${r.title} ${r.description || ""} ${r.category || ""} ${r.program || ""}`.toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  })

  const counts = {
    all: resources.length,
    material: resources.filter((r) => r.kind === "material").length,
    video: resources.filter((r) => r.kind === "video").length,
  }

  // Only super admin can delete resources; franchise owners/trainers have view-only access
  const canDelete = (_r: Resource) => user?.role === "super_admin"

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.deleteResource(deleteTarget._id)
      setResources((prev) => prev.filter((r) => r._id !== deleteTarget._id))
      addNotification({ title: "Resource deleted", description: deleteTarget.title, type: "system" })
    } catch (err: any) {
      addNotification({ title: "Delete failed", description: err.message, type: "system" })
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <Library className="h-6 w-6 text-primary" />
            Resources & Training
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Training materials, videos and learning resources for franchise owners, coordinators and teachers.
          </p>
        </div>
        {canManage && (
          <Button icon={Plus} onClick={() => setUploadOpen(true)} id="add-resource-btn">
            Add Resource
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`resources-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
              tab === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            <span className={cn("rounded-full px-1.5 text-[10px]", tab === t.id ? "bg-white/20" : "bg-muted")}>
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full h-10 pl-9 pr-8 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors shadow-2xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category */}
        <div className="relative w-full sm:w-64 shrink-0">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-10 text-xs rounded-lg border border-border bg-card pl-3 pr-9 appearance-none cursor-pointer text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors shadow-2xs hover:border-primary/50"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground py-16 text-center animate-pulse">Loading resources...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 py-16 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Library className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-base font-bold">No resources yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {canManage ? "Upload training PDFs, slide decks or add training videos to get started." : "Your administrator hasn't shared any resources yet."}
          </p>
          {canManage && (
            <Button className="mt-5" icon={Upload} onClick={() => setUploadOpen(true)}>Upload first resource</Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const isImg = isImageResource(r)
            const embed = r.kind === "video" ? getYoutubeEmbedUrl(r.url) : null
            const thumb = embed
              ? `https://img.youtube.com/vi/${embed.split("/").pop()}/hqdefault.jpg`
              : isImg
                ? r.url
                : null
            return (
              <div key={r._id} className="group rounded-2xl border border-border bg-card overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <button
                  type="button"
                  onClick={() => setViewing(r)}
                  className="relative h-36 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center overflow-hidden bg-muted/20"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={r.title}
                      className={cn(
                        "absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300",
                        isImg ? "opacity-100" : "opacity-90"
                      )}
                    />
                  ) : null}
                  {r.kind === "video" ? (
                    <PlayCircle
                      className={cn(
                        "relative h-12 w-12 text-white drop-shadow-lg",
                        thumb && "bg-black/40 rounded-full p-1"
                      )}
                      style={!thumb ? { color: "var(--color-primary, #8B0000)" } : undefined}
                    />
                  ) : !thumb ? (
                    <FileText className="relative h-12 w-12 text-primary/70" />
                  ) : null}
                  <Badge variant={r.kind === "video" ? "warning" : "secondary"} className="absolute top-3 left-3 text-[9px] uppercase tracking-wider backdrop-blur-xs bg-background/80">
                    {r.kind === "video" ? "Video" : (r.format || "Material").toUpperCase()}
                  </Badge>
                  {r.tenantId === "global" ? (
                    <Badge variant="success" className="absolute top-3 right-3 text-[9px] uppercase tracking-wider bg-emerald-600 text-white border-none shadow-xs">
                      All Centres
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="absolute top-3 right-3 text-[9px] bg-background/90 backdrop-blur-xs border-primary/30 text-primary font-semibold truncate max-w-[140px]">
                      {r.centerName || r.tenantId}
                    </Badge>
                  )}
                </button>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-primary truncate">
                      {r.tenantId === "global" ? "🌐 Global (All Centres)" : `🏢 ${r.centerName || r.tenantId}`}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground line-clamp-2">{r.title}</h3>
                  {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {r.category && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{r.category}</span>}
                    {r.program && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{r.program}</span>}
                    {r.size ? <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{formatSize(r.size)}</span> : null}
                  </div>
                  {r.audience && r.audience.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                      <span className="text-muted-foreground font-semibold">For:</span>
                      {r.audience.map((aud) => {
                        const labels: Record<string, string> = {
                          owner: "Owners",
                          coordinator: "Coordinators",
                          trainer: "Teachers",
                          bde: "Counsellors",
                        }
                        return (
                          <span key={aud} className="rounded-md bg-secondary text-secondary-foreground px-1.5 py-0.5 font-medium">
                            {labels[aud] || aud}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-auto pt-2">
                    {r.uploadedByName ? `By ${r.uploadedByName}` : ""}{r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString("en-IN")}` : ""}
                  </p>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" icon={r.kind === "video" ? PlayCircle : ExternalLink} onClick={() => setViewing(r)}>
                    {r.kind === "video" ? "Watch" : "Open"}
                  </Button>
                  {r.kind === "material" && (
                    <a href={r.url} target="_blank" rel="noreferrer" download className="inline-flex h-8 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted" title="Download">
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {canDelete(r) && (
                    <button onClick={() => setDeleteTarget(r)} className="inline-flex h-8 w-9 items-center justify-center rounded-lg border border-border text-destructive hover:bg-destructive/10" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ResourceViewer resource={viewing} onClose={() => setViewing(null)} />

      {canManage && (
        <UploadResourceDialog
          open={uploadOpen}
          isSuperAdmin={user?.role === "super_admin"}
          onClose={() => setUploadOpen(false)}
          onCreated={(r) => {
            setResources((prev) => [r, ...prev])
            addNotification({ title: "Resource added", description: r.title, type: "system" })
          }}
        />
      )}

      <Dialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete resource?" description={deleteTarget?.title} className="max-w-sm">
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={confirmDelete}>Delete</Button>
        </div>
      </Dialog>
    </div>
  )
}

function ResourceViewer({ resource, onClose }: { resource: Resource | null; onClose: () => void }) {
  if (!resource) return null
  const embed = resource.kind === "video" ? getYoutubeEmbedUrl(resource.url) : null
  const isPdf = (resource.format || resource.url).toLowerCase().includes("pdf")
  const isDirectVideo = resource.kind === "video" && !embed
  const isImg = isImageResource(resource)

  return (
    <Dialog isOpen onClose={onClose} title={resource.title} description={resource.category} className="max-w-4xl">
      <div className="space-y-3">
        <div className="rounded-xl overflow-hidden border border-border bg-black/5 aspect-video flex items-center justify-center">
          {embed ? (
            <iframe src={embed} className="w-full h-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen title={resource.title} />
          ) : isDirectVideo ? (
            <video src={resource.url} controls className="w-full h-full bg-black" />
          ) : isPdf ? (
            <iframe src={resource.url} className="w-full h-full bg-white" title={resource.title} />
          ) : isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resource.url} alt={resource.title} className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <FileText className="h-10 w-10 text-primary/60" />
              Preview not available for this file type.
            </div>
          )}
        </div>
        {resource.description && <p className="text-sm text-muted-foreground">{resource.description}</p>}
        <div className="flex justify-end">
          <a href={resource.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
            Open in new tab <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </Dialog>
  )
}

function UploadResourceDialog({
  open, isSuperAdmin, onClose, onCreated,
}: {
  open: boolean
  isSuperAdmin: boolean
  onClose: () => void
  onCreated: (r: Resource) => void
}) {
  const [kind, setKind] = React.useState<ResourceKind>("material")
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [category, setCategory] = React.useState(CATEGORIES[0])
  const [program, setProgram] = React.useState("")
  const [source, setSource] = React.useState<"file" | "link">("file")
  const [file, setFile] = React.useState<File | null>(null)
  const [link, setLink] = React.useState("")
  const [audience, setAudience] = React.useState<string[]>(["owner", "coordinator", "trainer"])
  const [centers, setCenters] = React.useState<{ _id: string; name: string; tenantName?: string; location?: string }[]>([])
  const [targetTenant, setTargetTenant] = React.useState("global")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (open) {
      api.getCenters()
        .then((data) => {
          if (Array.isArray(data)) setCenters(data)
        })
        .catch(() => {})
    }
  }, [open])

  const reset = () => {
    setKind("material"); setTitle(""); setDescription(""); setCategory(CATEGORIES[0]); setProgram("")
    setSource("file"); setFile(null); setLink(""); setAudience(["owner", "coordinator", "trainer"])
    setTargetTenant("global"); setError("")
  }

  const close = () => { reset(); onClose() }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!title.trim()) return setError("Title is required.")
    if (source === "file" && !file) return setError("Choose a file to upload.")
    if (source === "link" && !/^https?:\/\//i.test(link.trim())) return setError("Enter a valid URL starting with http(s)://")
    if (file && file.size > 100 * 1024 * 1024) return setError("File must be 100 MB or smaller.")
    if (audience.length === 0) return setError("Select at least one role to make this resource visible to.")

    setSaving(true)
    try {
      let url = link.trim()
      let meta: { fileName?: string; format?: string; size?: number } = {}
      if (source === "file" && file) {
        const uploaded = await api.uploadFile(file, "resources")
        if (!uploaded?.url) throw new Error("Upload returned no URL")
        url = uploaded.url
        meta = { fileName: file.name, format: uploaded.format || file.name.split(".").pop(), size: uploaded.size || file.size }
      }
      const selectedCenter = centers.find((c) => (c.tenantName || c._id) === targetTenant)
      const created = await api.createResource({
        title: title.trim(),
        description: description.trim(),
        kind,
        category,
        program: program || undefined,
        url,
        audience,
        tenantId: targetTenant || "global",
        centerName: targetTenant === "global" ? "All Centres" : (selectedCenter?.name || targetTenant),
        ...meta,
      })
      onCreated(created)
      close()
    } catch (err: any) {
      setError(err.message || "Failed to save resource")
    } finally {
      setSaving(false)
    }
  }

  const toggleAudience = (role: string) =>
    setAudience((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))

  return (
    <Dialog
      isOpen={open}
      onClose={close}
      title="Add Resource"
      description="Publish training guides, curriculum, SOPs or videos to franchise centres."
      className="max-w-lg"
    >
      <form onSubmit={submit} className="space-y-4 pt-1">
        <div className="grid grid-cols-2 gap-2">
          {(["material", "video"] as ResourceKind[]).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => { setKind(k); if (k === "video") setSource("link") }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-colors",
                kind === k ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {k === "material" ? <FileText className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              {k === "material" ? "Training Material" : "Training Video"}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Title *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Abacus Level 1 – Teacher Handbook" className="h-10 text-xs" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Assign to Franchise / Centre *</label>
          <Select
            value={targetTenant}
            onChange={(e) => setTargetTenant(e.target.value)}
            className="h-10 text-xs font-medium"
          >
            <option value="global">🌐 All Franchise Centres (Global HQ)</option>
            {centers.map((c) => (
              <option key={c._id || c.tenantName} value={c.tenantName || c._id}>
                🏢 {c.name} {c.location ? `· ${c.location}` : ""}
              </option>
            ))}
          </Select>
          <p className="text-[11px] text-muted-foreground">
            {targetTenant === "global"
              ? "Visible to all franchise branches across the network."
              : "Visible only to staff, teachers and coordinators belonging to this specific centre."}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs focus:outline-none focus:border-primary"
            placeholder="Brief description or instructions for teachers / coordinators..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 text-xs">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Program" value={program} onChange={(e) => setProgram(e.target.value)} className="h-10 text-xs">
            <option value="">All programs</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSource("file")}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border", source === "file" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground")}
            >
              <Upload className="h-3 w-3" /> Upload file
            </button>
            <button
              type="button"
              onClick={() => setSource("link")}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border", source === "link" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground")}
            >
              <Link2 className="h-3 w-3" /> {kind === "video" ? "YouTube / video link" : "External link"}
            </button>
          </div>
          {source === "file" ? (
            <label className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-4 cursor-pointer hover:border-primary/40">
              <span className="text-xs text-muted-foreground truncate">
                {file ? `${file.name} · ${formatSize(file.size)}` : kind === "video" ? "MP4 / MOV up to 100 MB" : "PDF, PPT, DOC, images up to 100 MB"}
              </span>
              {file ? (
                <button type="button" onClick={(e) => { e.preventDefault(); setFile(null) }} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
              ) : (
                <span className="text-xs font-semibold text-primary">Browse</span>
              )}
              <input
                type="file"
                className="hidden"
                accept={kind === "video" ? "video/*" : ".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,image/*"}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          ) : (
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder={kind === "video" ? "https://youtube.com/watch?v=..." : "https://..."} className="h-10 text-xs" />
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Visible to Roles</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["owner", "Franchise Owners"],
              ["coordinator", "Centre Coordinators"],
              ["trainer", "Teachers & Trainers"],
              ["bde", "Admissions & Counsellors"],
            ].map(([role, label]) => (
              <label key={role} className="inline-flex items-center gap-2 p-2 rounded-lg border border-border bg-card/60 text-xs cursor-pointer hover:border-primary/40">
                <input
                  type="checkbox"
                  checked={audience.includes(role)}
                  onChange={() => toggleAudience(role)}
                  className="rounded border-border text-primary focus:ring-primary accent-[#8B0000]"
                />
                <span className="font-medium text-foreground">{label}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Only users with the selected roles can see and download this resource.
          </p>
        </div>

        {error && <p className="text-xs text-destructive font-medium">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={close}>Cancel</Button>
          <Button type="submit" size="sm" disabled={saving} icon={saving ? Loader2 : Upload}>
            {saving ? "Saving…" : "Save Resource"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
