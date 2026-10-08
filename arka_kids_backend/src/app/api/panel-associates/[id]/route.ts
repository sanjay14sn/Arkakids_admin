import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { PanelAssociate } from "@/models/PanelAssociate"
import { requireAuth } from "@/lib/authMiddleware"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    await connectDB()
    const data = await req.json()

    const updated = await PanelAssociate.findByIdAndUpdate(id, data, { new: true })
    if (!updated) return NextResponse.json({ message: "Panel associate not found" }, { status: 404 })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    await connectDB()

    const deleted = await PanelAssociate.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ message: "Panel associate not found" }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
