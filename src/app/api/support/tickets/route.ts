import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { SupportTicket } from "@/models/index"
import { requireAuth } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const filter = user.role === "super_admin" ? {} : { tenantId: user.tenantId }
    const tickets = await SupportTicket.find(filter).sort({ createdAt: -1 })
    return NextResponse.json(tickets)
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
    const ticket = await SupportTicket.create({
      ...data,
      tenantId: user.tenantId,
      createdBy: user.name,
    })
    return NextResponse.json(ticket, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
