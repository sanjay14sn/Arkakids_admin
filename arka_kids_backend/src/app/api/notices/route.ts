import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/authMiddleware"
import { listSchoolNoticesForUser } from "@/lib/listSchoolNotices"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const notices = await listSchoolNoticesForUser(user)
    return NextResponse.json(notices)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
