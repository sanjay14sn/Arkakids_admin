import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Homework } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    const { studentId, studentName, fileUrl } = await req.json()
    const item = await Homework.findById(id)
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
    
    // Check if already submitted
    const existingIndex = item.submissions?.findIndex(sub => sub.studentId === studentId) ?? -1
    const submission = {
      studentId,
      studentName: studentName || "Student",
      submittedAt: new Date().toISOString(),
      fileUrl
    }
    
    if (existingIndex > -1) {
      if (item.submissions) {
        item.submissions[existingIndex] = submission
      }
    } else {
      if (!item.submissions) item.submissions = []
      item.submissions.push(submission)
    }
    
    await item.save()
    return NextResponse.json(item)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
