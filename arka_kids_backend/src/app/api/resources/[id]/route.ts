import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Resource } from "@/models/Resource"
import { requireAuth } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

async function loadEditable(req: NextRequest, id: string) {
  const { user, error } = requireAuth(req)
  if (error) return { error }
  await connectDB()
  const resource = await Resource.findById(id)
  if (!resource) return { error: NextResponse.json({ message: "Resource not found" }, { status: 404 }) }
  const canEdit =
    user.role === "super_admin" || (user.role === "owner" && resource.tenantId === user.tenantId)
  if (!canEdit) return { error: NextResponse.json({ message: "Not allowed" }, { status: 403 }) }
  return { resource }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const { resource, error } = await loadEditable(req, id)
    if (error) return error
    const data = await req.json()
    delete data.tenantId
    delete data.uploadedBy
    Object.assign(resource, data)
    await resource.save()
    return NextResponse.json(resource)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const { error } = await loadEditable(req, id)
    if (error) return error
    await Resource.findByIdAndDelete(id)
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
