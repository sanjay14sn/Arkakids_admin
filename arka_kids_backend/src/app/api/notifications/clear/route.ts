import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Notification } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"

// DELETE /api/notifications/clear
export async function DELETE(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    await Notification.deleteMany({
      $or: [{ targetUserId: user.id }, { tenantId: user.tenantId }],
    })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
