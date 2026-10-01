import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Notification } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

// PATCH /api/notifications/[id]/read
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    await Notification.findByIdAndUpdate(id, { read: true })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
