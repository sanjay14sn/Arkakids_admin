import { Campaign } from "@/models/index"
import { Student } from "@/models/Student"
import { Lead } from "@/models/Lead"
import { Staff } from "@/models/Staff"
import { tenantFilter, type JwtPayload } from "@/lib/authMiddleware"

export type UiCampaignStatus = "Draft" | "Scheduled" | "Active" | "Completed"

export const BUILTIN_TEMPLATES = [
  {
    id: "tpl-admission",
    name: "Admission Follow-up",
    category: "Admissions",
    subject: "Following up on your enquiry at Arka Kids",
    body: "Dear {{name}},\n\nThank you for your interest in Arka Kids. We would love to help you find the right program for your child.\n\nPlease reply to this email or visit the centre to continue the admission process.\n\nWarm regards,\nArka Kids",
  },
  {
    id: "tpl-fee",
    name: "Fee Reminder",
    category: "Fees",
    subject: "Friendly reminder: fee payment due",
    body: "Dear {{name}},\n\nThis is a reminder that a fee payment is due for {{child}}.\n\nPlease complete the payment at your earliest convenience. If you have already paid, please ignore this message.\n\nThank you,\nArka Kids",
  },
  {
    id: "tpl-welcome",
    name: "Welcome Parents",
    category: "Onboarding",
    subject: "Welcome to the Arka Kids family",
    body: "Dear {{name}},\n\nWelcome to Arka Kids! We are delighted to have {{child}} with us.\n\nYou will receive class updates, journals, and notices through this portal.\n\nWarmly,\nThe Arka Kids Team",
  },
  {
    id: "tpl-event",
    name: "Event Invitation",
    category: "Events",
    subject: "You're invited: upcoming event at Arka Kids",
    body: "Dear {{name}},\n\nYou are invited to an upcoming event at our centre. We would love for you and your child to join us.\n\nDetails will follow shortly. Please save the date.\n\nSee you there,\nArka Kids",
  },
]

export function isCampaignObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id)
}

export function toUiStatus(status?: string): UiCampaignStatus {
  const value = (status || "").toLowerCase()
  if (value === "scheduled") return "Scheduled"
  if (value === "active" || value === "sent") return "Active"
  if (value === "completed" || value === "cancelled") return "Completed"
  return "Draft"
}

export function serializeCampaign(doc: any) {
  const obj = typeof doc?.toObject === "function" ? doc.toObject() : { ...doc }
  const id = String(obj._id || obj.id || "")
  const name = obj.name || obj.title || "Untitled campaign"
  const channel = obj.channel || obj.type || "Email"
  const body = obj.body || obj.message || ""
  return {
    id,
    _id: id,
    tenantId: obj.tenantId,
    name,
    title: name,
    channel,
    type: channel,
    status: toUiStatus(obj.status),
    audience: obj.audience || "",
    subject: obj.subject || "",
    body,
    message: body,
    recipientCount: Number(obj.recipientCount || 0),
    openRate: Number(obj.openRate || 0),
    clickRate: Number(obj.clickRate || 0),
    scheduledAt: obj.scheduledAt,
    sentAt: obj.sentAt,
    createdBy: obj.createdBy,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  }
}

export function campaignPayload(data: Record<string, any>, user: JwtPayload) {
  const name = String(data.name || data.title || "").trim()
  const channel = data.channel || data.type || "Email"
  const status = toUiStatus(data.status)
  const body = data.body ?? data.message ?? ""
  return {
    tenantId: user.tenantId || data.tenantId,
    name,
    title: name,
    channel,
    type: channel,
    audience: data.audience,
    status,
    subject: data.subject || "",
    body,
    message: body,
    scheduledAt: data.scheduledAt,
    sentAt: status === "Active" ? data.sentAt || new Date().toISOString() : data.sentAt,
    createdBy: data.createdBy || user.id,
    recipientCount: data.recipientCount,
    openRate: data.openRate,
    clickRate: data.clickRate,
  }
}

export async function estimateAudience(user: JwtPayload, audience: string) {
  const tf = tenantFilter(user)
  switch (audience) {
    case "all_leads":
      return Lead.countDocuments({ ...tf, stage: { $nin: ["converted", "lost"] } })
    case "all_students":
      return Student.countDocuments(tf)
    case "active_students":
      return Student.countDocuments({ ...tf, status: "active" })
    case "defaulters":
      return Student.countDocuments({
        ...tf,
        $expr: { $lt: ["$fees.feesPaid", "$fees.feesTotal"] },
      })
    case "trainers":
      return Staff.countDocuments({
        ...tf,
        role: { $in: ["Lead Educator", "Assistant Teacher"] },
      })
    default:
      return 0
  }
}

export async function campaignStats(user: JwtPayload) {
  const items = await Campaign.find(tenantFilter(user))
  const serialized = items.map(serializeCampaign)
  const reached = serialized.filter((c) => c.status === "Active" || c.status === "Completed")
  const withOpen = serialized.filter((c) => c.openRate > 0)
  return {
    totalCampaigns: serialized.length,
    totalReached: reached.reduce((sum, c) => sum + c.recipientCount, 0),
    avgOpenRate: withOpen.length
      ? Math.round(withOpen.reduce((sum, c) => sum + c.openRate, 0) / withOpen.length)
      : 0,
    scheduled: serialized.filter((c) => c.status === "Scheduled").length,
  }
}
