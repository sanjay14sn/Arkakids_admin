import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { CampaignTemplate } from "@/models/index"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"
import { BUILTIN_TEMPLATES } from "@/lib/campaigns"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const custom = await CampaignTemplate.find(tenantFilter(user)).sort({ createdAt: -1 })
    const saved = custom.map((item) => {
      const obj = item.toObject()
      const id = String(obj._id)
      return { ...obj, id, _id: id }
    })
    return NextResponse.json([...BUILTIN_TEMPLATES, ...saved])
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
    const item = await CampaignTemplate.create({
      tenantId: user.tenantId || data.tenantId,
      name: data.name,
      category: data.category || "General",
      subject: data.subject || "",
      body: data.body || "",
    })
    const obj = item.toObject()
    const id = String(obj._id)
    return NextResponse.json({ ...obj, id, _id: id }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
