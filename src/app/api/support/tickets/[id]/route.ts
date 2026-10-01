import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { SupportTicket } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    const data = await req.json()
    const ticket = await SupportTicket.findByIdAndUpdate(id, data, { new: true })
    if (!ticket) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(ticket)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
