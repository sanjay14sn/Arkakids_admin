import mongoose, { Document, Model, Schema } from "mongoose"

export interface IChildLeave extends Document {
  childId: string
  childName?: string
  batchId?: string
  tenantId: string
  fromDate: string
  toDate: string
  reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  requestedBy: string
  decidedBy?: string
  createdAt: string
  updatedAt: string
}

const ChildLeaveSchema = new Schema<IChildLeave>(
  {
    childId: { type: String, required: true },
    childName: { type: String },
    batchId: { type: String },
    tenantId: { type: String, required: true, index: true },
    fromDate: { type: String, required: true },
    toDate: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
    requestedBy: { type: String, required: true },
    decidedBy: { type: String },
  },
  { timestamps: true }
)

export const ChildLeave: Model<IChildLeave> =
  mongoose.models.ChildLeave || mongoose.model<IChildLeave>("ChildLeave", ChildLeaveSchema)

const leaveStatusPath = ChildLeave.schema.path("status") as any
if (leaveStatusPath && Array.isArray(leaveStatusPath.enumValues) && !leaveStatusPath.enumValues.includes("cancelled")) {
  leaveStatusPath.enumValues.push("cancelled")
}
