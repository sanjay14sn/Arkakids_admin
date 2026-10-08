import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { ChildLeave } from "@/models/ChildLeave"
import { requireAuth } from "@/lib/authMiddleware"
import { expandTenantIds, loadStudentForParent } from "@/lib/listSchoolNotices"
import { applyLeaveToAttendanceDocs, dateKey, serializeChildLeave } from "@/lib/childLeaveAttendance"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const student = await loadStudentForParent(user)
    const tenantIds = await expandTenantIds(
      [user.tenantId, student?.tenantId].filter(Boolean).map(String)
    )
    const filter: Record<string, any> = {}
    if (user.role !== "super_admin" && tenantIds.length > 0) {
      filter.tenantId = { $in: tenantIds }
    }
    if (user.role === "student") {
      const ids = [student?._id, user.id].filter(Boolean).map(String)
      const names = [student?.name, user.name].filter(Boolean).map((n) => String(n).trim())
      filter.$or = [
        ...(ids.length ? [{ childId: { $in: ids } }] : []),
        ...(names.length ? [{ childName: { $in: names } }] : []),
      ]
    }

    const leaves = await ChildLeave.find(filter).sort({ createdAt: -1 })
    return NextResponse.json(leaves.map(serializeChildLeave))
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

    const isStaff = user.role !== "student"
    const leave = await ChildLeave.create({
      childId: String(student?._id || data.childId || user.id),
      childName: student?.name || data.childName || user.name,
      batchId: data.batchId,
      tenantId: user.tenantId || data.tenantId || student?.tenantId || "default-tenant",
      fromDate: dateKey(data.fromDate || data.startDate),
      toDate: dateKey(data.toDate || data.endDate),
      reason: data.reason,
      requestedBy: data.requestedBy || user.name || "Parent",
      status: isStaff ? "approved" : "pending",
      decidedBy: isStaff ? user.name : undefined,
    })

    if (leave.status === "approved") {
      const tenantIds = await expandTenantIds(
        [user.tenantId, leave.tenantId, student?.tenantId].filter(Boolean).map(String)
      )
      await applyLeaveToAttendanceDocs(leave, tenantIds)
    }

    return NextResponse.json(serializeChildLeave(leave), { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
