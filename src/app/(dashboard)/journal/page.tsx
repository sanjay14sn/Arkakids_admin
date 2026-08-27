"use client"

import * as React from "react"
import { Camera, Plus, Play } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { useStore } from "@/store/useStore"
import { formatDate } from "@/lib/utils"
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

function JournalMediaTile({ item }: { item: JournalMedia }) {
  return (
    <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
      {item.src ? (
        <img src={item.src} alt={item.label} className="h-full w-full object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${item.tone}`} />
      )}
      {item.kind === "video" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow">
            <Play className="h-5 w-5 text-foreground fill-foreground" />
          </span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2">
        <p className="text-[11px] font-semibold text-white leading-tight">{item.label}</p>
        <p className="text-[9px] uppercase tracking-wide text-white/80">{item.kind}</p>
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
  const { user, addNotification } = useStore()
  const isParent = user?.role === "student"
  const canPost = !isParent
  const { state, update, ready } = usePreschoolOps()
  const [open, setOpen] = React.useState(false)
  const [className, setClassName] = React.useState<string>("Nursery A")
  const [branch, setBranch] = React.useState<string>(BRANCHES[0])
  const [note, setNote] = React.useState("")
  const [tags, setTags] = React.useState("circle time, snack, outdoor play")
  const [mediaKind, setMediaKind] = React.useState<"photo" | "video">("photo")
  const [mediaLabel, setMediaLabel] = React.useState("Classroom moment")
  const [mediaSrc, setMediaSrc] = React.useState("")

  const entries = parentChildFilter(state.journals, isParent).slice().sort((a, b) => b.date.localeCompare(a.date))
  const parentChild = childById(PARENT_CHILD_ID)

  const publish = () => {
    if (!note.trim()) return
    const entry: JournalEntry = {
      id: `j-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      className,
      branch,
      author: user?.name || "Coordinator",
      note: note.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      media: [
        {
          id: `m-${Date.now()}`,
          kind: mediaKind,
          label: mediaLabel.trim() || (mediaKind === "video" ? "Class video" : "Class photo"),
          tone: TONES[Math.floor(Math.random() * TONES.length)],
          src: mediaSrc || undefined,
        },
      ],
    }
    update((prev) => ({ ...prev, journals: [entry, ...prev.journals] }))
    addNotification({
      title: "Daily journal posted",
      description: `${className} update is visible to parents.`,
      type: "system",
    })
    setNote("")
    setMediaSrc("")
    setOpen(false)
  }

  if (!ready) {
    return <p className="text-xs text-muted-foreground py-16 text-center">Loading classroom journal...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
        {canPost && (
          <Button size="sm" icon={Plus} onClick={() => setOpen(true)}>
            New class update
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">No journal posts yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{entry.className}</CardTitle>
                    <CardDescription>
                      {entry.branch} • {formatDate(entry.date)} • {entry.author}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags.map((tag) => (
                      <Badge key={`${entry.id}-${tag}`} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <p className="text-sm leading-relaxed">{entry.note}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {entry.media.map((item) => (
                    <JournalMediaTile key={item.id} item={item} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Post classroom journal"
        description="Parents of this class will see the note and gallery."
        className="max-w-xl"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select value={className} onChange={(e) => setClassName(e.target.value)} className="h-9 text-xs">
              {CLASSES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
            <Select value={branch} onChange={(e) => setBranch(e.target.value)} className="h-9 text-xs">
              {BRANCHES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Circle time with monsoon rhymes, fruit snack, outdoor play..."
            className="w-full min-h-24 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
          <Input value={tags} onChange={(e) => setTags(e.target.value)} className="h-9 text-xs" placeholder="Tags: circle time, snack, outdoor play" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={mediaKind} onChange={(e) => setMediaKind(e.target.value as "photo" | "video")} className="h-9 text-xs">
              <option value="photo">Photo</option>
              <option value="video">Video</option>
            </Select>
            <Input value={mediaLabel} onChange={(e) => setMediaLabel(e.target.value)} className="h-9 text-xs" placeholder="Caption" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Photo or video still</label>
            <input
              type="file"
              accept="image/*,video/*"
              className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) {
                  setMediaSrc("")
                  return
                }
                setMediaKind(file.type.startsWith("video") ? "video" : "photo")
                setMediaSrc(URL.createObjectURL(file))
                if (mediaLabel === "Classroom moment") {
                  setMediaLabel(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "))
                }
              }}
            />
            {mediaSrc ? (
              <div className="mt-2 w-40">
                <JournalMediaTile
                  item={{
                    id: "preview-media",
                    kind: mediaKind,
                    label: mediaLabel,
                    tone: TONES[0],
                    src: mediaSrc,
                  }}
                />
              </div>
            ) : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={publish} disabled={!note.trim()}>Publish</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
