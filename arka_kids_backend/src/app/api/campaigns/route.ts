import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Campaign } from "@/models/index"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"
import { campaignPayload, estimateAudience, serializeCampaign } from "@/lib/campaigns"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const items = await Campaign.find(tenantFilter(user)).sort({ createdAt: -1 })
    return NextResponse.json(items.map(serializeCampaign))
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
    const payload = campaignPayload(data, user)
    if (!payload.title) {
      return NextResponse.json({ message: "Campaign name is required" }, { status: 400 })
    }
    if (payload.recipientCount == null && payload.audience) {
      payload.recipientCount = await estimateAudience(user, payload.audience)
    }
    const item = await Campaign.create(payload)
    return NextResponse.json(serializeCampaign(item), { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
