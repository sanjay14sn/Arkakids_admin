import { Schema, Document, model, models } from "mongoose"

export type ResourceKind = "material" | "video"

export interface IResource extends Document {
  title: string
  description?: string
  kind: ResourceKind
  category?: string
  program?: string
  url: string
  fileName?: string
  format?: string
  size?: number
  thumbnailUrl?: string
  audience: string[]
  uploadedBy?: string
  uploadedByName?: string
  tenantId: string
  centerName?: string
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    kind: { type: String, enum: ["material", "video"], required: true },
    category: { type: String },
    program: { type: String },
    url: { type: String, required: true },
    fileName: { type: String },
    format: { type: String },
    size: { type: Number },
    thumbnailUrl: { type: String },
    // Who can see it: owner (franchise), coordinator, trainer (teachers), bde
    audience: { type: [String], default: ["owner", "coordinator", "trainer"] },
    uploadedBy: { type: String },
    uploadedByName: { type: String },
    // "global" = shared by Super Admin with every franchise
    tenantId: { type: String, required: true, default: "global" },
    centerName: { type: String },
  },
  { timestamps: true }
)

export const Resource = models.Resource || model<IResource>("Resource", ResourceSchema)
