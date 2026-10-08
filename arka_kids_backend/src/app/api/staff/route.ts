import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Staff } from "@/models/Staff"
import { User } from "@/models/User"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const staff = await Staff.find(tenantFilter(user)).sort({ createdAt: -1 })
    return NextResponse.json(staff)
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
    
    // Check for duplicate email
    if (data.email) {
      const existingEmail = await Staff.findOne({ email: data.email.toLowerCase().trim() })
      if (existingEmail) {
        return NextResponse.json({ message: "A staff member with this email address already exists in the system." }, { status: 400 })
      }
    }
    
    // Check for duplicate phone
    if (data.phone) {
      const existingPhone = await Staff.findOne({ phone: data.phone.trim() })
      if (existingPhone) {
        return NextResponse.json({ message: "A staff member with this mobile number already exists in the system." }, { status: 400 })
      }
    }

    const tenantId = user.tenantId || data.tenantId || data.branch || "default"
    const staff = await Staff.create({ ...data, tenantId })

    // Auto-create User account for Center Coordinators so they can log in
    if (data.role === "Center Coordinator") {
      const existingUser = await User.findOne({ email: data.email.toLowerCase().trim() })
      if (!existingUser) {
        await User.create({
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          password: "Password123", // Default password for new coordinators
          role: "coordinator",
          tenantId: tenantId,
        })
      }
    }

    return NextResponse.json(staff, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
