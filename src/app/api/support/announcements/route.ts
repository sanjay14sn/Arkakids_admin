import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Returning an empty array for announcements to resolve the 404
    return NextResponse.json([])
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
