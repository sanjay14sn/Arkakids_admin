import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { User } from "@/models/User"
import { AdminUser } from "@/models/AdminUser"
import { signToken } from "@/lib/authMiddleware"
import { getPermissionsForRole } from "@/lib/roleHelper"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const emailClean = email.toLowerCase().trim()

    // 1. Check User model
    const user = await User.findOne({ email: emailClean })
    if (user) {
      const isValid = await user.comparePassword(password)
      if (isValid) {
        const permissions = await getPermissionsForRole(user.role)

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
            permissions,
          },
        })
      }
    }

    // 2. Check AdminUser model fallback (for users created via Admin Users screen with 4-digit PIN)
    const adminUser = await AdminUser.findOne({ email: emailClean })
    if (adminUser) {
      if (adminUser.status === "inactive") {
        return NextResponse.json({ message: "Account is inactive. Contact Super Admin." }, { status: 403 })
      }

      if (adminUser.pin === password || String(adminUser.pin) === String(password)) {
        let mappedRole: any = "trainer"
        const rLower = String(adminUser.role).toLowerCase()
        if (rLower.includes("super_admin") || rLower.includes("super admin")) {
          mappedRole = "super_admin"
        } else if (rLower.includes("owner") || rLower.includes("manager")) {
          mappedRole = "owner"
        } else if (rLower.includes("bde")) {
          mappedRole = "bde"
        } else if (rLower.includes("student") || rLower.includes("parent")) {
          mappedRole = "student"
        } else {
          mappedRole = "trainer" // Coordinator
        }

        const permissions = await getPermissionsForRole(adminUser.role)

        const token = signToken({
          id: adminUser._id.toString(),
          email: adminUser.email,
          role: mappedRole,
          tenantId: adminUser.tenantId,
          name: adminUser.name,
        })

        return NextResponse.json({
          token,
          user: {
            id: adminUser._id.toString(),
            name: adminUser.name,
            email: adminUser.email,
            role: mappedRole,
            roleName: adminUser.role,
            tenantId: adminUser.tenantId,
            avatar: adminUser.profileImage,
            permissions,
          },
        })
      }
    }

    return NextResponse.json({ message: "Invalid email or PIN/password" }, { status: 401 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Login failed" }, { status: 500 })
  }
}
