import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { RoleModel } from "@/models/Role"
import { requireAuth } from "@/lib/authMiddleware"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    await connectDB()
    const data = await req.json()

    const updateFields: any = {}
    if (data.name) {
      updateFields.name = data.name.trim()
      updateFields.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
    }
    if (data.description !== undefined) {
      updateFields.description = data.description
    }
    if (data.permissions) {
      updateFields.permissions = data.permissions
    }

    const updated = await RoleModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    )

    if (!updated) return NextResponse.json({ message: "Role not found" }, { status: 404 })

    return NextResponse.json({
      id: updated._id.toString(),
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      isSystem: updated.isSystem,
      permissions: updated.permissions,
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    await connectDB()

    const role = await RoleModel.findById(id)
    if (!role) return NextResponse.json({ message: "Role not found" }, { status: 404 })

    if (role.isSystem) {
      return NextResponse.json({ message: "Built-in roles cannot be deleted." }, { status: 400 })
    }

    await RoleModel.findByIdAndDelete(id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Duplicate role action if requested via /api/roles/[id]/duplicate or /api/roles/[id] with action
  const { error } = requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    await connectDB()

    const source = await RoleModel.findById(id)
    if (!source) return NextResponse.json({ message: "Source role not found" }, { status: 404 })

    const copyName = `${source.name} (Copy)`
    const copySlug = copyName.toLowerCase().replace(/[^a-z0-9]+/g, "_")

    const duplicated = await RoleModel.create({
      name: copyName,
      slug: copySlug,
      description: source.description,
      isSystem: false,
      permissions: source.permissions || {},
    })

    return NextResponse.json({
      id: duplicated._id.toString(),
      name: duplicated.name,
      slug: duplicated.slug,
      description: duplicated.description,
      isSystem: duplicated.isSystem,
      permissions: duplicated.permissions,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
