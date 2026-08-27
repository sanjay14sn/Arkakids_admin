"use client"

import * as React from "react"
import {
  Megaphone,
  MessageSquare,
  Bell,
  Send,
  Search,
  CheckCheck,
  Phone,
  MoreVertical,
  ChevronLeft,
  Sparkles,
  Users,
  CheckCircle2,
} from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { useStore } from "@/store/useStore"
import { PARENT_ALERTS, useParentPortal, type ParentMessage } from "@/lib/parentPortal"
import { CHILDREN, CLASSES, type ChildRecord } from "@/lib/preschoolOps"
import { AccessRestricted } from "@/components/shared/AccessRestricted"
import { cn } from "@/lib/utils"

const COMM_KEY = "arka_parent_communication_v1"

type SchoolAnnouncement = {
  id: string
  title: string
  body: string
  audience: string
  createdAt: string
}

const SEED_ANNOUNCEMENTS: SchoolAnnouncement[] = [
  {
    id: "ann-1",
    title: "Independence Day Celebration",
    body: "Please send ethnic wear on 15 Aug. Celebration photos will be uploaded in the Daily Journal.",
    audience: "All parents",
    createdAt: "2026-08-12T07:00:00.000Z",
  },
  {
    id: "ann-2",
    title: "Term 1 Parent-Teacher Meeting",
    body: "PTM scheduled for 28 Aug, 9:00 AM – 1:00 PM at Koramangala branch.",
    audience: "All parents",
    createdAt: "2026-08-18T09:00:00.000Z",
  },
  {
    id: "ann-3",
    title: "Nursery Term Fee Reminder",
    body: "Nursery term balance is due on 5 Sep 2026. Online payment links are active.",
    audience: "Nursery A",
    createdAt: "2026-08-20T10:00:00.000Z",
  },
]

function loadAnnouncements(): SchoolAnnouncement[] {
  if (typeof window === "undefined") return SEED_ANNOUNCEMENTS
  try {
    const raw = localStorage.getItem(COMM_KEY)
    if (!raw) return SEED_ANNOUNCEMENTS
    const parsed = JSON.parse(raw) as SchoolAnnouncement[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_ANNOUNCEMENTS
  } catch {
    return SEED_ANNOUNCEMENTS
  }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  }
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

function formatBubbleTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export default function ParentCommunicationPage() {
  const { user, notifications, markAsRead, markAllAsRead, addNotification } = useStore()
  const { state, update, ready } = useParentPortal()
  
  const [tab, setTab] = React.useState<"announcements" | "messages" | "notifications">("announcements")
  const [announcements, setAnnouncements] = React.useState<SchoolAnnouncement[]>(SEED_ANNOUNCEMENTS)
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [audience, setAudience] = React.useState("All parents")

  // WhatsApp style message threads state
  const [selectedChildId, setSelectedChildId] = React.useState<string>("child-aanya")
  const [replyBody, setReplyBody] = React.useState("")
  const [contactSearch, setContactSearch] = React.useState("")
  const [showChatMobile, setShowChatMobile] = React.useState(false)
  const chatBottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setAnnouncements(loadAnnouncements())
  }, [])

  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedChildId, state.messages])

  const persist = (next: SchoolAnnouncement[]) => {
    setAnnouncements(next)
    localStorage.setItem(COMM_KEY, JSON.stringify(next))
  }

  const publishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    const item: SchoolAnnouncement = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      audience,
      createdAt: new Date().toISOString(),
    }
    persist([item, ...announcements])
    addNotification({
      title: "Announcement sent",
      description: `"${item.title}" published to ${item.audience}.`,
      type: "system",
    })
    setTitle("")
    setBody("")
  }

  const sendDirectMessage = () => {
    if (!replyBody.trim()) return
    update((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: `msg-${Date.now()}`,
          from: "school",
          author: user?.name || "ARKA KIDS",
          body: replyBody.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    }))
    setReplyBody("")
  }

  const thread = [...state.messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const unreadCount = notifications.filter((item) => !item.read).length
  const isOwner = user?.role === "owner"

  const filteredContacts = CHILDREN.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.parentName.toLowerCase().includes(contactSearch.toLowerCase())
  )
  const currentChild = CHILDREN.find((c) => c.id === selectedChildId) ?? CHILDREN[0]

  if (!isOwner) {
    return (
      <AccessRestricted
        title="Parent Communication is for Franchise Owners"
        description="Classroom Coordinators and Parents use Messages. Super Admin uses Announcements."
      />
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading parent communication...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-border/60 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Hub & Broadcasts</p>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <Megaphone className="h-6 w-6 text-primary" />
            Parent Communication
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage circulars, direct parent messaging, and automated alerts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/60 border border-border/50 rounded-xl p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab("announcements")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors",
            tab === "announcements" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Megaphone className="h-3.5 w-3.5" />
          <span>Announcements</span>
          <span className={cn(
            "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
            tab === "announcements" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
          )}>
            {announcements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("messages")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors",
            tab === "messages" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Messages</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("notifications")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors",
            tab === "notifications" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-primary text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: ANNOUNCEMENTS ── */}
      {tab === "announcements" && (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Create Announcement Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/15">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">New Circular</h3>
                  <p className="text-[11px] text-muted-foreground">Broadcast an update to parents</p>
                </div>
              </div>

              <form onSubmit={publishAnnouncement} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Independence Day Dress Code"
                    className="w-full h-9 rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Target Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full h-9 rounded-xl border border-border bg-card px-3 text-xs focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="All parents">All parents</option>
                    {CLASSES.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Announcement Body *</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your notice here..."
                    rows={4}
                    className="w-full rounded-xl border border-border bg-card p-3 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full justify-center"
                  disabled={!title.trim() || !body.trim()}
                  icon={Send}
                >
                  Publish Announcement
                </Button>
              </form>
            </div>
          </div>

          {/* Announcements Feed */}
          <div className="lg:col-span-3 space-y-3">
            {announcements.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15 font-bold">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                    {item.audience}
                  </Badge>
                </div>
                <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> ARKA KIDS Official
                  </span>
                  <span>{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: MESSAGES (WhatsApp-style layout) ── */}
      {tab === "messages" && (
        <div
          className="rounded-2xl border border-border overflow-hidden flex bg-card"
          style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}
        >
          {/* Left Sidebar */}
          <div
            className={cn(
              "flex flex-col border-r border-border bg-card",
              "w-full md:w-80 md:flex shrink-0",
              showChatMobile ? "hidden md:flex" : "flex"
            )}
          >
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
              <p className="text-xs font-bold text-foreground">Parent Conversations</p>
              <span className="text-[10px] text-muted-foreground">{filteredContacts.length} threads</span>
            </div>

            <div className="px-3 py-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search parents..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/50 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/30">
              {filteredContacts.map((child) => {
                const isSelected = selectedChildId === child.id
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      setSelectedChildId(child.id)
                      setShowChatMobile(true)
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors",
                      isSelected ? "bg-primary/10 border-l-3 border-l-primary" : "hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border",
                      isSelected ? "bg-primary text-white border-primary" : "bg-primary/10 text-primary border-primary/15"
                    )}>
                      {child.parentName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground truncate">{child.parentName}</p>
                        <span className="text-[10px] text-muted-foreground">Today</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        <span className="text-primary/70 font-medium">{child.name}</span> · {child.className}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Chat Panel */}
          <div className={cn("flex flex-col flex-1 min-w-0", showChatMobile ? "flex" : "hidden md:flex")}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/50 bg-card flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowChatMobile(false)}
                className="md:hidden text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="h-9 w-9 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentChild.parentName.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{currentChild.parentName}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Parent of {currentChild.name} · {currentChild.className} · {currentChild.branch.replace("ARKA KIDS ", "")}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </button>
                <button type="button" className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ background: "var(--muted)" }}>
              {thread.map((msg, i) => {
                const isSchool = msg.from === "school"
                const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(thread[i - 1].createdAt).toDateString()
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-2">
                        <span className="text-[10px] text-muted-foreground bg-card border border-border/60 rounded-full px-3 py-0.5 font-medium">
                          {new Date(msg.createdAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                        </span>
                      </div>
                    )}
                    <div className={cn("flex", isSchool ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs",
                          isSchool
                            ? "bg-primary text-white rounded-br-xs"
                            : "bg-card text-foreground border border-border/60 rounded-bl-xs"
                        )}
                      >
                        {!isSchool && <p className="font-bold text-[10px] text-primary mb-0.5">{msg.author}</p>}
                        <p className="break-words">{msg.body}</p>
                        <div className={cn("flex items-center justify-end gap-1 mt-1 text-[9px]", isSchool ? "text-white/70" : "text-muted-foreground")}>
                          <span>{formatBubbleTime(msg.createdAt)}</span>
                          {isSchool && <CheckCheck className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                )
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="px-3 py-3 border-t border-border/50 bg-card flex items-end gap-2 shrink-0">
              <input
                type="text"
                placeholder={`Reply to ${currentChild.parentName}...`}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendDirectMessage()
                }}
                className="flex-1 h-10 rounded-2xl border border-border bg-muted/40 px-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={sendDirectMessage}
                disabled={!replyBody.trim()}
                className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: NOTIFICATIONS ── */}
      {tab === "notifications" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground">In-App Notices & Alerts</h3>
              <p className="text-xs text-muted-foreground">Automated system alerts delivered to parent mobile app.</p>
            </div>
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} icon={CheckCircle2}>
                Mark all read
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {PARENT_ALERTS.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3.5 shadow-xs">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15">
                  <Bell className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">{alert.title}</h4>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">System Alert</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{alert.body}</p>
                </div>
              </div>
            ))}

            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markAsRead(item.id)}
                className="w-full text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-all flex items-start gap-3.5"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15">
                  <Bell className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                    {!item.read && <Badge variant="success" className="text-[9px]">New</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(item.timestamp).toLocaleString("en-IN")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
