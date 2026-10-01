import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { ChildCare } from "@/models/index"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const items = await ChildCare.find(tenantFilter(user)).sort({ createdAt: -1 })
    return NextResponse.json(items)
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
    const item = await ChildCare.create({ ...data, tenantId: user.tenantId || data.tenantId })
    return NextResponse.json(item, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
