import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import connectDB from "@/lib/mongodb"
import { Notification } from "@/models/index"
import { Batch } from "@/models/Batch"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"
import { ALL_BATCHES_ID, batchId, batchLabel, parseNoticeDate } from "@/lib/schoolNotices"

type Params = { params: Promise<{ id: string }> }

const STAFF_ROLES = new Set(["super_admin", "owner", "coordinator", "trainer", "bde"])

function serialize(doc: any) {
  const n = typeof doc.toObject === "function" ? doc.toObject() : doc
  return {
    ...n,
    id: String(n._id),
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { user, error } = requireAuth(req)
  if (error) return error
  if (!STAFF_ROLES.has(user.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  try {
    await connectDB()
    const existing = await Notification.findOne({ _id: id, ...tenantFilter(user) })
    if (!existing) {
      return NextResponse.json({ message: "Notice not found" }, { status: 404 })
    }

    const data = await req.json()
    const title = String(data.title ?? existing.title).trim()
    const description = String(data.description ?? data.message ?? existing.description).trim()
    if (!title || !description) {
      return NextResponse.json({ message: "Title and message are required" }, { status: 400 })
    }

    let targetBatchIds: string[] = Array.isArray(data.targetBatchIds)
      ? data.targetBatchIds.map(String)
      : existing.targetBatchIds || []
    let targetBatchNames: string[] = Array.isArray(data.targetBatchNames)
      ? data.targetBatchNames.map(String)
      : existing.targetBatchNames || []

    if (existing.isSchoolNotice || data.isSchoolNotice) {
      if (targetBatchIds.length === 0 || targetBatchIds.includes(ALL_BATCHES_ID)) {
        targetBatchIds = [ALL_BATCHES_ID]
        targetBatchNames = ["All batches"]
      } else {
        const validIds = targetBatchIds.filter((batch) => mongoose.isValidObjectId(batch))
        const batches = await Batch.find({
          ...tenantFilter(user),
          _id: { $in: validIds },
        })
        targetBatchIds = batches.map((b) => batchId(b))
        targetBatchNames = batches.map((b) => batchLabel(b))
        if (targetBatchIds.length === 0) {
          return NextResponse.json({ message: "Selected batch was not found" }, { status: 400 })
        }
      }
    }

    existing.title = title
    existing.description = description
    if (data.type) existing.type = data.type
    existing.targetBatchIds = targetBatchIds
    existing.targetBatchNames = targetBatchNames
    existing.noticeDate = parseNoticeDate(data.noticeDate ?? existing.noticeDate ?? existing.createdAt)
    await existing.save()
    return NextResponse.json(serialize(existing))
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { user, error } = requireAuth(req)
  if (error) return error
  if (!STAFF_ROLES.has(user.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }
  const { id } = await params
  try {
    await connectDB()
    const deleted = await Notification.findOneAndDelete({ _id: id, ...tenantFilter(user) })
    if (!deleted) {
      return NextResponse.json({ message: "Notice not found" }, { status: 404 })
    }
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
