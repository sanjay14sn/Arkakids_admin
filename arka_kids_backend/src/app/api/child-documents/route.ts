import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { ChildDocument } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"
import { listChildDocumentsForUser, serializeChildDocument } from "@/lib/listChildDocuments"
import { loadStudentForParent } from "@/lib/listSchoolNotices"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const items = await listChildDocumentsForUser(user)
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
    const student = await loadStudentForParent(user)
    const studentId = String(data.studentId || student?._id || user.id || "")
    const studentName = String(data.studentName || student?.name || user.name || "Student")
    const type = String(data.type || "").trim()
    const name = String(data.name || type || "Document").trim()
    const url = String(data.url || data.fileUrl || "")
    if (!studentId || !url) {
      return NextResponse.json({ message: "Student and file are required" }, { status: 400 })
    }

    const payload = {
      tenantId: user.tenantId || data.tenantId || student?.tenantId,
      studentId,
      studentName,
      name,
      type,
      url,
      uploadedBy: data.uploadedBy || user.name,
      status: "uploaded" as const,
    }

    const existing = type
      ? await ChildDocument.findOne({ studentId, type }).sort({ createdAt: -1 })
      : null
    if (existing) {
      existing.set(payload)
      await existing.save()
      return NextResponse.json(serializeChildDocument(existing))
    }

    const item = await ChildDocument.create(payload)
    return NextResponse.json(serializeChildDocument(item), { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
