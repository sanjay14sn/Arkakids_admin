import { Schema, Document, model, models } from "mongoose"

export interface IStudent extends Document {
  tenantId: string
  name: string
  email?: string
  phone?: string
  parentName?: string
  parentEmail?: string
  parentPhone?: string
  dateOfBirth?: string
  address?: string
  classId?: string
  className?: string
  section?: string
  parentRelation?: string
  academicYear?: string
  emergencyContact?: string
  pickupPerson?: string
  prevSchool?: string
  transport?: string
  status: "active" | "inactive" | "graduated" | "transferred"
  admissionDate?: string
  rollNumber?: string
  gender?: "male" | "female" | "other"
  fees: {
    feesPaid: number
    feesTotal: number
    nextDueDate?: string | null
    installmentsCount?: number
    installmentSchedule?: Array<{ amount: number; dueDate: string; label?: string; paid?: boolean }>
    scholarshipAmount?: number
    scholarshipNotes?: string
  }
  photoUrl?: string
  bloodGroup?: string
  allergies?: string
  medicalNotes?: string
}

const StudentSchema = new Schema<IStudent>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String },
    parentName: { type: String },
    parentEmail: { type: String, lowercase: true },
    parentPhone: { type: String },
    dateOfBirth: { type: String },
    address: { type: String },
    classId: { type: String },
    className: { type: String },
    section: { type: String },
    parentRelation: { type: String },
    academicYear: { type: String },
    emergencyContact: { type: String },
    pickupPerson: { type: String },
    prevSchool: { type: String },
    transport: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "transferred"],
      default: "active",
    },
    admissionDate: { type: String },
    rollNumber: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    fees: {
      feesPaid: { type: Number, default: 0 },
      feesTotal: { type: Number, default: 0 },
      nextDueDate: { type: String, default: null },
      installmentsCount: { type: Number, default: 1 },
      installmentSchedule: {
        type: [
          {
            amount: Number,
            dueDate: String,
            label: String,
            paid: { type: Boolean, default: false },
          },
        ],
        default: [],
      },
      scholarshipAmount: { type: Number, default: 0 },
      scholarshipNotes: { type: String },
    },
    photoUrl: { type: String },
    bloodGroup: { type: String },
    allergies: { type: String },
    medicalNotes: { type: String },
  },
  { timestamps: true }
)

export const Student = models.Student || model<IStudent>("Student", StudentSchema)
