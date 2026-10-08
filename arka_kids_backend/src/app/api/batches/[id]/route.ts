import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Batch } from "@/models/Batch"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const batch = await Batch.findOne({ _id: params.id, ...tenantFilter(user) })
    if (!batch) return NextResponse.json({ message: "Batch not found" }, { status: 404 })
    return NextResponse.json(batch)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const data = await req.json()
    const batch = await Batch.findOneAndUpdate(
      { _id: params.id, ...tenantFilter(user) },
      data,
      { new: true }
    )
    if (!batch) return NextResponse.json({ message: "Batch not found" }, { status: 404 })
    return NextResponse.json(batch)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const data = await req.json()
    const batch = await Batch.findOneAndUpdate(
      { _id: params.id, ...tenantFilter(user) },
      { $set: data },
      { new: true }
    )
    if (!batch) return NextResponse.json({ message: "Batch not found" }, { status: 404 })
    return NextResponse.json(batch)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { user, error } = requireAuth(req)
  if (error) return error

  try {
    await connectDB()
    const batch = await Batch.findOneAndDelete({ _id: params.id, ...tenantFilter(user) })
    if (!batch) return NextResponse.json({ message: "Batch not found" }, { status: 404 })
    return NextResponse.json({ message: "Deleted successfully" })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
