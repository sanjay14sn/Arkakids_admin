"use client"

import { Images } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { parentChildFilter, usePreschoolOps } from "@/lib/preschoolOps"
import { useStore } from "@/store/useStore"

const EVENT_ALBUMS = [
  { id: "gal-annual", title: "Annual Day 2026", date: "2026-12-12", tone: "from-rose-200 to-amber-300", shots: ["Welcome dance", "Costume parade", "Group photo"] },
  { id: "gal-ind", title: "Independence Day", date: "2026-08-15", tone: "from-orange-200 to-emerald-300", shots: ["Flag assembly", "Ethnic wear", "Snack stall"] },
  { id: "gal-ptm", title: "Term 1 PTM", date: "2026-08-28", tone: "from-sky-200 to-indigo-300", shots: ["Classroom boards", "Parent lounge"] },
]

export default function GalleryPage() {
  const { user } = useStore()
  const { state, ready } = usePreschoolOps()
  const isParent = user?.role === "student"
  const journals = parentChildFilter(state.journals, isParent)

  if (!ready) return <p className="text-xs text-muted-foreground py-16 text-center">Loading gallery...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Images className="h-6 w-6 text-primary" />
          Event gallery
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Annual day, celebrations, and classroom photos from Daily Journal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {EVENT_ALBUMS.map((album) => (
          <Card key={album.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{album.title}</CardTitle>
              <CardDescription>{album.date}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              {album.shots.map((shot) => (
                <div key={`${album.id}-${shot}`} className={`aspect-square rounded-lg bg-gradient-to-br ${album.tone} flex items-end p-2`}>
                  <span className="text-[10px] font-semibold text-slate-800/80">{shot}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold">From daily journal</h2>
        {journals.map((entry) => (
          <Card key={`gal-j-${entry.id}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{entry.className} · {entry.date}</CardTitle>
              <CardDescription>{entry.note}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {entry.media.map((media) => (
                <div key={media.id} className="relative h-24 w-32 overflow-hidden rounded-lg border border-border bg-muted">
                  {media.src ? (
                    <img src={media.src} alt={media.label} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${media.tone}`} />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-1">
                    <span className="text-[10px] font-semibold text-white">{media.label}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
