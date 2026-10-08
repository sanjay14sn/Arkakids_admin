import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { AdminUser } from "@/models/AdminUser"
import { User } from "@/models/User"
import { requireAuth } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const users = await AdminUser.find({}).sort({ createdAt: -1 })
    return NextResponse.json(users)
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

    if (!data.name || !data.email || !data.mobileNumber || !data.pin || !data.role) {
      return NextResponse.json({ message: "Name, email, mobile number, 4-digit PIN, and role are required." }, { status: 400 })
    }

    if (!/^\d{4}$/.test(String(data.pin))) {
      return NextResponse.json({ message: "PIN must be exactly 4 digits (numbers only)." }, { status: 400 })
    }

    const emailClean = data.email.toLowerCase().trim()

    // 1. Create or update AdminUser
    const newUser = await AdminUser.create({
      ...data,
      email: emailClean,
    })

    // 2. Map role for User model
    let mappedRole = "trainer"
    const rLower = String(data.role).toLowerCase()
    if (rLower.includes("super_admin") || rLower.includes("super admin")) {
      mappedRole = "super_admin"
    } else if (rLower.includes("owner") || rLower.includes("manager")) {
      mappedRole = "owner"
    } else if (rLower.includes("student") || rLower.includes("parent")) {
      mappedRole = "student"
    } else if (rLower.includes("bde")) {
      mappedRole = "bde"
    } else {
      mappedRole = "trainer" // Coordinator
    }

    // 3. Upsert into User model for login compatibility
    try {
      const existingUser = await User.findOne({ email: emailClean })
      if (existingUser) {
        existingUser.name = data.name
        existingUser.password = data.pin
        existingUser.role = mappedRole as any
        if (data.profileImage) existingUser.avatar = data.profileImage
        await existingUser.save()
      } else {
        await User.create({
          name: data.name,
          email: emailClean,
          password: data.pin,
          role: mappedRole,
          avatar: data.profileImage,
        })
      }
    } catch (userSyncErr) {
      console.warn("User sync warning:", userSyncErr)
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
