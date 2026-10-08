import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Course } from "@/models/Course"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const course = await Course.findOne({ _id: params.id, ...tenantFilter(user) })
    if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 })
    return NextResponse.json(course)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const data = await req.json()
    const course = await Course.findOneAndUpdate(
      { _id: params.id, ...tenantFilter(user) },
      data,
      { new: true }
    )
    if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 })
    return NextResponse.json(course)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const course = await Course.findOneAndDelete({ _id: params.id, ...tenantFilter(user) })
    if (!course) return NextResponse.json({ message: "Course not found" }, { status: 404 })
    return NextResponse.json({ message: "Deleted successfully" })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
