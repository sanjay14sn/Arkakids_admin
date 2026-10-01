"use client"

import * as React from "react"
import Link from "next/link"
import { Camera, Plus, ChevronRight, AlertCircle, Calendar, Play } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { useStore } from "@/store/useStore"
import { usePreschoolOps, parentChildFilter } from "@/lib/preschoolOps"

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function DailyJournalDashboardWidget() {
  const { user } = useStore()
  const isParent = user?.role === "student"
  const canPost = !isParent

  const { state: ops, ready } = usePreschoolOps()

  if (!ready) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          Loading daily journal status...
        </CardContent>
      </Card>
    )
  }

  const todayStr = getTodayStr()
  const filteredJournals = parentChildFilter(ops.journals, isParent)
  const todayEntries = filteredJournals.filter((j) => j.date === todayStr)

  const isEmptyToday = todayEntries.length === 0

  if (isEmptyToday) {
    return (
      <Card className="bg-card border-primary/40 dark:border-primary/30 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Camera className="h-4 w-4 text-primary" />
              </div>
              <span>Today's Daily Journal</span>
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/10 font-bold">
              No Post Today
            </Badge>
          </div>
          <CardDescription className="text-xs mt-1">
            {isParent
              ? "Your child's classroom coordinator has not posted a journal update for today yet."
              : "No classroom journal updates have been posted for today yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isParent
                ? "Check back later or view recent journal posts from previous days."
                : "Share circle time, fruit snack, outdoor play, and learning moments with parents."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {canPost && (
              <Link href="/journal">
                <Button size="sm" icon={Plus} className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs">
                  Post Today's Journal
                </Button>
              </Link>
            )}
            <Link href="/journal">
              <Button variant="outline" size="sm" className="text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10">
                Open Daily Journal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border/80 shadow-xs">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Camera className="h-4 w-4 text-primary" />
            <span>Today's Daily Journal Updates</span>
          </CardTitle>
          <Badge variant="success" className="text-[10px] font-bold">
            {todayEntries.length} {todayEntries.length === 1 ? "Post Today" : "Posts Today"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {todayEntries.slice(0, 2).map((entry) => (
          <div key={entry.id} className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{entry.className}</span>
              <span className="text-[10px] text-muted-foreground">{entry.branch}</span>
            </div>
            <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">{entry.note}</p>
            {entry.media.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {entry.media.map((item) => (
                  <div key={item.id} className="relative h-12 w-16 rounded-lg overflow-hidden border border-border bg-black">
                    {item.src ? (
                      item.kind === "video" ? (
                        <video src={item.src} className="h-full w-full object-cover" />
                      ) : (
                        <img src={item.src} alt={item.label} className="h-full w-full object-cover" />
                      )
                    ) : (
                      <div className={`h-full w-full bg-gradient-to-br ${item.tone}`} />
                    )}
                    {item.kind === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-3.5 w-3.5 text-white fill-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end pt-1">
          <Link href="/journal" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            <span>View All Daily Journal Updates</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
