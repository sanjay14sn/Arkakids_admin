import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { User } from "@/models/User"
import { requireAuth } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const dbUser = await User.findById(user.id).select("-password")
    if (!dbUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        tenantId: dbUser.tenantId,
        avatar: dbUser.avatar,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
