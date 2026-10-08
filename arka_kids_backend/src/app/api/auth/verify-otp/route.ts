import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Student } from "@/models/Student"
import { signToken } from "@/lib/authMiddleware"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { mobile, otp } = await req.json()

    if (!mobile || !otp) {
      return NextResponse.json({ message: "Mobile number and OTP are required" }, { status: 400 })
    }

    if (otp !== "123456") {
      return NextResponse.json({ message: "Invalid OTP. Please use 123456" }, { status: 400 })
    }

    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10)
    console.log("Verifying mobile:", mobile, "Clean:", cleanMobile)

    const student = await Student.findOne({
      $or: [
        { phone: { $regex: cleanMobile } },
        { parentPhone: { $regex: cleanMobile } },
      ],
    })

    console.log("Verify found student:", student ? student._id : "None")

    if (!student) {
      return NextResponse.json({ message: "Student not found for this number" }, { status: 404 })
    }

    // Verify OTP logic (dummy for now)
    
    // Create token with role 'student' (parent portal role)
    const token = signToken({
      id: student._id.toString(),
      email: student.parentEmail || student.email || `${cleanMobile}@arkakids.com`,
      role: "student",
      tenantId: student.tenantId,
      name: student.parentName || student.name,
    })

    // Return the response format expected by the frontend
    return NextResponse.json({
      token,
      user: {
        id: student._id.toString(),
        name: student.parentName || student.name,
        email: student.parentEmail || student.email,
        role: "student",
        tenantId: student.tenantId,
        avatar: student.photoUrl,
        childName: student.name,
        className: student.className || "",
        rollNumber: student.rollNumber || (student as any).rollNo || (student as any).studentCode || "",
        centerName: "Arka Kids", // Could fetch tenant details if needed
      },
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Failed to verify OTP" }, { status: 500 })
  }
}
