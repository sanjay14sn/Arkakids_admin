import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { FeeStructure } from "@/models"
import { requireAuth } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const structures = await FeeStructure.find({ tenantId: user.tenantId }).sort({ createdAt: -1 })
    return NextResponse.json(structures)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    const body = await req.json()
    await connectDB()
    const structure = new FeeStructure({
      ...body,
      tenantId: user.tenantId,
      branch: user.tenantId,
    })
    await structure.save()
    return NextResponse.json(structure, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
