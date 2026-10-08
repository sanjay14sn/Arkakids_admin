import { Schema, Document, model, models } from "mongoose"

// ─── Homework ────────────────────────────────────────────────────────────────
export interface IHomework extends Document {
  tenantId: string
  title: string
  description?: string
  subject?: string
  className?: string
  dueDate?: string
  attachmentUrl?: string
  createdBy?: string
  submissions?: Array<{ studentId: string; studentName: string; submittedAt: string; fileUrl?: string }>
  batch?: string
  activity?: string
  instructions?: string
  assignedDate?: string
  visibility?: "immediate" | "scheduled"
  visibleFrom?: string
  status?: "active" | "completed"
  submittable?: boolean
  attachment?: {
    name: string
    kind: string
    src?: string
  }
}

const HomeworkSchema = new Schema<IHomework>(
  {
    tenantId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String },
    className: { type: String },
    dueDate: { type: String },
    attachmentUrl: { type: String },
    createdBy: { type: String },
    submissions: {
      type: [{ studentId: String, studentName: String, submittedAt: String, fileUrl: String }],
      default: [],
    },
    batch: { type: String },
    activity: { type: String },
    instructions: { type: String },
    assignedDate: { type: String },
    visibility: { type: String, enum: ["immediate", "scheduled"], default: "immediate" },
    visibleFrom: { type: String },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    submittable: { type: Boolean, default: false },
    attachment: {
      type: {
        name: String,
        kind: String,
        src: String
      },
      default: undefined
    }
  },
  { timestamps: true }
)

export const Homework = models.Homework || model<IHomework>("Homework", HomeworkSchema)
if (!Homework.schema.path("submittable")) {
  Homework.schema.add({ submittable: { type: Boolean, default: false } })
}

// ─── Journal ─────────────────────────────────────────────────────────────────
export interface IJournal extends Document {
  tenantId: string
  date: string
  title?: string
  content?: string
  photos?: string[]
  className?: string
  postedBy?: string
  tags?: string[]
  media?: Array<{ id?: string; kind?: string; label?: string; src?: string; tone?: string }>
  branch?: string
  reactions?: Array<{ userId: string; emoji: string }>
}

const JournalSchema = new Schema<IJournal>(
  {
    tenantId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    title: { type: String },
    content: { type: String },
    photos: { type: [String], default: [] },
    className: { type: String },
    postedBy: { type: String },
    tags: { type: [String], default: [] },
    media: { type: [Schema.Types.Mixed], default: [] },
    branch: { type: String },
    reactions: { type: [{ userId: String, emoji: String }], default: [] },
  },
  { timestamps: true }
)

export const Journal = models.Journal || model<IJournal>("Journal", JournalSchema)

// ─── Absence (Child Leave) ────────────────────────────────────────────────────
export interface IAbsence extends Document {
  tenantId: string
  studentId: string
  studentName: string
  startDate: string
  endDate?: string
  reason?: string
  status: "pending" | "approved" | "rejected"
  notes?: string
  approvedBy?: string
}

const AbsenceSchema = new Schema<IAbsence>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String },
    reason: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    notes: { type: String },
    approvedBy: { type: String },
  },
  { timestamps: true }
)

export const Absence = models.Absence || model<IAbsence>("Absence", AbsenceSchema)

// ─── Child Care (health records) ──────────────────────────────────────────────
export interface IChildCare extends Document {
  tenantId: string
  studentId: string
  studentName: string
  type: "vaccination" | "incident" | "medication" | "allergy" | "general" | "meal" | "nap" | "emergency" | "medical_profile"
  title?: string
  description?: string
  date?: string
  nextDate?: string
  recordedBy?: string
  // Medical Profile
  bloodGroup?: string
  allergies?: string[]
  conditions?: string[]
  vaccinations?: Array<{ name: string; date: string; due?: string }>
  // Meal Log
  meal?: string
  items?: string
  eaten?: string
  // Nap Log
  start?: string
  end?: string
  quality?: string
  // Incident Log
  time?: string
  incidentType?: string
  action?: string
  notifiedParent?: boolean
  // Emergency Contacts
  contacts?: Array<{ name: string; relation: string; phone: string; primary: boolean }>
  doctorName?: string
  doctorPhone?: string
  hospital?: string
  note?: string
}

const ChildCareSchema = new Schema<IChildCare>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    type: {
      type: String,
      enum: ["vaccination", "incident", "medication", "allergy", "general", "meal", "nap", "emergency", "medical_profile"],
      required: true,
    },
    title: { type: String },
    description: { type: String },
    date: { type: String },
    nextDate: { type: String },
    recordedBy: { type: String },
    bloodGroup: { type: String },
    allergies: { type: [String], default: [] },
    conditions: { type: [String], default: [] },
    vaccinations: { type: [{ name: String, date: String, due: String }], default: [] },
    meal: { type: String },
    items: { type: String },
    eaten: { type: String },
    start: { type: String },
    end: { type: String },
    quality: { type: String },
    time: { type: String },
    incidentType: { type: String },
    action: { type: String },
    notifiedParent: { type: Boolean },
    contacts: { type: [{ name: String, relation: String, phone: String, primary: Boolean }], default: [] },
    doctorName: { type: String },
    doctorPhone: { type: String },
    hospital: { type: String },
    note: { type: String },
  },
  { timestamps: true }
)

export const ChildCare = models.ChildCare || model<IChildCare>("ChildCare", ChildCareSchema)

// ─── Child Document ───────────────────────────────────────────────────────────
export interface IChildDocument extends Document {
  tenantId: string
  studentId: string
  studentName: string
  name: string
  type?: string
  url?: string
  uploadedBy?: string
  status?: "missing" | "uploaded" | "verified"
}

const ChildDocumentSchema = new Schema<IChildDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String },
    url: { type: String },
    uploadedBy: { type: String },
    status: { type: String, enum: ["missing", "uploaded", "verified"], default: "uploaded" },
  },
  { timestamps: true }
)

export const ChildDocument = models.ChildDocument || model<IChildDocument>("ChildDocument", ChildDocumentSchema)
if (!ChildDocument.schema.path("status")) {
  ChildDocument.schema.add({
    status: { type: String, enum: ["missing", "uploaded", "verified"], default: "uploaded" },
  })
}

// ─── Message ──────────────────────────────────────────────────────────────────
export interface IMessage extends Document {
  tenantId: string
  from: string
  fromId?: string
  to: string
  toId?: string
  subject?: string
  body: string
  read?: boolean
  type?: "announcement" | "direct" | "alert"
}

const MessageSchema = new Schema<IMessage>(
  {
    tenantId: { type: String, required: true, index: true },
    from: { type: String, required: true },
    fromId: { type: String },
    to: { type: String, required: true },
    toId: { type: String },
    subject: { type: String },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ["announcement", "direct", "alert"], default: "direct" },
  },
  { timestamps: true }
)

export const Message = models.Message || model<IMessage>("Message", MessageSchema)

// ─── Calendar Event ───────────────────────────────────────────────────────────
export interface ICalendarEvent extends Document {
  tenantId: string
  title: string
  date: string
  endDate?: string
  type?: "holiday" | "event" | "exam" | "activity" | "meeting"
  description?: string
  className?: string
  color?: string
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    tenantId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
    endDate: { type: String },
    type: { type: String, enum: ["holiday", "event", "exam", "activity", "meeting"], default: "event" },
    description: { type: String },
    className: { type: String },
    color: { type: String },
  },
  { timestamps: true }
)

export const CalendarEvent = models.CalendarEvent || model<ICalendarEvent>("CalendarEvent", CalendarEventSchema)

// ─── Progress / Assessment ────────────────────────────────────────────────────
export interface IProgress extends Document {
  tenantId: string
  studentId: string
  studentName: string
  subject: string
  score?: number
  maxScore?: number
  grade?: string
  remarks?: string
  assessmentType?: string
  assessmentDate?: string
  recordedBy?: string
}

const ProgressSchema = new Schema<IProgress>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    subject: { type: String, required: true },
    score: { type: Number },
    maxScore: { type: Number },
    grade: { type: String },
    remarks: { type: String },
    assessmentType: { type: String },
    assessmentDate: { type: String },
    recordedBy: { type: String },
  },
  { timestamps: true }
)

export const Progress = models.Progress || model<IProgress>("Progress", ProgressSchema)

// ─── Notification ─────────────────────────────────────────────────────────────
export interface INotification extends Document {
  tenantId?: string
  title: string
  description: string
  type?: string
  targetRoles?: string[]
  targetUserId?: string
  read?: boolean
  link?: string
  isSchoolNotice?: boolean
  targetBatchIds?: string[]
  targetBatchNames?: string[]
  noticeDate?: string
  createdBy?: string
}

const NotificationSchema = new Schema<INotification>(
  {
    tenantId: { type: String, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, default: "system" },
    targetRoles: { type: [String], default: [] },
    targetUserId: { type: String },
    read: { type: Boolean, default: false },
    link: { type: String },
    isSchoolNotice: { type: Boolean, default: false, index: true },
    targetBatchIds: { type: [String], default: [] },
    targetBatchNames: { type: [String], default: [] },
    noticeDate: { type: String },
    createdBy: { type: String },
  },
  { timestamps: true }
)

if (process.env.NODE_ENV !== "production") {
  delete models.Notification
}

export const Notification = models.Notification || model<INotification>("Notification", NotificationSchema)

// ─── Support Ticket ───────────────────────────────────────────────────────────
export interface ISupportTicket extends Document {
  tenantId?: string
  subject: string
  category: string
  priority: "low" | "medium" | "high"
  message: string
  status: "open" | "in_progress" | "resolved" | "closed"
  createdBy?: string
  response?: string
  messages?: Array<{ sender: string; text: string; time: string }>
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    tenantId: { type: String, index: true },
    subject: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    createdBy: { type: String },
    response: { type: String },
    messages: { type: [{ sender: String, text: String, time: String }], default: [] },
  },
  { timestamps: true }
)

export const SupportTicket = models.SupportTicket || model<ISupportTicket>("SupportTicket", SupportTicketSchema)

// ─── Admission ────────────────────────────────────────────────────────────────
export interface IAdmission extends Document {
  tenantId: string
  studentId?: string
  studentName: string
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  program?: string
  className?: string
  section?: string
  admissionDate?: string
  academicYear?: string
  status: "pending" | "enrolled" | "waitlisted" | "rejected"
  notes?: string
  leadId?: string
}

const AdmissionSchema = new Schema<IAdmission>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String },
    studentName: { type: String, required: true },
    parentName: { type: String },
    parentPhone: { type: String },
    parentEmail: { type: String },
    program: { type: String },
    className: { type: String },
    section: { type: String },
    admissionDate: { type: String },
    academicYear: { type: String },
    status: { type: String, enum: ["pending", "enrolled", "waitlisted", "rejected"], default: "pending" },
    notes: { type: String },
    leadId: { type: String },
  },
  { timestamps: true }
)

export const Admission = models.Admission || model<IAdmission>("Admission", AdmissionSchema)

// ─── Transfer ─────────────────────────────────────────────────────────────────
export interface ITransfer extends Document {
  studentId: string
  studentName: string
  fromTenantId: string
  toTenantId: string
  reason?: string
  status: "pending" | "approved" | "rejected" | "completed"
  requestedBy?: string
  approvedBy?: string
  transferDate?: string
}

const TransferSchema = new Schema<ITransfer>(
  {
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    fromTenantId: { type: String, required: true, index: true },
    toTenantId: { type: String, required: true },
    reason: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected", "completed"], default: "pending" },
    requestedBy: { type: String },
    approvedBy: { type: String },
    transferDate: { type: String },
  },
  { timestamps: true }
)

export const Transfer = models.Transfer || model<ITransfer>("Transfer", TransferSchema)

// ─── Fee Record ───────────────────────────────────────────────────────────────
export interface IFeeRecord extends Document {
  tenantId: string
  studentId: string
  studentName: string
  amount: number
  paidAmount?: number
  dueDate?: string
  paidDate?: string
  status: "pending" | "paid" | "overdue" | "partial"
  receiptNumber?: string
  paymentMode?: string
  notes?: string
  type?: "tuition" | "transport" | "lunch" | "activity" | "other"
}

const FeeRecordSchema = new Schema<IFeeRecord>(
  {
    tenantId: { type: String, required: true, index: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueDate: { type: String },
    paidDate: { type: String },
    status: { type: String, enum: ["pending", "paid", "overdue", "partial"], default: "pending" },
    receiptNumber: { type: String },
    paymentMode: { type: String },
    notes: { type: String },
    type: { type: String, enum: ["tuition", "transport", "lunch", "activity", "other"], default: "tuition" },
  },
  { timestamps: true }
)

export const FeeRecord = models.FeeRecord || model<IFeeRecord>("FeeRecord", FeeRecordSchema)

// ─── Campaign / Announcement ──────────────────────────────────────────────────
export interface ICampaign extends Document {
  tenantId: string
  title: string
  name?: string
  type?: string
  channel?: string
  audience?: string
  status: string
  subject?: string
  message?: string
  body?: string
  scheduledAt?: string
  sentAt?: string
  createdBy?: string
  recipientCount?: number
  openRate?: number
  clickRate?: number
}

const CampaignSchema = new Schema<ICampaign>(
  {
    tenantId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    name: { type: String },
    type: { type: String },
    channel: { type: String },
    audience: { type: String },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "cancelled", "Draft", "Scheduled", "Active", "Completed"],
      default: "Draft",
    },
    subject: { type: String },
    message: { type: String },
    body: { type: String },
    scheduledAt: { type: String },
    sentAt: { type: String },
    createdBy: { type: String },
    recipientCount: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 },
  },
  { timestamps: true }
)

if (process.env.NODE_ENV !== "production") {
  delete models.Campaign
  delete models.CampaignTemplate
}

export const Campaign = models.Campaign || model<ICampaign>("Campaign", CampaignSchema)

export interface ICampaignTemplate extends Document {
  tenantId: string
  name: string
  category: string
  subject: string
  body?: string
}

const CampaignTemplateSchema = new Schema<ICampaignTemplate>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, default: "General" },
    subject: { type: String, default: "" },
    body: { type: String },
  },
  { timestamps: true }
)

export const CampaignTemplate =
  models.CampaignTemplate || model<ICampaignTemplate>("CampaignTemplate", CampaignTemplateSchema)

// ─── Follow-up ────────────────────────────────────────────────────────────────
export interface IFollowUp extends Document {
  tenantId: string
  leadId: string
  leadName?: string
  bdeId?: string
  bdeName?: string
  followupDate: string
  notes?: string
  status: "pending" | "completed" | "missed"
  nextFollowupDate?: string
  outcome?: string
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    tenantId: { type: String, required: true, index: true },
    leadId: { type: String, required: true },
    leadName: { type: String },
    bdeId: { type: String },
    bdeName: { type: String },
    followupDate: { type: String, required: true },
    notes: { type: String },
    status: { type: String, enum: ["pending", "completed", "missed"], default: "pending" },
    nextFollowupDate: { type: String },
    outcome: { type: String },
  },
  { timestamps: true }
)

export const FollowUp = models.FollowUp || model<IFollowUp>("FollowUp", FollowUpSchema)

// ─── Fee Structure ──────────────────────────────────────────────────────────────
export interface IFeeStructure extends Document {
  tenantId: string
  academicYear: string
  branch: string
  className: string
  status: "active" | "inactive"
  components: Array<{
    id: string
    name: string
    type: string
    amount: number
    frequency: string
    dueDate: string
    required: boolean
  }>
}

const FeeStructureSchema = new Schema<IFeeStructure>(
  {
    tenantId: { type: String, required: true, index: true },
    academicYear: { type: String, required: true },
    branch: { type: String, required: true },
    className: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    components: {
      type: [
        {
          id: String,
          name: String,
          type: { type: String },
          amount: Number,
          frequency: String,
          dueDate: String,
          required: Boolean,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
)

export const FeeStructure = models.FeeStructure || model<IFeeStructure>("FeeStructure", FeeStructureSchema)

export { AdminUser } from "./AdminUser"
export { RoleModel } from "./Role"
export { PanelAssociate } from "./PanelAssociate"
export { ChildLeave } from "./ChildLeave"

