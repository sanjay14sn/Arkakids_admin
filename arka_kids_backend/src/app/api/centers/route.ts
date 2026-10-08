import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Center } from "@/models/Center"
import { requireAuth, requireSuperAdmin } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    // Super admin sees all; others see only their center
    const filter = user.role === "super_admin" ? {} : { tenantName: user.tenantId }
    const centers = await Center.find(filter).sort({ createdAt: -1 })
    return NextResponse.json(centers)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error } = requireSuperAdmin(req)
  if (error) return error

  try {
    await connectDB()
    const data = await req.json()
    const center = await Center.create(data)
    return NextResponse.json(center, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
