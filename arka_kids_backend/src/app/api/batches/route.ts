import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Batch } from "@/models/Batch"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const batches = await Batch.find(tenantFilter(user)).sort({ createdAt: -1 })
    return NextResponse.json(batches)
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
    const batch = await Batch.create({ ...data, tenantId: user.tenantId || data.tenantId })
    return NextResponse.json(batch, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
