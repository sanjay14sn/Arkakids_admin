import { Schema, Document, model, models } from "mongoose"

export interface ILead extends Document {
  tenantId: string
  name: string
  email: string
  phone: string
  course?: string
  stage: "new" | "contacted" | "interested" | "demo_scheduled" | "follow_up" | "requested_as_student" | "converted" | "lost"
  counsellor?: string
  assignedBdeId?: string
  value?: number
  notes?: Array<{ id: string; text: string; date: string }>
  city?: string
  source?: string
  priority?: "low" | "medium" | "high"
  nextFollowUpDate?: string
  childName?: string
  dateOfBirth?: string
  parentName?: string
  address?: string
  preferredBranch?: string
  suggestedProgram?: string
  session?: "morning" | "afternoon"
  siblingInSchool?: boolean
}

const LeadSchema = new Schema<ILead>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true },
    course: { type: String },
    stage: {
      type: String,
      enum: ["new", "contacted", "interested", "demo_scheduled", "follow_up", "requested_as_student", "converted", "lost"],
      default: "new",
    },
    counsellor: { type: String },
    assignedBdeId: { type: String },
    value: { type: Number, default: 0 },
    notes: {
      type: [{ id: String, text: String, date: String }],
      default: [],
    },
    city: { type: String },
    source: { type: String },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    nextFollowUpDate: { type: String },
    childName: { type: String },
    dateOfBirth: { type: String },
    parentName: { type: String },
    address: { type: String },
    preferredBranch: { type: String },
    suggestedProgram: { type: String },
    session: { type: String, enum: ["morning", "afternoon"] },
    siblingInSchool: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Lead = models.Lead || model<ILead>("Lead", LeadSchema)
