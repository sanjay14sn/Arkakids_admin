import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Staff } from "@/models/Staff"
import { requireAuth } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    const s = await Staff.findById(id)
    if (!s) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(s)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    const data = await req.json()
    
    // Check for duplicate email (excluding self)
    if (data.email) {
      const existingEmail = await Staff.findOne({ _id: { $ne: id }, email: data.email.toLowerCase().trim() })
      if (existingEmail) {
        return NextResponse.json({ message: "Another staff member with this email address already exists in the system." }, { status: 400 })
      }
    }
    
    // Check for duplicate phone (excluding self)
    if (data.phone) {
      const existingPhone = await Staff.findOne({ _id: { $ne: id }, phone: data.phone.trim() })
      if (existingPhone) {
        return NextResponse.json({ message: "Another staff member with this mobile number already exists in the system." }, { status: 400 })
      }
    }

    const s = await Staff.findByIdAndUpdate(id, data, { new: true })
    if (!s) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(s)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    await Staff.findByIdAndDelete(id)
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
