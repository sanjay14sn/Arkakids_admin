import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Student } from "@/models/Student"
import { requireAuth } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

// PUT /api/students/[id]/fees
export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error

  const { id } = await params
  try {
    await connectDB()
    const feeData = await req.json()
    const student = await Student.findByIdAndUpdate(
      id,
      { $set: { fees: feeData } },
      { new: true, runValidators: true }
    )
    if (!student) return NextResponse.json({ message: "Student not found" }, { status: 404 })
    return NextResponse.json(student)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
