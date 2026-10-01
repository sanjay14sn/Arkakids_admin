import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Student } from "@/models/Student"
import { Staff } from "@/models/Staff"
import { Lead } from "@/models/Lead"
import { Attendance } from "@/models/Attendance"
import { Admission } from "@/models/index"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

// GET /api/dashboard/metrics
export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const tf = tenantFilter(user)
    const today = new Date().toISOString().slice(0, 10)

    const [totalStudents, activeStudents, totalStaff, activeStaff, totalLeads, pendingAdmissions, todayAttendance] =
      await Promise.all([
        Student.countDocuments(tf),
        Student.countDocuments({ ...tf, status: "active" }),
        Staff.countDocuments(tf),
        Staff.countDocuments({ ...tf, status: "active" }),
        Lead.countDocuments(tf),
        Admission.countDocuments({ ...tf, status: "pending" }),
        Attendance.findOne({ ...tf, date: today, type: "student" }),
      ])

    const presentCount = todayAttendance
      ? todayAttendance.records.filter((r: any) => r.status === "present").length
      : 0
    const absentCount = todayAttendance
      ? todayAttendance.records.filter((r: any) => r.status === "absent").length
      : 0

    return NextResponse.json({
      totalStudents,
      activeStudents,
      totalStaff,
      activeStaff,
      totalLeads,
      pendingAdmissions,
      todayPresent: presentCount,
      todayAbsent: absentCount,
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
