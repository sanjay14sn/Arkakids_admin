import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { User } from "@/models/User"
import { signToken } from "@/lib/authMiddleware"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    const isValid = await user.comparePassword(password)
    if (!isValid) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      name: user.name,
    })

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        avatar: user.avatar,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Login failed" }, { status: 500 })
  }
}
