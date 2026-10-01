import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Absence } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    const item = await Absence.findById(id)
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(item)
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
    const item = await Absence.findByIdAndUpdate(id, data, { new: true })
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(item)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    await Absence.findByIdAndDelete(id)
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
