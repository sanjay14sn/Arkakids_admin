import { Schema, Document, model, models } from "mongoose"

export interface IPanelAssociate extends Document {
  tenantId?: string
  profileImage?: string
  name: string
  mobileNumber: string
  email: string
  department?: string
  status: "active" | "inactive"
}

const PanelAssociateSchema = new Schema<IPanelAssociate>(
  {
    tenantId: { type: String, index: true },
    profileImage: { type: String },
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    department: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
)

export const PanelAssociate =
  models.PanelAssociate || model<IPanelAssociate>("PanelAssociate", PanelAssociateSchema)
