import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Notification } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"

// PATCH /api/notifications/read-all
export async function PATCH(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    await Notification.updateMany(
      { $or: [{ targetUserId: user.id }, { tenantId: user.tenantId }] },
      { read: true }
    )
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
