import { Schema, Document, model, models } from "mongoose"

export interface IAttendance extends Document {
  tenantId: string
  date: string
  type: "student" | "staff" | "bde"
  className?: string
  batchId?: string
  submitted?: boolean
  submittedBy?: string
  submittedAt?: string
  records: Array<{
    entityId: string
    name: string
    status: "present" | "absent" | "late" | "leave" | "half_day"
    note?: string
    absenceReason?: string
    parentInformed?: boolean
    arrivalTime?: string
  }>
  finalized?: boolean
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    tenantId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    type: { type: String, enum: ["student", "staff", "bde"], required: true },
    className: { type: String },
    batchId: { type: String },
    submitted: { type: Boolean, default: false },
    submittedBy: { type: String },
    submittedAt: { type: String },
    records: {
      type: [
        {
          entityId: { type: String, required: true },
          name: { type: String, required: true },
          status: {
            type: String,
            enum: ["present", "absent", "late", "leave", "half_day"],
            required: true,
          },
          note: { type: String },
          absenceReason: { type: String },
          parentInformed: { type: Boolean },
          arrivalTime: { type: String },
        },
      ],
      default: [],
    },
    finalized: { type: Boolean, default: false },
  },
  { timestamps: true }
)

AttendanceSchema.index({ tenantId: 1, date: 1, type: 1, className: 1 }, { unique: true })

export const Attendance = models.Attendance || model<IAttendance>("Attendance", AttendanceSchema)
