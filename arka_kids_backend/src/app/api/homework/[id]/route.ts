import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Homework } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    const item = await Homework.findById(id)
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(item)
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
    const batch = data.batch || data.className
    const activity = data.activity || data.subject
    const instructions = data.instructions ?? data.description
    const patch: Record<string, unknown> = {}
    if (data.title !== undefined) patch.title = data.title
    if (activity !== undefined) {
      patch.activity = activity
      patch.subject = activity
    }
    if (instructions !== undefined) {
      patch.instructions = instructions
      patch.description = instructions
    }
    if (batch !== undefined) {
      patch.batch = batch
      patch.className = data.className || batch
    }
    if (data.assignedDate !== undefined) {
      const assignedDate = String(data.assignedDate || "").slice(0, 10)
      if (!assignedDate) {
        return NextResponse.json({ message: "Date is required" }, { status: 400 })
      }
      patch.assignedDate = assignedDate
    }
    if (data.dueDate !== undefined) {
      const dueDate = String(data.dueDate || "").slice(0, 10)
      if (!dueDate) {
        return NextResponse.json({ message: "Due Date is required" }, { status: 400 })
      }
      patch.dueDate = dueDate
    }
    const nextAssigned = String(patch.assignedDate || data.assignedDate || "")
    const nextDue = String(patch.dueDate || data.dueDate || "")
    if (nextAssigned && nextDue && nextDue < nextAssigned) {
      return NextResponse.json({ message: "Due Date cannot be before Date" }, { status: 400 })
    }
    if (data.visibility !== undefined) patch.visibility = data.visibility
    if (data.visibleFrom !== undefined) patch.visibleFrom = data.visibleFrom
    if (data.status !== undefined) patch.status = data.status
    if (data.attachment !== undefined) patch.attachment = data.attachment
    if (data.createdBy !== undefined) patch.createdBy = data.createdBy
    if (data.submittable !== undefined) patch.submittable = Boolean(data.submittable)

    const item = await Homework.findByIdAndUpdate(id, patch, { new: true })
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(item)
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
    await Homework.findByIdAndDelete(id)
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
