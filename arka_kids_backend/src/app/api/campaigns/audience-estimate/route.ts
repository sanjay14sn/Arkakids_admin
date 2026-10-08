import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/authMiddleware"
import { estimateAudience } from "@/lib/campaigns"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const audience = req.nextUrl.searchParams.get("audience") || "all_leads"
    const count = await estimateAudience(user, audience)
    return NextResponse.json({ count, audience })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
