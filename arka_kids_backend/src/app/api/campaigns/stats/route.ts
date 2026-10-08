import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { requireAuth } from "@/lib/authMiddleware"
import { campaignStats } from "@/lib/campaigns"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    return NextResponse.json(await campaignStats(user))
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
