import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Student } from "@/models/Student"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { mobile } = await req.json()

    if (!mobile) {
      return NextResponse.json({ message: "Mobile number is required" }, { status: 400 })
    }

    // Check if the number belongs to any student (parent phone or student phone)
    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10) // match last 10 digits
    console.log("Checking mobile:", mobile, "Clean:", cleanMobile)

    const student = await Student.findOne({
      $or: [
        { phone: { $regex: cleanMobile } },
        { parentPhone: { $regex: cleanMobile } },
      ],
    })

    console.log("Found student:", student ? student._id : "None")

    if (!student) {
      return NextResponse.json({ exists: false, message: "Number not registered" }, { status: 404 })
    }

    return NextResponse.json({ exists: true })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Failed to check mobile" }, { status: 500 })
  }
}
