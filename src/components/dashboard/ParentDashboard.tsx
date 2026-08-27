"use client"

import Link from "next/link"
import { Bell, CalendarDays, Camera, CreditCard, MessageSquare, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { KPICard } from "./KPICard"
import { formatCurrency } from "@/lib/utils"
import {
  PARENT_CHILD_ID,
  childById,
  parentChildFilter,
  usePreschoolOps,
} from "@/lib/preschoolOps"
import { PARENT_ALERTS, useParentPortal } from "@/lib/parentPortal"
import { studentSummary, usePreschoolFees } from "@/lib/preschoolFees"

export function ParentDashboard() {
  const child = childById(PARENT_CHILD_ID)
  const { state: ops, ready: opsReady } = usePreschoolOps()
  const { state: portal, ready: portalReady } = useParentPortal()
  const { state: fees, ready: feesReady } = usePreschoolFees()

  if (!opsReady || !portalReady || !feesReady) {
    return <p className="text-xs text-muted-foreground py-16 text-center">Loading parent home...</p>
  }

  const feeSummary = studentSummary(fees, PARENT_CHILD_ID)

  const journals = parentChildFilter(ops.journals, true).slice().sort((a, b) => b.date.localeCompare(a.date))
  const latestJournal = journals[0]
  const nextEvent = [...ops.events].sort((a, b) => a.date.localeCompare(b.date)).find((event) => event.date >= new Date().toISOString().slice(0, 10))
  const leave = ops.leaves.find((item) => item.childId === PARENT_CHILD_ID)
  const unread = portal.messages.filter((item) => item.from === "school").slice(0, 1)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Parent portal</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">{child?.name}</h1>
        <p className="text-sm text-muted-foreground">
          {child?.className} · {child?.branch} · Parent {child?.parentName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Fee due" value={formatCurrency(feeSummary?.outstanding || 0)} subtext={feeSummary?.nextDueLabel || "Nursery term"} icon={CreditCard} delay={0.05} />
        <KPICard title="Today’s journal" value={latestJournal ? latestJournal.media.length : 0} subtext={latestJournal?.note.slice(0, 42) || "No update yet"} icon={Camera} delay={0.1} />
        <KPICard title="Next event" value={nextEvent ? nextEvent.date.slice(5) : "—"} subtext={nextEvent?.title || "Calendar is clear"} icon={CalendarDays} delay={0.15} />
        <KPICard title="School messages" value={portal.messages.length} subtext={unread[0]?.body.slice(0, 36) || "Inbox"} icon={MessageSquare} delay={0.2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Alerts
            </CardTitle>
            <CardDescription>Fees, holidays, and events for this branch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {PARENT_ALERTS.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-border/60 px-3 py-2.5">
                <p className="text-xs font-bold">{alert.title}</p>
                <p className="text-[11px] text-muted-foreground">{alert.body}</p>
              </div>
            ))}
            {leave && (
              <div className="rounded-lg border border-border/60 px-3 py-2.5">
                <p className="text-xs font-bold">Leave {leave.status}</p>
                <p className="text-[11px] text-muted-foreground">
                  {leave.fromDate} → {leave.toDate} · {leave.reason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { href: "/fees", label: "Pay fees / receipts" },
              { href: "/attendance", label: "My child’s attendance" },
              { href: "/journal", label: "Daily journal" },
              { href: "/homework", label: "Homework" },
              { href: "/gallery", label: "Event gallery" },
              { href: "/messages", label: "Message school" },
              { href: "/feedback", label: "Share feedback" },
            ].map((item) => (
              <Link key={`parent-link-${item.href}`} href={item.href}>
                <Button variant="outline" size="sm" className="w-full justify-start">{item.label}</Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {latestJournal && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Latest classroom update</CardTitle>
            <CardDescription>{latestJournal.date} · {latestJournal.className}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">{latestJournal.note}</p>
            <div className="flex flex-wrap gap-2">
              {latestJournal.tags.map((tag) => (
                <Badge key={`tag-${latestJournal.id}-${tag}`} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Star className="h-3.5 w-3.5" />
        Last feedback: {portal.feedback[0]?.comment || "None yet"}
      </div>
    </div>
  )
}
