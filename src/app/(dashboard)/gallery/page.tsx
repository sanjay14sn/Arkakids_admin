"use client"

import * as React from "react"
import { Images } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { api } from "@/lib/api"

type GalleryPhoto = {
  id: string
  src: string
  label: string
  date: string
  author: string
}

function collectPhotos(journal: any, index: number): GalleryPhoto[] {
  const title = String(journal.title || journal.note || journal.content || "Class moment")
  const date = String(journal.date || "").slice(0, 10)
  const author = String(journal.postedBy || journal.author || "Coordinator")
  const seen = new Set<string>()
  const urls: string[] = []
  const add = (raw?: unknown) => {
    const url = String(raw || "").trim()
    if (!url.startsWith("http") || seen.has(url)) return
    seen.add(url)
    urls.push(url)
  }
  add(journal.imageUrl)
  if (Array.isArray(journal.photos)) journal.photos.forEach(add)
  if (Array.isArray(journal.media)) {
    journal.media.forEach((item: any) => add(item?.src || item))
  }
  return urls.map((src, i) => ({
    id: `${journal._id || journal.id || index}-${i}`,
    src,
    label: title,
    date,
    author,
  }))
}

export default function GalleryPage() {
  const [photos, setPhotos] = React.useState<GalleryPhoto[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await api.getJournals()
        const list = Array.isArray(rows) ? rows : rows?.journals || rows?.data || []
        const next = list.flatMap((journal: any, index: number) => collectPhotos(journal, index))
        if (!cancelled) setPhotos(next)
      } catch {
        if (!cancelled) setPhotos([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Images className="h-6 w-6 text-primary" />
          Photo gallery
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every Daily Journal moment photo for this class.
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground py-16 text-center">Loading gallery...</p>
      ) : photos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No moment photos yet. Photos posted in Daily Journal will appear here.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Class moments</CardTitle>
            <CardDescription>{photos.length} photo{photos.length === 1 ? "" : "s"}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.src}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
              >
                <img src={photo.src} alt={photo.label} className="h-full w-full object-cover transition group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1.5">
                  <p className="text-[11px] font-semibold text-white truncate">{photo.label}</p>
                  <p className="text-[10px] text-white/80 truncate">{photo.date} · {photo.author}</p>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
