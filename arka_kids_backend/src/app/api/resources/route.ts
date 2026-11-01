import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Resource } from "@/models/Resource"
import { requireAuth } from "@/lib/authMiddleware"

const MANAGER_ROLES = ["super_admin", "owner"]

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const kind = req.nextUrl.searchParams.get("kind")
    const filter: Record<string, unknown> = {}
    if (kind === "material" || kind === "video") filter.kind = kind

    if (user.role !== "super_admin") {
      // Franchise users see Super Admin's global resources + their own centre's uploads
      filter.tenantId = { $in: ["global", user.tenantId].filter(Boolean) }
      if (user.role !== "owner") filter.audience = user.role
    }

    const resources = await Resource.find(filter).sort({ createdAt: -1 })
    return NextResponse.json(resources)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  if (!MANAGER_ROLES.includes(user.role)) {
    return NextResponse.json({ message: "Only Super Admin or franchise owners can upload resources." }, { status: 403 })
  }

  try {
    await connectDB()
    const data = await req.json()
    if (!data.title || !data.url || !data.kind) {
      return NextResponse.json({ message: "Title, kind and file/URL are required." }, { status: 400 })
    }
    const resource = await Resource.create({
      ...data,
      tenantId: user.role === "super_admin" ? data.tenantId || "global" : user.tenantId,
      uploadedBy: user.id,
      uploadedByName: user.name,
    })
    return NextResponse.json(resource, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
