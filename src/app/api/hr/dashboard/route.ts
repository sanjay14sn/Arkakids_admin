import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Staff } from "@/models/Staff"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const filter = tenantFilter(user)
    const staffList = await Staff.find(filter)
    
    let totalEmployees = 0
    let presentToday = 0
    let absentToday = 0
    let onLeaveToday = 0

    staffList.forEach(s => {
      totalEmployees++
      if (s.status === "active") {
        // Assume everyone active is present unless we integrate with a separate StaffAttendance model
        presentToday++
      } else if (s.status === "on_leave") {
        onLeaveToday++
      } else {
        absentToday++
      }
    })

    const data = {
      month: new Date().toISOString().slice(0, 7),
      today: new Date().toISOString().slice(0, 10),
      totalEmployees,
      presentToday,
      absentToday,
      onLeaveToday,
      pendingLeaveRequests: 0,
      pendingExpenseClaims: 0,
      payrollStatus: { draft: 0, pending: 0, approved: 0, released: 0, total: 0 },
      upcoming: []
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
