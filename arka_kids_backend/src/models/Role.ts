import { Schema, Document, model, models } from "mongoose"

export interface IRole extends Document {
  tenantId?: string
  name: string
  slug: string
  description?: string
  isSystem: boolean
  permissions: Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }>
}

const RoleSchema = new Schema<IRole>(
  {
    tenantId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String },
    isSystem: { type: Boolean, default: false },
    permissions: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

export const RoleModel = models.RoleModel || model<IRole>("RoleModel", RoleSchema)
