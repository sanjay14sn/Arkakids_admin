import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Campaign } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"
import { campaignPayload, isCampaignObjectId, serializeCampaign } from "@/lib/campaigns"

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { user, error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  if (!isCampaignObjectId(id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }
  try {
    await connectDB()
    const original = await Campaign.findById(id)
    if (!original) return NextResponse.json({ message: "Not found" }, { status: 404 })
    const src = serializeCampaign(original)
    const copy = await Campaign.create(
      campaignPayload(
        {
          ...src,
          name: `${src.name} (Copy)`,
          status: "Draft",
          sentAt: undefined,
          scheduledAt: undefined,
        },
        user
      )
    )
    return NextResponse.json(serializeCampaign(copy), { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
