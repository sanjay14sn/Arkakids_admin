import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Campaign } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"
import { campaignPayload, estimateAudience, isCampaignObjectId, serializeCampaign } from "@/lib/campaigns"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  if (!isCampaignObjectId(id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  try {
    await connectDB()
    const item = await Campaign.findById(id)
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(serializeCampaign(item))
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { user, error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  if (!isCampaignObjectId(id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  try {
    await connectDB()
    const existing = await Campaign.findById(id)
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 })
    const data = await req.json()
    const payload = campaignPayload({ ...serializeCampaign(existing), ...data }, user)
    if (payload.status === "Active" && !payload.recipientCount && payload.audience) {
      payload.recipientCount = await estimateAudience(user, payload.audience)
    }
    const item = await Campaign.findByIdAndUpdate(id, payload, { new: true })
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(serializeCampaign(item))
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  if (!isCampaignObjectId(id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  try {
    await connectDB()
    await Campaign.findByIdAndDelete(id)
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
