import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Homework } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"
import { listHomeworksForUser } from "@/lib/listHomeworks"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const className = searchParams.get("className")
    const items = await listHomeworksForUser(user, className)
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
    const assignedDate = String(data.assignedDate || "").slice(0, 10)
    const dueDate = String(data.dueDate || "").slice(0, 10)
    if (!assignedDate || !dueDate) {
      return NextResponse.json({ message: "Date and Due Date are required" }, { status: 400 })
    }
    if (dueDate < assignedDate) {
      return NextResponse.json({ message: "Due Date cannot be before Date" }, { status: 400 })
    }
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
    if (assignedDate < today) {
      return NextResponse.json({ message: "Date cannot be in the past" }, { status: 400 })
    }
    const batch = data.batch || data.className || ""
    const item = await Homework.create({
      ...data,
      tenantId: user.tenantId || data.tenantId || data.branch,
      title: data.title,
      activity: data.activity || data.subject,
      subject: data.activity || data.subject,
      instructions: data.instructions || data.description,
      description: data.instructions || data.description,
      batch,
      className: data.className || batch,
      dueDate,
      assignedDate,
      createdBy: data.createdBy || user.name,
      submittable: data.submittable === true || data.submittable === "true",
    })
    item.set("submittable", data.submittable === true || data.submittable === "true")
    if (item.isModified("submittable")) await item.save()
    return NextResponse.json(item, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
