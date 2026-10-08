import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Center } from "@/models/Center"
import { requireAuth } from "@/lib/authMiddleware"

// GET /api/centers/policy/me — returns the center policy for the current user's tenant
export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const center = await Center.findOne({ tenantName: user.tenantId })
    if (!center) {
      return NextResponse.json({
        tenantId: user.tenantId,
        enabledModules: [],
        studentLimit: 200,
        staffLimit: 20,
        enableHrModule: false,
      })
    }

    return NextResponse.json({
      tenantId: user.tenantId,
      enabledModules: center.enabledModules,
      studentLimit: 200,
      staffLimit: 20,
      enableHrModule: center.enabledModules.includes("hr"),
      currency: center.currency || "INR",
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
