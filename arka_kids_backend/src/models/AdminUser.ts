import { Schema, Document, model, models } from "mongoose"

export interface IAdminUser extends Document {
  tenantId?: string
  profileImage?: string
  name: string
  mobileNumber: string
  email: string
  pin: string
  role: string
  status: "active" | "inactive"
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    tenantId: { type: String, index: true },
    profileImage: { type: String },
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    pin: { type: String, required: true, minlength: 4, maxlength: 4 },
    role: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
)

export const AdminUser = models.AdminUser || model<IAdminUser>("AdminUser", AdminUserSchema)
