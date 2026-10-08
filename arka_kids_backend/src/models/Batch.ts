import { Schema, Document, model, models } from "mongoose"

export interface IBatch extends Document {
  code: string
  courseName: string
  trainerName: string
  schedule: string
  enrolled: number
  capacity: number
  centerName: string
  studentNames: string[]
  mode: string
  roomName: string
  status: string
  academicYear: string
  section: string
  classTeacherName: string
  assistantTeacherName?: string
  startTime: string
  endTime: string
  workingDays: string[]
  tenantId: string
  lmsContent?: any
}

const BatchSchema = new Schema<IBatch>(
  {
    code: { type: String, required: true },
    courseName: { type: String },
    trainerName: { type: String },
    schedule: { type: String },
    enrolled: { type: Number, default: 0 },
    capacity: { type: Number },
    centerName: { type: String },
    studentNames: { type: [String], default: [] },
    mode: { type: String },
    roomName: { type: String },
    status: { type: String, default: "active" },
    academicYear: { type: String },
    section: { type: String },
    classTeacherName: { type: String },
    assistantTeacherName: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    workingDays: { type: [String], default: [] },
    tenantId: { type: String, required: true },
    lmsContent: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
)

export const Batch = models.Batch || model<IBatch>("Batch", BatchSchema)
