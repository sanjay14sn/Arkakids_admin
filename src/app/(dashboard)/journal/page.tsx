"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Camera,
  Plus,
  Play,
  Loader2,
  X,
  Calendar,
  Filter,
  Search,
  Image as ImageIcon,
  Edit3,
  Trash2,
  Building2,
  CalendarDays,
  FileImage,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import {
  BRANCHES,
  CLASSES,
  PARENT_CHILD_ID,
  childById,
  parentChildFilter,
  usePreschoolOps,
  type JournalEntry,
  type JournalMedia,
} from "@/lib/preschoolOps"

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateHeader(dateStr: string) {
  if (!dateStr) return ""
  const date = new Date(dateStr + "T00:00:00")
  if (isNaN(date.getTime())) return dateStr

  const todayStr = getTodayStr()
  const isToday = dateStr === todayStr

  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return isToday ? `Today (${formatted})` : formatted
}

function JournalMediaTile({
  item,
  onClick,
}: {
  item: JournalMedia
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50"
    >
      {item.src ? (
        item.kind === "video" ? (
          <video
            src={item.src}
            preload="metadata"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <img
            src={item.src}
            alt={item.label}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${item.tone}`} />
      )}

      {item.kind === "video" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-md group-hover:scale-110 transition-transform">
            <Play className="h-5 w-5 text-primary fill-primary ml-0.5" />
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-2">
        <p className="text-xs font-semibold text-white leading-tight truncate">{item.label}</p>
        <p className="text-[10px] uppercase tracking-wider text-white/75 mt-0.5">
          {item.kind === "video" ? "Video" : "Photo"}
        </p>
      </div>
    </div>
  )
}

const TONES = [
  "from-amber-200 to-orange-300",
  "from-lime-200 to-emerald-300",
  "from-sky-200 to-indigo-300",
  "from-violet-200 to-fuchsia-300",
  "from-rose-200 to-pink-300",
]

export default function DailyJournalPage() {
  const router = useRouter()
  const { user, addNotification, activeTenant } = useStore()
  const isParent = user?.role === "student"
  const canManage = !isParent

  const isMultiBranch = user?.role === "super_admin" || user?.role === "owner"
  const myBranchName = String(activeTenant?.name ?? user?.tenantId ?? "").trim()

  const { state, update, ready } = usePreschoolOps()

  // Real Database Data State
  const [branchesList, setBranchesList] = React.useState<string[]>([...BRANCHES])
  const [classesList, setClassesList] = React.useState<string[]>([...CLASSES])

  const [open, setOpen] = React.useState(false)
  const [editingEntry, setEditingEntry] = React.useState<JournalEntry | null>(null)

  const [className, setClassName] = React.useState<string>("Nursery A")
  const [branch, setBranch] = React.useState<string>(BRANCHES[0])
  const [note, setNote] = React.useState("")
  const [tags, setTags] = React.useState("circle time, snack, outdoor play")
  const [mediaKind, setMediaKind] = React.useState<"photo" | "video">("photo")
  const [mediaLabel, setMediaLabel] = React.useState("Classroom moment")

  // Date Filtering State: "today" | "calendar" | "all"
  const [dateMode, setDateMode] = React.useState<"today" | "calendar" | "all">("today")
  const [selectedDate, setSelectedDate] = React.useState<string>(getTodayStr())

  // Filters
  const [filterBranch, setFilterBranch] = React.useState<string>("all")
  const [filterClass, setFilterClass] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  // File upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string>("")
  const [uploading, setUploading] = React.useState(false)

  // Lightbox modal state
  const [selectedMedia, setSelectedMedia] = React.useState<JournalMedia | null>(null)

  const parentChild = childById(PARENT_CHILD_ID)

  // Load Real Database Centers (Franchises) and Classes (Programs/Batches)
  React.useEffect(() => {
    const fetchRealData = async () => {
      try {
        const [centersData, coursesData, batchesData, dbJournals] = await Promise.all([
          api.getCenters().catch(() => []),
          api.getCourses().catch(() => []),
          api.getBatches().catch(() => []),
          api.getJournals().catch(() => []),
        ])

        // Populate Real Franchises / Branches
        if (Array.isArray(centersData) && centersData.length > 0) {
          const names = centersData
            .map((c: any) => (typeof c === "string" ? c : c?.name || c?.tenantName || c?.location || ""))
            .filter(Boolean) as string[]
          let finalBranches = Array.from(new Set(names))
          
          if (!isMultiBranch && myBranchName) {
            const matched = finalBranches.filter(n => String(n || "").trim().toLowerCase() === myBranchName.toLowerCase())
            finalBranches = matched.length > 0 ? matched : [myBranchName]
          }

          setBranchesList(finalBranches)
          setBranch((prev) => (finalBranches.includes(prev) ? prev : finalBranches[0]))
        } else if (!isMultiBranch && myBranchName) {
          setBranchesList([myBranchName])
          setBranch(myBranchName)
        }

        // Populate Real Classes / Programs
        const namesClasses: string[] = []
        if (Array.isArray(batchesData)) {
          batchesData.forEach((b: any) => {
            const batchName = `${b.courseName || "Batch"} — ${b.section || b.code || "A"}`
            if (!namesClasses.includes(batchName)) {
              namesClasses.push(batchName)
            }
          })
        }

        if (namesClasses.length > 0) {
          const mergedClasses = Array.from(new Set([...namesClasses]))
          setClassesList(mergedClasses)
          setClassName((prev) => (mergedClasses.includes(prev) ? prev : mergedClasses[0]))
        } else {
          setClassesList([])
          setClassName("")
        }

        // Merge DB Journal entries into state if present
        if (Array.isArray(dbJournals) && dbJournals.length > 0) {
          update((prev) => {
            const existingIds = new Set(prev.journals.map((j) => j.id))
            const newFromDb = dbJournals.filter((j: any) => !existingIds.has(j.id || j._id))
            if (newFromDb.length === 0) return prev
            return {
              ...prev,
              journals: [
                ...newFromDb.map((j: any) => ({
                  ...j,
                  id: j.id || j._id,
                  tags: Array.isArray(j.tags) ? j.tags : [],
                  media: Array.isArray(j.media) ? j.media : [],
                })),
                ...prev.journals,
              ],
            }
          })
        }
      } catch (err) {
        console.error("Failed to load real center and class data:", err)
      }
    }

    void fetchRealData()
  }, [update, isMultiBranch, myBranchName])

  // Reset & Open create modal
  const handleOpenCreate = () => {
    setEditingEntry(null)
    setClassName(classesList[0] || "Nursery A")
    setBranch(branchesList[0] || BRANCHES[0])
    setNote("")
    setTags("circle time, snack, outdoor play")
    setMediaKind("photo")
    setMediaLabel("Classroom moment")
    setSelectedFile(null)
    setPreviewUrl("")
    setOpen(true)
  }

  // Populate & Open edit modal
  const handleOpenEdit = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setClassName(entry.className || "")
    setBranch(entry.branch || "")
    setNote(entry.note || "")
    setTags(Array.isArray(entry.tags) ? entry.tags.join(", ") : "")
    const firstMedia = (entry.media || [])[0]
    setMediaKind(firstMedia?.kind || "photo")
    setMediaLabel(firstMedia?.label || "Classroom moment")
    setPreviewUrl(firstMedia?.src || "")
    setSelectedFile(null)
    setOpen(true)
  }

  // Delete journal entry
  const handleDelete = async (entry: JournalEntry) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the journal post for ${entry.className || "this class"} (${formatDateHeader(entry.date)})?`
      )
    ) {
      return
    }

    try {
      if (entry.id && !entry.id.startsWith("j-")) {
        await api.deleteJournal(entry.id).catch(() => null)
      }

      update((prev) => ({
        ...prev,
        journals: prev.journals.filter((j) => j.id !== entry.id),
      }))

      addNotification({
        title: "Journal update deleted",
        description: `${entry.className || "Class"} post has been removed.`,
        type: "system",
      })
    } catch (err: any) {
      console.error("Delete failed:", err)
    }
  }

  // Filter entries based on role, date, branch, class, and search query
  const allEntries = parentChildFilter(state.journals, isParent)
  const filteredEntries = allEntries.filter((entry) => {
    if (!entry) return false

    // Date filter
    if (dateMode === "today") {
      if (entry.date !== getTodayStr()) return false
    } else if (dateMode === "calendar") {
      if (entry.date !== selectedDate) return false
    }

    // Branch / Franchise filter
    if (filterBranch !== "all" && entry.branch !== filterBranch) return false
    // Class filter
    if (filterClass !== "all" && entry.className !== filterClass) return false

    // Search query
    if (searchQuery && String(searchQuery).trim()) {
      const q = String(searchQuery).toLowerCase().trim()
      const matchNote = String(entry.note || "").toLowerCase().includes(q)
      const matchClass = String(entry.className || "").toLowerCase().includes(q)
      const matchBranch = String(entry.branch || "").toLowerCase().includes(q)
      const matchTag = Array.isArray(entry.tags) && entry.tags.some((t) => String(t || "").toLowerCase().includes(q))
      if (!matchNote && !matchClass && !matchBranch && !matchTag) return false
    }
    return true
  })

  // Group entries date-wise (newest date first)
  const entriesByDate = React.useMemo(() => {
    const sorted = [...filteredEntries].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    const groups: Record<string, JournalEntry[]> = {}

    for (const entry of sorted) {
      const dKey = entry.date || getTodayStr()
      if (!groups[dKey]) {
        groups[dKey] = []
      }
      groups[dKey].push(entry)
    }
    return groups
  }, [filteredEntries])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    const isVid = file.type.startsWith("video/")
    setMediaKind(isVid ? "video" : "photo")
    setPreviewUrl(URL.createObjectURL(file))

    if (mediaLabel === "Classroom moment" || !mediaLabel) {
      const cleanName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")
      setMediaLabel(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
    }
  }

  const publish = async () => {
    if (!note || !String(note).trim()) return

    setUploading(true)
    let uploadedMediaUrl = ""

    try {
      if (selectedFile) {
        // Silently upload to Cloudinary
        const uploadResult = await api.uploadFile(selectedFile, "journal")
        uploadedMediaUrl = uploadResult.secure_url || uploadResult.url || ""
      }

      const mediaItem: JournalMedia = {
        id: editingEntry?.media[0]?.id || `m-${Date.now()}`,
        kind: mediaKind,
        label: String(mediaLabel || "").trim() || (mediaKind === "video" ? "Class video" : "Class photo"),
        tone: editingEntry?.media[0]?.tone || TONES[Math.floor(Math.random() * TONES.length)],
        src: uploadedMediaUrl || previewUrl || editingEntry?.media[0]?.src || undefined,
      }

      if (editingEntry) {
        // Update existing entry
        const updatedEntry: JournalEntry = {
          ...editingEntry,
          className,
          branch,
          note: String(note || "").trim(),
          tags: String(tags || "").split(",").map((t) => String(t || "").trim()).filter(Boolean),
          media: [mediaItem],
        }

        // Sync with API
        if (editingEntry.id && !editingEntry.id.startsWith("j-")) {
          await api.updateJournal(editingEntry.id, updatedEntry).catch(() => null)
        }

        update((prev) => ({
          ...prev,
          journals: prev.journals.map((j) => (j.id === editingEntry.id ? updatedEntry : j)),
        }))

        addNotification({
          title: "Daily journal updated",
          description: `${className} update saved successfully.`,
          type: "system",
        })
      } else {
        // Create new entry for today's date
        const newEntry: JournalEntry = {
          id: `j-${Date.now()}`,
          date: getTodayStr(),
          className,
          branch,
          author: user?.name || "Classroom Coordinator",
          note: String(note || "").trim(),
          tags: String(tags || "").split(",").map((t) => String(t || "").trim()).filter(Boolean),
          media: [mediaItem],
        }

        // Sync to backend DB
        await api.createJournal(newEntry).catch(() => null)

        update((prev) => ({ ...prev, journals: [newEntry, ...prev.journals] }))

        addNotification({
          title: "Daily journal posted",
          description: `${className} update published for today.`,
          type: "system",
        })
      }

      // Reset form
      setNote("")
      setSelectedFile(null)
      setPreviewUrl("")
      setMediaLabel("Classroom moment")
      setEditingEntry(null)
      setOpen(false)
    } catch (error: any) {
      console.error("Journal media upload failed:", error)
      addNotification({
        title: "Upload Failed",
        description: error?.message || "Could not upload media. Please try again.",
        type: "system",
      })
    } finally {
      setUploading(false)
    }
  }

  if (!ready) {
    return <p className="text-xs text-muted-foreground py-16 text-center">Loading classroom journal...</p>
  }

  const dateKeys = Object.keys(entriesByDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Classroom</p>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 mt-1">
            <Camera className="h-6 w-6 text-primary" />
            Daily Journal
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {isParent
              ? `Photos, videos, and notes from ${parentChild?.name}'s class.`
              : "Share circle time, snack, outdoor play, and learning moments with parents."}
          </p>
        </div>
        {canManage && (
          <Button size="sm" icon={Plus} onClick={handleOpenCreate}>
            New class update
          </Button>
        )}
      </div>

      {/* Date Toggle & Filter Bar */}
      <div className="space-y-3 bg-card p-4 rounded-xl border border-border shadow-xs">
        {/* Top Row: Date Mode Switcher & Calendar Picker */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setDateMode("today")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                dateMode === "today"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateMode("calendar")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                dateMode === "calendar"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar Select
            </button>
            <button
              type="button"
              onClick={() => setDateMode("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                dateMode === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Dates
            </button>
          </div>

          {/* Calendar Picker when dateMode is calendar */}
          {dateMode === "calendar" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Pick Date:</span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 text-xs bg-muted/30 w-40"
              />
            </div>
          )}
        </div>

        {/* Bottom Row: Search, Real Franchises & Real Classes Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground ml-1" />
            <Input
              placeholder="Search notes, tags, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs border-0 focus-visible:ring-0 bg-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border lg:pl-3">
            {/* Real Franchise / Branch Filter */}
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Franchise:</span>
              <Select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="h-8 text-xs bg-muted/40 min-w-[170px]"
              >
                {isMultiBranch && <option value="all">All Franchises</option>}
                {branchesList.map((b) => (
                  <option key={`branch-filter-${b}`} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </div>

            {/* Real Class Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Class Batches:</span>
              <Select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="h-8 text-xs bg-muted/40 w-36"
              >
                <option value="all">All Batches</option>
                {classesList.map((cls) => (
                  <option key={`class-filter-${cls}`} value={cls}>
                    {cls}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Date-wise Journal Feed or Placeholder Empty State */}
      {dateKeys.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80">
          <CardContent className="py-14 px-6 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <FileImage className="h-8 w-8" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-bold text-foreground">
                {dateMode === "today"
                  ? "No Daily Journal updates for today yet"
                  : dateMode === "calendar"
                  ? `No updates posted for ${formatDateHeader(selectedDate)}`
                  : "No journal updates found"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {dateMode === "today"
                  ? "Circle time, snack, outdoor play, and learning moments for today have not been shared yet."
                  : "Try picking another date using the calendar selector, or post a new class update."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {canManage && (
                <Button size="sm" icon={Plus} onClick={handleOpenCreate}>
                  Post Today's Class Update
                </Button>
              )}
              {dateMode !== "all" && (
                <Button variant="outline" size="sm" onClick={() => setDateMode("all")}>
                  View All Dates
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {dateKeys.map((dateStr) => {
            const dateEntries = entriesByDate[dateStr]
            return (
              <div key={dateStr} className="space-y-4">
                {/* Date Group Header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary border border-primary/20 shadow-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDateHeader(dateStr)}</span>
                  </div>
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {dateEntries.length} {dateEntries.length === 1 ? "update" : "updates"}
                  </span>
                </div>

                {/* Journal Cards for this Date — 3-up photo grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dateEntries.map((entry) => {
                    const media = entry.media || []
                    const mediaCols = media.length >= 3 ? "grid-cols-3" : media.length === 2 ? "grid-cols-2" : "grid-cols-1"
                    return (
                    <Card key={entry.id} className="overflow-hidden border-border/80 shadow-xs hover:shadow-md transition-shadow flex flex-col">
                      <div className={cn("grid gap-0.5 bg-muted", mediaCols)}>
                        {media.length === 0 ? (
                          <div className="aspect-square flex items-center justify-center text-muted-foreground bg-muted">
                            <ImageIcon className="h-8 w-8 opacity-40" />
                          </div>
                        ) : (
                          media.map((item) => (
                            <JournalMediaTile key={item.id} item={item} onClick={() => setSelectedMedia(item)} />
                          ))
                        )}
                      </div>
                      <CardContent className="p-3.5 space-y-2 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">
                              {entry.className}
                              {entry.branch ? (
                                <span className="text-xs font-normal text-muted-foreground"> · {entry.branch}</span>
                              ) : null}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              Posted by <span className="font-semibold text-foreground">{entry.author}</span>
                            </p>
                          </div>
                          {canManage && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => handleOpenEdit(entry)}
                                title="Edit Update"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(entry)}
                                title="Delete Update"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {entry.note ? (
                          <p className="text-xs leading-relaxed text-foreground/90 line-clamp-3 whitespace-pre-wrap">{entry.note}</p>
                        ) : null}
                        {(entry.tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-auto pt-1">
                            {(entry.tags || []).map((tag) => (
                              <Badge key={`${entry.id}-${tag}`} variant="secondary" className="text-[10px] font-medium">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox / Media Viewer Dialog */}
      <Dialog
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        title={selectedMedia?.label || "Media View"}
        className="max-w-2xl"
      >
        <div className="space-y-3">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-border">
            {selectedMedia?.src ? (
              selectedMedia.kind === "video" ? (
                <video src={selectedMedia.src} controls autoPlay className="h-full w-full max-h-[450px] object-contain" />
              ) : (
                <img src={selectedMedia.src} alt={selectedMedia.label} className="h-full w-full max-h-[450px] object-contain" />
              )
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${selectedMedia?.tone}`} />
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span className="font-semibold text-foreground">{selectedMedia?.label}</span>
            <span className="uppercase text-[10px] font-bold tracking-wider">{selectedMedia?.kind}</span>
          </div>
        </div>
      </Dialog>

      {/* Create / Edit Journal Entry Modal with Real Data Selectors */}
      <Dialog
        isOpen={open}
        onClose={() => !uploading && setOpen(false)}
        title={editingEntry ? "Edit classroom update" : "Post classroom update"}
        description={
          editingEntry
            ? "Update class details, note, or replace attached media."
            : "Select class, write update, and attach photos or videos for parents."
        }
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Class Batches</label>
              {classesList.length > 0 ? (
                <Select value={className} onChange={(e) => setClassName(e.target.value)} className="h-9 text-xs">
                  {classesList.map((item) => (
                    <option key={`modal-class-${item}`} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/batches")}
                  className="w-full h-9 flex items-center justify-center gap-2 text-xs font-semibold text-primary border border-primary/40 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add batch
                </button>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Franchise / Branch</label>
              <Select value={branch} onChange={(e) => setBranch(e.target.value)} className="h-9 text-xs">
                {branchesList.map((item) => (
                  <option key={`modal-branch-${item}`} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Classroom Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Circle time with monsoon rhymes, fruit snack, and outdoor play in the sand pit..."
              className="w-full min-h-24 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Tags (comma separated)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="h-9 text-xs"
              placeholder="circle time, snack, outdoor play"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-3">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-primary" />
              {editingEntry ? "Replace or Update Photo/Video" : "Attach Photo or Video"}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <Select value={mediaKind} onChange={(e) => setMediaKind(e.target.value as "photo" | "video")} className="h-9 text-xs bg-card">
                <option value="photo">Photo (Image)</option>
                <option value="video">Video</option>
              </Select>
              <Input
                value={mediaLabel}
                onChange={(e) => setMediaLabel(e.target.value)}
                className="h-9 text-xs bg-card"
                placeholder="Caption / Title"
              />
            </div>

            <div className="space-y-2">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 transition-colors"
              />

              {previewUrl && (
                <div className="relative mt-2 aspect-video w-full max-h-48 rounded-lg overflow-hidden border border-border bg-black flex items-center justify-center">
                  {mediaKind === "video" ? (
                    <video src={previewUrl} controls className="h-full w-full object-contain" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl("")
                    }}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button size="sm" onClick={publish} disabled={classesList.length === 0 || !note.trim() || uploading} className="gap-2">
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading media…
                </>
              ) : editingEntry ? (
                "Save Changes"
              ) : (
                "Publish Update"
              )}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
