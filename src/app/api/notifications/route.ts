import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Notification } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const filter: Record<string, any> = {
      $or: [
        { targetUserId: user.id },
        { targetRoles: user.role },
        { tenantId: user.tenantId },
        { targetRoles: { $size: 0 }, targetUserId: { $exists: false } },
      ],
    }
    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50)
    return NextResponse.json(notifications)
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
    const notification = await Notification.create({ ...data, tenantId: user.tenantId })
    return NextResponse.json(notification, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
