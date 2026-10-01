import { Schema, Document, model, models } from "mongoose"

export interface IStaff extends Document {
  tenantId: string
  name: string
  email: string
  phone: string
  role: "Center Coordinator" | "Lead Educator" | "Assistant Teacher" | "Enquiry Executive" | "Caregiver / Support"
  branch: string
  joiningDate?: string
  qualification?: string
  experience?: string
  address?: string
  languages?: string
  emergencyContact?: string
  photoUrl?: string
  documents?: any[]
  salary?: number
  status: "active" | "on_leave" | "inactive"
  assignedClass?: string
  coordinatorId?: string
  empId?: string
  userId?: string
}

const StaffSchema = new Schema<IStaff>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    role: {
      type: String,
      enum: ["Center Coordinator", "Lead Educator", "Assistant Teacher", "Enquiry Executive", "Caregiver / Support"],
      required: true,
    },
    branch: { type: String, required: true },
    joiningDate: { type: String },
    qualification: { type: String },
    experience: { type: String },
    address: { type: String },
    languages: { type: String },
    emergencyContact: { type: String },
    photoUrl: { type: String },
    documents: { type: Array, default: [] },
    salary: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "on_leave", "inactive"], default: "active" },
    assignedClass: { type: String },
    coordinatorId: { type: String },
    empId: { type: String },
    userId: { type: String },
  },
  { timestamps: true }
)

export const Staff = models.Staff || model<IStaff>("Staff", StaffSchema)
