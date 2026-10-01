import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Lead } from "@/models/Lead"
import { requireAuth } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

// PUT /api/bde/leads/[id]/stage
export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    const { stage } = await req.json()
    const lead = await Lead.findByIdAndUpdate(id, { stage }, { new: true })
    if (!lead) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(lead)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
