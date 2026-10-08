import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { ChildCare } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"
import { listChildCareForUser } from "@/lib/listChildCare"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const studentId = req.nextUrl.searchParams.get("studentId")
    const type = req.nextUrl.searchParams.get("type")
    const items = await listChildCareForUser(user, { studentId, type })
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
    const item = await ChildCare.create({
      ...data,
      studentId: String(data.studentId || ""),
      studentName: String(data.studentName || ""),
      tenantId: user.tenantId || data.tenantId || "default",
    })
    return NextResponse.json(item, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
