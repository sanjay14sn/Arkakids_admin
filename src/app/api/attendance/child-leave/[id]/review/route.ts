import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { ChildLeave } from "@/models/ChildLeave"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    await connectDB()
    const { status } = await req.json()
    
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 })
    }

    const leave = await ChildLeave.findOneAndUpdate(
      { _id: id, ...tenantFilter(user) },
      { 
        status,
        decidedBy: user.name || "Coordinator"
      },
      { new: true }
    )

    if (!leave) {
      return NextResponse.json({ message: "Leave not found" }, { status: 404 })
    }

    // TODO: If approved, we could automatically create/update an Attendance record 
    // for this child with status = "leave" for the requested dates.
    // The UI handles this right now by showing leaves dynamically, but keeping the DB in sync is good.

    return NextResponse.json(leave)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
