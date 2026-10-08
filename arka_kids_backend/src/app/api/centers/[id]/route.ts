import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Center } from "@/models/Center"
import { requireAuth, requireSuperAdmin } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error

  const { id } = await params
  try {
    await connectDB()
    const center = await Center.findById(id)
    if (!center) return NextResponse.json({ message: "Center not found" }, { status: 404 })
    return NextResponse.json(center)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error

  const { id } = await params
  try {
    await connectDB()
    const data = await req.json()
    const center = await Center.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    if (!center) return NextResponse.json({ message: "Center not found" }, { status: 404 })
    return NextResponse.json(center)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { error } = requireSuperAdmin(req)
  if (error) return error

  const { id } = await params
  try {
    await connectDB()
    await Center.findByIdAndDelete(id)
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
