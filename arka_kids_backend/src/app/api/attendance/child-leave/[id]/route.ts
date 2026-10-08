import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { ChildLeave } from "@/models/ChildLeave"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    await connectDB()
    
    const leave = await ChildLeave.findOneAndDelete({ 
      _id: id, 
      ...tenantFilter(user) 
    })

    if (!leave) {
      return NextResponse.json({ message: "Leave not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Deleted successfully" })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
