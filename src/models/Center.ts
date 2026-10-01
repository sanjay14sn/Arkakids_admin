import { Schema, Document, model, models } from "mongoose"

export interface ICenter extends Document {
  name: string
  tenantName: string
  location: string
  manager: string
  email: string
  phone?: string
  status: "active" | "inactive" | "maintenance"
  enabledModules: string[]
  website?: string
  logoUrl?: string
  brandColor?: string
  gstVatNumber?: string
  invoicePrefix?: string
  currency?: string
  paymentGateway?: string
  whatsappAlerts?: boolean
  emailSender?: string
}

const CenterSchema = new Schema<ICenter>(
  {
    name: { type: String, required: true, trim: true },
    tenantName: { type: String, required: true, unique: true, trim: true },
    location: { type: String, required: true },
    manager: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String },
    status: { type: String, enum: ["active", "inactive", "maintenance"], default: "active" },
    enabledModules: { type: [String], default: [] },
    website: { type: String },
    logoUrl: { type: String },
    brandColor: { type: String },
    gstVatNumber: { type: String },
    invoicePrefix: { type: String },
    currency: { type: String, default: "INR" },
    paymentGateway: { type: String },
    whatsappAlerts: { type: Boolean, default: false },
    emailSender: { type: String },
  },
  { timestamps: true }
)

export const Center = models.Center || model<ICenter>("Center", CenterSchema)
