import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { FeeStructure } from "@/models"
import { requireAuth } from "@/lib/authMiddleware"

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    const body = await req.json()
    await connectDB()
    const { id } = await context.params
    const structure = await FeeStructure.findOneAndUpdate(
      { _id: id, tenantId: user.tenantId },
      { $set: body },
      { new: true }
    )
    if (!structure) {
      return NextResponse.json({ error: "Structure not found" }, { status: 404 })
    }
    return NextResponse.json(structure)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const { id } = await context.params
    const structure = await FeeStructure.findOneAndDelete({ _id: id, tenantId: user.tenantId })
    if (!structure) {
      return NextResponse.json({ error: "Structure not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Structure deleted" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
