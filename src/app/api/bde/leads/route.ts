import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Lead } from "@/models/Lead"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const leads = await Lead.find(tenantFilter(user)).sort({ createdAt: -1 })
    return NextResponse.json(leads)
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
    const lead = await Lead.create({ ...data, tenantId: user.tenantId || data.tenantId })
    return NextResponse.json(lead, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
