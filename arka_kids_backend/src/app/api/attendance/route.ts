import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Attendance } from "@/models/Attendance"
import { requireAuth } from "@/lib/authMiddleware"
import { listAttendanceForUser } from "@/lib/listAttendance"
import { applyLeaveToRecords, loadApprovedLeaves } from "@/lib/childLeaveAttendance"
import { expandTenantIds } from "@/lib/listSchoolNotices"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const items = await listAttendanceForUser(user, {
      date: searchParams.get("date"),
      month: searchParams.get("month"),
      type: searchParams.get("type") || "student",
      entityId: searchParams.get("entityId"),
      className: searchParams.get("className"),
    })
    return NextResponse.json(items)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

async function dropLegacyAttendanceIndex() {
  try {
    await Attendance.collection.dropIndex("tenantId_1_date_1_type_1")
  } catch {
    // Index already removed or never existed.
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    await dropLegacyAttendanceIndex()
    const { date, type, className, batchId, submitted, submittedBy, submittedAt, records } = await req.json()
    const tenantId = user.tenantId || ""
    const attendanceType = type || "student"
    const tenantIds = await expandTenantIds([tenantId].filter(Boolean))
    const approvedLeaves = attendanceType === "student" ? await loadApprovedLeaves(tenantIds) : []
    const payload = {
      tenantId,
      date,
      type: attendanceType,
      className,
      batchId,
      submitted,
      submittedBy,
      submittedAt,
      records: applyLeaveToRecords(
        (records || []).map((r: any) => ({
          ...r,
          entityId: String(r.entityId || ""),
          name: String(r.name || ""),
        })),
        approvedLeaves,
        date
      ),
    }

    const classFilter = className
      ? { tenantId, date, type: attendanceType, className }
      : { tenantId, date, type: attendanceType }

    let attendance = await Attendance.findOne(classFilter)
    if (!attendance && className) {
      attendance = await Attendance.findOne({
        tenantId,
        date,
        type: attendanceType,
        $or: [{ className: { $exists: false } }, { className: null }, { className: "" }],
      })
    }

    if (attendance) {
      attendance.set(payload)
      await attendance.save()
      return NextResponse.json(attendance, { status: 200 })
    }

    try {
      attendance = await Attendance.create(payload)
      return NextResponse.json(attendance, { status: 201 })
    } catch (err: any) {
      if (err?.code !== 11000) throw err
      const existing = await Attendance.findOne({ tenantId, date, type: attendanceType, className })
        || await Attendance.findOne({ tenantId, date, type: attendanceType })
      if (!existing) throw err
      existing.set(payload)
      await existing.save()
      return NextResponse.json(existing, { status: 200 })
    }
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
