import { Schema, Document, model, models } from "mongoose"

export interface ICourse extends Document {
  name: string
  code: string
  duration: string
  fees: number
  ageFrom: number
  ageTo: number
  ageGroup: string
  description: string
  startTime: string
  endTime: string
  capacity: number
  status: "active" | "inactive"
  tenantId: string
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    duration: { type: String },
    fees: { type: Number, default: 0 },
    ageFrom: { type: Number },
    ageTo: { type: Number },
    ageGroup: { type: String },
    description: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    capacity: { type: Number },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    tenantId: { type: String, required: true },
  },
  { timestamps: true }
)

export const Course = models.Course || model<ICourse>("Course", CourseSchema)
