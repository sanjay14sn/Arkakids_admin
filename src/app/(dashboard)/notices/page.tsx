"use client"

import * as React from "react"
import { Bell, Plus, Trash2, Loader2, Pencil } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Dialog } from "@/components/ui/Dialog"
import { DatePicker, formatDisplayDate } from "@/components/ui/DatePicker"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { ALL_BATCHES_ID, batchId, batchLabel, parseNoticeDate } from "@/lib/schoolNotices"

type BatchOption = { id: string; label: string }

type SchoolNotice = {
  id?: string
  _id?: string
  title: string
  description: string
  type?: string
  targetBatchIds?: string[]
  targetBatchNames?: string[]
  noticeDate?: string
  createdAt?: string
  createdBy?: string
}

const NOTICE_TYPES = [
  { value: "info", label: "Update" },
  { value: "event", label: "Event" },
  { value: "urgent", label: "Urgent" },
]

function typeBadge(type?: string) {
  if (type === "urgent") return <Badge variant="destructive">Urgent</Badge>
  if (type === "event") return <Badge variant="success">Event</Badge>
  return <Badge variant="secondary">Update</Badge>
}

function audienceLabel(notice: SchoolNotice) {
  const names = notice.targetBatchNames || []
  if (names.length) return names.join(", ")
  const ids = notice.targetBatchIds || []
  if (ids.includes(ALL_BATCHES_ID) || ids.length === 0) return "All batches"
  return "Selected batches"
}

function noticeId(notice: SchoolNotice) {
  return String(notice.id || notice._id)
}

function todayIso() {
  return parseNoticeDate()
}

export default function SchoolNoticesPage() {
  const [batches, setBatches] = React.useState<BatchOption[]>([])
  const [notices, setNotices] = React.useState<SchoolNotice[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState("")
  const [message, setMessage] = React.useState("")
  const [type, setType] = React.useState("info")
  const [batch, setBatch] = React.useState(ALL_BATCHES_ID)
  const [noticeDate, setNoticeDate] = React.useState(todayIso)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [batchData, noticeData] = await Promise.all([
        api.getBatches().catch(() => []),
        api.getSchoolNotices().catch(() => []),
      ])
      const batchList: any[] = Array.isArray(batchData) ? batchData : []
      setBatches(
        batchList
          .filter((b) => b.status !== "inactive" && b.status !== "completed")
          .map((b) => ({
            id: batchId(b),
            label: batchLabel(b),
          }))
          .filter((b) => b.id)
          .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" }))
      )
      setNotices(Array.isArray(noticeData) ? noticeData : [])
    } catch (err: any) {
      toast.error(err.message || "Failed to load notices")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  function resetForm() {
    setTitle("")
    setMessage("")
    setType("info")
    setBatch(ALL_BATCHES_ID)
    setNoticeDate(todayIso())
    setEditingId(null)
  }

  function openCreate() {
    resetForm()
    setOpen(true)
  }

  function openEdit(notice: SchoolNotice) {
    const ids = notice.targetBatchIds || []
    setEditingId(noticeId(notice))
    setTitle(notice.title || "")
    setMessage(notice.description || "")
    setType(notice.type && NOTICE_TYPES.some((t) => t.value === notice.type) ? notice.type : "info")
    setBatch(ids.includes(ALL_BATCHES_ID) || ids.length === 0 ? ALL_BATCHES_ID : ids[0])
    setNoticeDate(parseNoticeDate(notice.noticeDate || notice.createdAt))
    setOpen(true)
  }

  function payload() {
    const selected = batches.find((b) => b.id === batch)
    return {
      title: title.trim(),
      description: message.trim(),
      type,
      isSchoolNotice: true,
      targetRoles: ["student"],
      targetBatchIds: batch === ALL_BATCHES_ID ? [ALL_BATCHES_ID] : [batch],
      targetBatchNames: batch === ALL_BATCHES_ID ? ["All batches"] : selected ? [selected.label] : [],
      noticeDate,
    }
  }

  async function publish() {
    if (!title.trim() || !message.trim()) {
      toast.error("Enter a title and message")
      return
    }
    if (!noticeDate) {
      toast.error("Choose a date")
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await api.updateNotification(editingId, payload())
        toast.success("Notice updated")
      } else {
        await api.createNotification(payload())
        toast.success("Notice sent to parent app")
      }
      resetForm()
      setOpen(false)
      await load()
    } catch (err: any) {
      toast.error(err.message || (editingId ? "Could not update notice" : "Could not publish notice"))
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this school notice?")) return
    try {
      await api.deleteNotification(id)
      setNotices((prev) => prev.filter((n) => noticeId(n) !== id))
      toast.success("Notice deleted")
    } catch (err: any) {
      toast.error(err.message || "Could not delete notice")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">School Notices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send circulars to all batches or a specific class. Parents see them on the mobile home.
          </p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          New notice
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading notices…
        </div>
      ) : notices.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-2">
            <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold">No school notices yet</p>
            <p className="text-xs text-muted-foreground">Publish one to show it on the parent dashboard.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => {
            const id = noticeId(notice)
            return (
              <div key={id} className="rounded-xl border border-border bg-card px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" className="min-w-0 text-left flex-1" onClick={() => openEdit(notice)}>
                    <div className="flex flex-wrap items-center gap-2">
                      {typeBadge(notice.type)}
                      <span className="text-[11px] font-semibold rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                        {audienceLabel(notice)}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground mt-2">{notice.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{notice.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {formatDisplayDate(parseNoticeDate(notice.noticeDate || notice.createdAt))}
                      {notice.createdBy ? ` · ${notice.createdBy}` : ""}
                    </p>
                  </button>
                  <div className="flex items-center shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(notice)} aria-label="Edit notice">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(id)} aria-label="Delete notice">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog
        isOpen={open}
        onClose={() => !saving && (setOpen(false), resetForm())}
        title={editingId ? "Edit school notice" : "New school notice"}
        description="Choose who should see this on the parent app."
      >
        <div className="space-y-3">
          <Select label="Send to *" value={batch} onChange={(e) => setBatch(e.target.value)}>
            <option value={ALL_BATCHES_ID}>All batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </Select>
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            {NOTICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date *</label>
            <DatePicker value={noticeDate} onChange={setNoticeDate} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Holiday on Friday" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Write the circular parents should see…"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => (setOpen(false), resetForm())} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={publish} isLoading={saving}>
              {editingId ? "Save changes" : "Publish to parents"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
