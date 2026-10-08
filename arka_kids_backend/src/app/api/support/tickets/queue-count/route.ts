import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { SupportTicket } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"

// GET /api/support/tickets/queue-count
export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const [open, inProgress, pending] = await Promise.all([
      SupportTicket.countDocuments({ status: "open" }),
      SupportTicket.countDocuments({ status: "in_progress" }),
      SupportTicket.countDocuments({ status: "open" }),
    ])
    return NextResponse.json({ open, inProgress, pending })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
