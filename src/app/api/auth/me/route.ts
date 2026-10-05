import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { User } from "@/models/User"
import { AdminUser } from "@/models/AdminUser"
import { requireAuth } from "@/lib/authMiddleware"
import { getPermissionsForRole } from "@/lib/roleHelper"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const emailClean = user.email ? user.email.toLowerCase().trim() : ""

    // 1. Check User model by ID or email
    let dbUser = await User.findById(user.id).select("-password")
    if (!dbUser && emailClean) {
      dbUser = await User.findOne({ email: emailClean }).select("-password")
    }

    if (dbUser) {
      const permissions = await getPermissionsForRole(dbUser.role)

      return NextResponse.json({
        user: {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          tenantId: dbUser.tenantId,
          avatar: dbUser.avatar,
          permissions,
        },
      })
    }

    // 2. Check AdminUser model by ID or email
    let adminUser = await AdminUser.findById(user.id)
    if (!adminUser && emailClean) {
      adminUser = await AdminUser.findOne({ email: emailClean })
    }

    if (adminUser) {
      let mappedRole: any = user.role || "trainer"
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

      return NextResponse.json({
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

    // 3. Fallback to JWT payload user if valid JWT
    const permissions = await getPermissionsForRole(user.role)
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name || "User",
        email: user.email,
        role: user.role || "trainer",
        tenantId: user.tenantId,
        permissions,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
