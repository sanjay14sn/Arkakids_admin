import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Journal } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"
import { listJournalsForUser } from "@/lib/listJournals"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const className = searchParams.get("className")
    const items = await listJournalsForUser(user, className)
    return NextResponse.json(items)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const data = await req.json()
    const media = Array.isArray(data.media) ? data.media : []
    const photos = media.map((m: any) => m?.src).filter(Boolean)
    const tags = Array.isArray(data.tags)
      ? data.tags.map((t: any) => String(t).trim()).filter(Boolean)
      : String(data.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)

    const item = await Journal.create({
      tenantId: user.tenantId || data.tenantId || data.branch,
      date: data.date || new Date().toISOString().slice(0, 10),
      title: data.title || media[0]?.label || "Classroom Update",
      content: data.note || data.content,
      photos: photos.length ? photos : data.photos,
      className: data.className,
      postedBy: data.author || data.postedBy,
      tags,
      media,
      branch: data.branch,
    })
    return NextResponse.json(item, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
