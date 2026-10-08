import mongoose, { Schema, Document, model, models } from "mongoose"
import bcrypt from "bcryptjs"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: "super_admin" | "owner" | "coordinator" | "trainer" | "student" | "bde"
  tenantId?: string
  avatar?: string
  comparePassword(candidate: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["super_admin", "owner", "coordinator", "trainer", "student", "bde"],
      required: true,
    },
    tenantId: { type: String, index: true },
    avatar: { type: String },
  },
  { timestamps: true }
)

UserSchema.pre("save", async function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = this as any
  if (!doc.isModified("password")) return
  doc.password = await bcrypt.hash(doc.password, 12)
})

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password)
}

// Fix Next.js hot-reload caching for schemas
if (process.env.NODE_ENV !== "production") {
  delete models.User
}

export const User = models.User || model<IUser>("User", UserSchema)
