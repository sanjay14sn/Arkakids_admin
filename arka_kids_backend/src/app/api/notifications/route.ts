import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import connectDB from "@/lib/mongodb"
import { Notification } from "@/models/index"
import { Batch } from "@/models/Batch"
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"
import { ALL_BATCHES_ID, batchId, batchLabel, parseNoticeDate } from "@/lib/schoolNotices"
import { listSchoolNoticesForUser } from "@/lib/listSchoolNotices"

const STAFF_ROLES = new Set(["super_admin", "owner", "coordinator", "trainer", "bde"])

function serialize(doc: any) {
  const n = typeof doc.toObject === "function" ? doc.toObject() : doc
  return {
    ...n,
    id: String(n._id),
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const schoolOnly = new URL(req.url).searchParams.get("school") === "1"

    if (user.role === "student" || schoolOnly) {
      const notices = await listSchoolNoticesForUser(user)
      return NextResponse.json(notices)
    }

    const notifications = await Notification.find({ ...tenantFilter(user) })
      .sort({ createdAt: -1 })
      .limit(100)
    return NextResponse.json(notifications.map(serialize))
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  if (!STAFF_ROLES.has(user.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }
  try {
    await connectDB()
    const data = await req.json()
    const title = String(data.title || "").trim()
    const description = String(data.description || data.message || "").trim()
    if (!title || !description) {
      return NextResponse.json({ message: "Title and message are required" }, { status: 400 })
    }

    const isSchoolNotice = Boolean(data.isSchoolNotice)
    let targetBatchIds: string[] = Array.isArray(data.targetBatchIds)
      ? data.targetBatchIds.map(String)
      : []
    let targetBatchNames: string[] = Array.isArray(data.targetBatchNames)
      ? data.targetBatchNames.map(String)
      : []

    if (isSchoolNotice) {
      if (targetBatchIds.length === 0 || targetBatchIds.includes(ALL_BATCHES_ID)) {
        targetBatchIds = [ALL_BATCHES_ID]
        targetBatchNames = ["All batches"]
      } else {
        const validIds = targetBatchIds.filter((id) => mongoose.isValidObjectId(id))
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

    const notification = await Notification.create({
      title,
      description,
      type: data.type || (isSchoolNotice ? "info" : "system"),
      targetRoles: isSchoolNotice ? ["student"] : data.targetRoles || [],
      targetUserId: data.targetUserId,
      link: data.link,
      isSchoolNotice,
      targetBatchIds,
      targetBatchNames,
      noticeDate: parseNoticeDate(data.noticeDate),
      createdBy: user.name,
      tenantId: user.tenantId,
    })
    return NextResponse.json(serialize(notification), { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
