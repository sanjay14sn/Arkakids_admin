import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { User } from "@/models/User"
import { signToken } from "@/lib/authMiddleware"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { name, email, password, role, tenantId } = await req.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: "Name, email, password and role are required" }, { status: 400 })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 })
    }

    const user = await User.create({ name, email, password, role, tenantId })

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      name: user.name,
    })

    return NextResponse.json(
      {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
      },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Registration failed" }, { status: 500 })
  }
}
