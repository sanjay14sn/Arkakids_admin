import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import connectDB from "@/lib/mongodb"
import { ChildLeave } from "@/models/ChildLeave"
import { requireAuth } from "@/lib/authMiddleware"
import { expandTenantIds, loadStudentForParent } from "@/lib/listSchoolNotices"
import {
  applyLeaveToAttendanceDocs,
  clearLeaveFromAttendanceDocs,
  serializeChildLeave,
} from "@/lib/childLeaveAttendance"

async function tenantAllowed(userTenantId: string | undefined, leaveTenantId: string) {
  const userTenants = new Set(
    (await expandTenantIds([userTenantId].filter(Boolean).map(String))).map((t) => t.toLowerCase())
  )
  const leaveTenants = new Set(
    (await expandTenantIds([leaveTenantId].filter(Boolean).map(String))).map((t) => t.toLowerCase())
  )
  if (userTenants.size === 0 || leaveTenants.size === 0) return true
  return [...userTenants].some((t) => leaveTenants.has(t))
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    await connectDB()
    const { status } = await req.json()

    if (!["approved", "rejected", "cancelled"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 })
    }
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Leave not found" }, { status: 404 })
    }

    const leave = await ChildLeave.findById(id)
    if (!leave) {
      return NextResponse.json({ message: "Leave not found" }, { status: 404 })
    }

    if (user.role === "student") {
      if (status !== "cancelled") {
        return NextResponse.json({ message: "Only coordinators can review leave" }, { status: 403 })
      }
      const student = await loadStudentForParent(user)
      const allowedIds = new Set([String(student?._id || ""), String(user.id)].filter(Boolean))
      const allowedNames = new Set(
        [student?.name, user.name].filter(Boolean).map((n) => String(n).trim().toLowerCase())
      )
      const ownsLeave =
        allowedIds.has(String(leave.childId || "")) ||
        allowedNames.has(String(leave.childName || "").trim().toLowerCase())
      if (!ownsLeave) {
        return NextResponse.json({ message: "Leave not found" }, { status: 404 })
      }
    } else if (user.role !== "super_admin") {
      const ok = await tenantAllowed(user.tenantId, String(leave.tenantId || ""))
      if (!ok) {
        return NextResponse.json({ message: "Leave not found" }, { status: 404 })
      }
    }

    const wasApproved = String(leave.status || "").toLowerCase() === "approved"
    leave.status = status
    leave.decidedBy = user.name || (status === "cancelled" ? "Cancelled" : "Coordinator")
    await leave.save({ validateBeforeSave: false })

    const tenantIds = await expandTenantIds(
      [user.tenantId, leave.tenantId].filter(Boolean).map(String)
    )
    if (status === "approved") {
      await applyLeaveToAttendanceDocs(leave, tenantIds)
    }
    if (status === "cancelled" && wasApproved) {
      await clearLeaveFromAttendanceDocs(leave, tenantIds)
    }

    return NextResponse.json(serializeChildLeave(leave))
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
