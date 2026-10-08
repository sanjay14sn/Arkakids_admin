import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { PanelAssociate } from "@/models/PanelAssociate"
import { requireAuth } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const list = await PanelAssociate.find({}).sort({ createdAt: -1 })
    return NextResponse.json(list)
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

    if (!data.name || !data.email || !data.mobileNumber) {
      return NextResponse.json({ message: "Name, email, and mobile number are required." }, { status: 400 })
    }

    const created = await PanelAssociate.create(data)
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
