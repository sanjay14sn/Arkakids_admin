import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Course } from "@/models/Course"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const baseFilter = tenantFilter(user)
    const filter = Object.keys(baseFilter).length > 0 
      ? { $or: [baseFilter, { tenantId: "global" }] }
      : baseFilter
    const courses = await Course.find(filter).sort({ updatedAt: -1, createdAt: -1 })
    
    // Deduplicate by lowercase trimmed course name
    const seen = new Set<string>()
    const deduped: any[] = []
    for (const c of courses) {
      const key = (c.name || "").trim().toLowerCase()
      if (!key) continue
      if (!seen.has(key)) {
        seen.add(key)
        deduped.push(c)
      }
    }
    return NextResponse.json(deduped)
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
    const tenantId = user.tenantId || data.tenantId || "global"
    const trimmedName = (data.name || "").trim()

    // If a course with this name already exists for this tenant, update it
    if (trimmedName) {
      const existing = await Course.findOne({
        $or: [{ tenantId }, { tenantId: "global" }],
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      })
      if (existing) {
        const updated = await Course.findByIdAndUpdate(
          existing._id,
          { ...data, tenantId },
          { new: true }
        )
        return NextResponse.json(updated, { status: 200 })
      }
    }

    const course = await Course.create({ ...data, tenantId })
    return NextResponse.json(course, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
