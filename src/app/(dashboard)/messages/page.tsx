"use client"

import * as React from "react"
import {
  MessageSquare,
  Send,
  Search,
  MoreVertical,
  Phone,
  CheckCheck,
  Check,
  ChevronLeft,
} from "lucide-react"
import { useStore } from "@/store/useStore"
import { useParentPortal, type ParentMessage } from "@/lib/parentPortal"
import { CHILDREN, type ChildRecord } from "@/lib/preschoolOps"
import { cn } from "@/lib/utils"

// ─── Seed: one thread per child/parent ────────────────────────────────────────
// We map each child to a "contact" with its own message thread keyed by childId.
// The base thread (from parentPortal) is used for the preview child (Aanya).

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday)
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

function formatBubbleTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ThreadMessage = ParentMessage & { read?: boolean }

type Contact = {
  child: ChildRecord
  lastMessage: ThreadMessage | null
  unread: number
}

// ─── Stub threads for all children except Aanya (filled from parentPortal) ───
const STUB_THREADS: Record<string, ThreadMessage[]> = {
  "child-vihaan": [
    {
      id: "vm-1",
      from: "school",
      author: "ARKA KIDS Whitefield",
      body: "Vihaan did wonderfully in today's number activity!",
      createdAt: "2026-08-21T09:00:00.000Z",
      read: true,
    },
    {
      id: "vm-2",
      from: "parent",
      author: "Kiran Reddy",
      body: "Thank you! He was excited about it at home too.",
      createdAt: "2026-08-21T11:15:00.000Z",
      read: true,
    },
  ],
  "child-mira": [
    {
      id: "mm-1",
      from: "school",
      author: "ARKA KIDS Koramangala",
      body: "Mira led the group song practice today. She's a natural leader!",
      createdAt: "2026-08-22T10:00:00.000Z",
      read: true,
    },
    {
      id: "mm-2",
      from: "parent",
      author: "Anjali Iyer",
      body: "We are so proud of her. Is there a recording available?",
      createdAt: "2026-08-23T08:40:00.000Z",
      read: false,
    },
  ],
  "child-arjun": [
    {
      id: "am-1",
      from: "school",
      author: "ARKA KIDS Indiranagar",
      body: "Arjun is settling in well. A little shy still — perfectly normal.",
      createdAt: "2026-08-20T12:00:00.000Z",
      read: true,
    },
  ],
  "child-sara": [
    {
      id: "sm-1",
      from: "parent",
      author: "Imran Khan",
      body: "Sara forgot her water bottle. Can someone check if it's in class?",
      createdAt: "2026-08-23T13:00:00.000Z",
      read: false,
    },
  ],
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { user } = useStore()
  const { state, update, ready } = useParentPortal()
  const isParent = user?.role === "student"

  // Local thread state keyed by childId — merged with base portal messages for Aanya
  const [threads, setThreads] = React.useState<Record<string, ThreadMessage[]>>({})
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [body, setBody] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [showChat, setShowChat] = React.useState(false) // mobile toggle
  const bottomRef = React.useRef<HTMLDivElement>(null)

  // Initialise threads from portal + stubs
  React.useEffect(() => {
    if (!ready) return
    const initial: Record<string, ThreadMessage[]> = {}
    CHILDREN.forEach((child) => {
      if (child.id === "child-aanya") {
        initial[child.id] = [...state.messages].map((m) => ({ ...m, read: true }))
      } else {
        initial[child.id] = STUB_THREADS[child.id] ?? []
      }
    })
    setThreads(initial)

    // Default: first child selected for coordinator, Aanya for parent
    const defaultId = isParent ? "child-aanya" : CHILDREN[0].id
    setSelectedId(defaultId)
  }, [ready]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on chat open / new message
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedId, threads])

  // Build contacts list
  const contacts: Contact[] = CHILDREN.map((child) => {
    const thread = threads[child.id] ?? []
    const sorted = [...thread].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const lastMessage = sorted[sorted.length - 1] ?? null
    const unread = thread.filter((m) => m.from === "parent" && !m.read).length
    return { child, lastMessage, unread }
  }).sort((a, b) => {
    const ta = a.lastMessage?.createdAt ?? ""
    const tb = b.lastMessage?.createdAt ?? ""
    return tb.localeCompare(ta)
  })

  const filtered = contacts.filter((c) =>
    c.child.name.toLowerCase().includes(search.toLowerCase()) ||
    c.child.parentName.toLowerCase().includes(search.toLowerCase())
  )

  const selectedChild = CHILDREN.find((c) => c.id === selectedId)
  const selectedThread = selectedId
    ? [...(threads[selectedId] ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : []

  const markRead = (id: string) => {
    setThreads((prev) => ({
      ...prev,
      [id]: (prev[id] ?? []).map((m) => ({ ...m, read: true })),
    }))
  }

  const openChat = (childId: string) => {
    setSelectedId(childId)
    markRead(childId)
    setShowChat(true)
  }

  const sendMessage = () => {
    if (!body.trim() || !selectedId) return
    const msg: ThreadMessage = {
      id: `msg-${Date.now()}`,
      from: isParent ? "parent" : "school",
      author: user?.name || (isParent ? "Parent" : "ARKA KIDS"),
      body: body.trim(),
      createdAt: new Date().toISOString(),
      read: true,
    }
    setThreads((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), msg],
    }))
    // Mirror into portal state for Aanya's thread
    if (selectedId === "child-aanya") {
      update((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: msg.id, from: msg.from, author: msg.author, body: msg.body, createdAt: msg.createdAt },
        ],
      }))
    }
    setBody("")
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading messages...
        </div>
      </div>
    )
  }

  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0)

  return (
    <div className="flex flex-col gap-0">
      {/* ── Page label (above the chat UI) ── */}
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Communication</p>
        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <MessageSquare className="h-6 w-6 text-primary" />
            Messages
          </h1>
          {totalUnread > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
              {totalUnread}
            </span>
          )}
        </div>
      </div>

      {/* ── WhatsApp-style shell ── */}
      <div
        className="rounded-2xl border border-border/80 overflow-hidden flex"
        style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
      >
        {/* ═══ LEFT SIDEBAR ════════════════════════════════════════════════ */}
        <div
          className={cn(
            "flex flex-col border-r border-border/60 bg-card",
            "w-full md:w-80 md:flex shrink-0",
            showChat ? "hidden md:flex" : "flex"
          )}
        >
          {/* Sidebar header */}
          <div className="px-4 py-3.5 border-b border-border/50 flex items-center justify-between gap-2 shrink-0">
            <p className="text-sm font-bold text-foreground">
              {isParent ? "School messages" : "Parent threads"}
            </p>
            <span className="text-[10px] text-muted-foreground font-medium">
              {contacts.length} contacts
            </span>
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search parents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/60 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No contacts found</p>
            ) : (
              filtered.map(({ child, lastMessage, unread }) => {
                const isActive = selectedId === child.id
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => openChat(child.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-center gap-3 border-b border-border/30 transition-colors",
                      isActive
                        ? "bg-primary/8 border-l-2 border-l-primary"
                        : "hover:bg-muted/40"
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full font-bold text-sm flex items-center justify-center shrink-0 border",
                        isActive
                          ? "bg-primary text-white border-primary"
                          : "bg-primary/10 text-primary border-primary/15"
                      )}
                    >
                      {child.parentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {child.parentName}
                        </p>
                        {lastMessage && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatTime(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className="text-[11px] text-muted-foreground truncate">
                          <span className="text-primary/60 font-medium">{child.name}</span>
                          {lastMessage ? " · " + lastMessage.body : " · No messages yet"}
                        </p>
                        {unread > 0 && (
                          <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ═══ RIGHT CHAT PANEL ════════════════════════════════════════════ */}
        <div
          className={cn(
            "flex flex-col flex-1 min-w-0",
            showChat ? "flex" : "hidden md:flex"
          )}
        >
          {selectedChild ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-border/50 bg-card flex items-center gap-3 shrink-0">
                {/* Back button — mobile only */}
                <button
                  type="button"
                  onClick={() => setShowChat(false)}
                  className="md:hidden text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Avatar */}
                <div className="h-9 w-9 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {selectedChild.parentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedChild.parentName}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Parent of {selectedChild.name} · {selectedChild.className} · {selectedChild.branch.replace("ARKA KIDS ", "")}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full hover:bg-muted/60 flex items-center justify-center text-muted-foreground transition-colors"
                    title="Call parent"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full hover:bg-muted/60 flex items-center justify-center text-muted-foreground transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5"
                style={{ background: "var(--muted)" }}
              >
                {selectedThread.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-1">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                      <p className="text-xs text-muted-foreground">No messages yet. Start the conversation.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedThread.map((msg, i) => {
                      const isSchool = msg.from === "school"
                      const isMine = isParent ? !isSchool : isSchool
                      const prevMsg = selectedThread[i - 1]
                      const showDate =
                        !prevMsg ||
                        new Date(msg.createdAt).toDateString() !==
                          new Date(prevMsg.createdAt).toDateString()

                      return (
                        <React.Fragment key={msg.id}>
                          {/* Date separator */}
                          {showDate && (
                            <div className="flex items-center justify-center my-3">
                              <span className="text-[10px] text-muted-foreground bg-card/80 border border-border/60 rounded-full px-3 py-0.5 font-medium">
                                {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                })}
                              </span>
                            </div>
                          )}

                          {/* Bubble */}
                          <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                            <div
                              className={cn(
                                "relative max-w-[72%] px-3.5 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed",
                                isMine
                                  ? "bg-primary text-white rounded-br-sm"
                                  : "bg-card text-foreground border border-border/50 rounded-bl-sm"
                              )}
                            >
                              {/* Sender name for group-style view */}
                              {!isMine && (
                                <p className="text-[10px] font-bold mb-0.5 text-primary">
                                  {msg.author}
                                </p>
                              )}
                              <p className="break-words">{msg.body}</p>
                              {/* Time + read tick */}
                              <div
                                className={cn(
                                  "flex items-center gap-1 mt-1 justify-end",
                                  isMine ? "text-white/60" : "text-muted-foreground"
                                )}
                              >
                                <span className="text-[10px]">{formatBubbleTime(msg.createdAt)}</span>
                                {isMine && (
                                  <CheckCheck className="h-3 w-3" />
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      )
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Input bar */}
              <div className="px-3 py-3 border-t border-border/50 bg-card flex items-end gap-2 shrink-0">
                <div className="flex-1 relative">
                  <textarea
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value)
                      e.target.style.height = "auto"
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder={isParent ? "Message the school..." : `Reply to ${selectedChild.parentName}...`}
                    rows={1}
                    className="w-full rounded-2xl border border-border/60 bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none overflow-hidden"
                    style={{ minHeight: "40px", maxHeight: "120px" }}
                  />
                </div>
                <button
                  type="button"
                  disabled={!body.trim()}
                  onClick={sendMessage}
                  className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8" style={{ background: "var(--muted)" }}>
              <div className="h-16 w-16 rounded-full bg-card border border-border/60 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Select a parent to chat</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose a parent thread from the list on the left.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
