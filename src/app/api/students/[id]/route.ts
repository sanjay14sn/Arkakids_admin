import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Student } from "@/models/Student"
import { requireAuth } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error

  const { id } = await params
  try {
    await connectDB()
    const student = await Student.findById(id)
    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 })
    return NextResponse.json(student)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error

  const { id } = await params
  try {
    await connectDB()
    const data = await req.json()
    const student = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 })
    return NextResponse.json(student)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error

  const { id } = await params
  try {
    await connectDB()
    await Student.findByIdAndDelete(id)
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
