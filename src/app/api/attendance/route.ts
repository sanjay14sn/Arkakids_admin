import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Attendance } from "@/models/Attendance"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")
    const month = searchParams.get("month")
    const type = searchParams.get("type") || "student"
    const entityId = searchParams.get("entityId")
    const className = searchParams.get("className")

    const filter: Record<string, any> = { ...tenantFilter(user), type }
    if (date) filter.date = date
    if (month) filter.date = { $regex: `^${month}` }
    if (entityId) filter["records.entityId"] = entityId
    if (className) filter.className = className

    const records = await Attendance.find(filter).sort({ date: -1 })
    return NextResponse.json(records)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const { date, type, className, batchId, submitted, submittedBy, submittedAt, records } = await req.json()
    const tenantId = user.tenantId || ""

    // Upsert attendance for this date+type+className+tenant
    const attendance = await Attendance.findOneAndUpdate(
      { tenantId, date, type, className: className || null },
      { tenantId, date, type, className, batchId, submitted, submittedBy, submittedAt, records },
      { upsert: true, new: true, runValidators: true }
    )
    return NextResponse.json(attendance, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
