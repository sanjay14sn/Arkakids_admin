import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Course } from "@/models/Course"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const baseFilter = tenantFilter(user)
    const filter = Object.keys(baseFilter).length > 0 
      ? { $or: [baseFilter, { tenantId: "global" }] }
      : baseFilter
    const courses = await Course.find(filter).sort({ createdAt: -1 })
    return NextResponse.json(courses)
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
    const course = await Course.create({ ...data, tenantId: user.tenantId || data.tenantId })
    return NextResponse.json(course, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
