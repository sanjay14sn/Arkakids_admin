import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { RoleModel } from "@/models/Role"
import { requireAuth } from "@/lib/authMiddleware"
import { fullPermissions } from "@/lib/rolePermissions"

const DEFAULT_ROLES = [
  {
    name: "Super Admin",
    slug: "super_admin",
    description: "Full platform control across all centers & settings.",
    isSystem: true,
    permissions: fullPermissions(),
  },
  {
    name: "Franchise Owner",
    slug: "franchise_owner",
    description: "Full access to franchise center operations, administration, and staff.",
    isSystem: true,
    permissions: fullPermissions(),
  },
  {
    name: "Center Manager",
    slug: "center_manager",
    description: "Manages center operations, staff, and admissions.",
    isSystem: true,
    permissions: fullPermissions(),
  },
  {
    name: "Academic Head",
    slug: "academic_head",
    description: "Manages class programs, teachers, attendance, and events.",
    isSystem: true,
    permissions: fullPermissions(),
  },
  {
    name: "Finance Manager",
    slug: "finance_manager",
    description: "Handles fee structures, payments, and financial reports.",
    isSystem: true,
    permissions: fullPermissions(),
  },
  {
    name: "Coordinator",
    slug: "coordinator",
    description: "Handles classroom activities, attendance, daily journal, and child care.",
    isSystem: true,
    permissions: fullPermissions(),
  },
]

export async function GET(req: NextRequest) {
  const { error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    let roles = await RoleModel.find({}).sort({ createdAt: 1 })
    
    // Seed default roles if empty
    if (roles.length === 0) {
      roles = await RoleModel.insertMany(DEFAULT_ROLES)
    } else {
      // Ensure "Franchise Owner" role exists in DB
      const hasFranchiseOwner = roles.some(
        (r) => r.name.toLowerCase() === "franchise owner" || r.slug === "franchise_owner"
      )
      if (!hasFranchiseOwner) {
        const foRole = await RoleModel.create({
          name: "Franchise Owner",
          slug: "franchise_owner",
          description: "Full access to franchise center operations, administration, and staff.",
          isSystem: true,
          permissions: fullPermissions(),
        })
        roles.push(foRole)
      }
    }

    const formatted = roles.map((r) => ({
      id: r._id.toString(),
      name: r.name,
      slug: r.slug,
      description: r.description || "",
      isSystem: r.isSystem,
      permissions: r.permissions || {},
    }))

    return NextResponse.json(formatted)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const data = await req.json()

    if (!data.name) {
      return NextResponse.json({ message: "Role name is required." }, { status: 400 })
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
    const newRole = await RoleModel.create({
      name: data.name,
      slug,
      description: data.description || "",
      isSystem: false,
      permissions: data.permissions || {},
    })

    return NextResponse.json({
      id: newRole._id.toString(),
      name: newRole.name,
      slug: newRole.slug,
      description: newRole.description,
      isSystem: newRole.isSystem,
      permissions: newRole.permissions,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
