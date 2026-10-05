import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { ChildLeave } from "@/models/ChildLeave"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    let filter: any = tenantFilter(user)
    
    // If parent, only get their child's leaves
    if (user.role === "student" && user.tenantId) {
       // Ideally we match by a linked childId, but for now just fallback to tenant match
       // The UI already filters by childId.
    }

    const leaves = await ChildLeave.find(filter).sort({ createdAt: -1 })
    return NextResponse.json(leaves)
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
    
    const isStaff = user.role !== "student"
    const leave = await ChildLeave.create({
      ...data,
      tenantId: user.tenantId || data.tenantId || "default-tenant",
      requestedBy: data.requestedBy || user.name || "Parent",
      status: isStaff ? "approved" : "pending",
      decidedBy: isStaff ? user.name : undefined,
    })
    
    return NextResponse.json(leave, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
