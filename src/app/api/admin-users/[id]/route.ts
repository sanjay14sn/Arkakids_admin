import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { AdminUser } from "@/models/AdminUser"
import { User } from "@/models/User"
import { requireAuth } from "@/lib/authMiddleware"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    await connectDB()
    const data = await req.json()

    if (data.pin && !/^\d{4}$/.test(String(data.pin))) {
      return NextResponse.json({ message: "PIN must be exactly 4 digits (numbers only)." }, { status: 400 })
    }

    const updated = await AdminUser.findByIdAndUpdate(id, data, { new: true })
    if (!updated) return NextResponse.json({ message: "Admin user not found" }, { status: 404 })

    // Sync with User model
    try {
      const u = await User.findOne({ email: updated.email.toLowerCase() })
      if (u) {
        if (data.name) u.name = data.name
        if (data.pin) u.password = data.pin
        if (data.profileImage) u.avatar = data.profileImage
        await u.save()
      }
    } catch (syncErr) {
      console.warn("User sync error:", syncErr)
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    await connectDB()
    const deleted = await AdminUser.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ message: "Admin user not found" }, { status: 404 })

    // Sync deletion
    try {
      await User.findOneAndDelete({ email: deleted.email.toLowerCase() })
    } catch (syncErr) {
      console.warn("User delete sync error:", syncErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
