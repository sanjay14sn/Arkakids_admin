#!/usr/bin/env node
/**
 * Arka Kids — Database Seed Script
 * Creates the initial super admin user.
 * 
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node scripts/seed.mjs
 * 
 * Or add to package.json scripts:
 *   "seed": "node scripts/seed.mjs"
 */

import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required")
  console.error("   Run: MONGODB_URI='...' node scripts/seed.mjs")
  process.exit(1)
}

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: String,
  tenantId: String,
  avatar: String,
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model("User", UserSchema)

async function seed() {
  try {
    console.log("🔗 Connecting to MongoDB Atlas...")
    await mongoose.connect(MONGODB_URI)
    console.log("✅ Connected!")

    // Create super admin
    const existing = await User.findOne({ email: "arkakids@gmail.com" })
    if (!existing) {
      const hashed = await bcrypt.hash("1234", 12)
      await User.create({
        name: "Arka Kids Admin",
        email: "arkakids@gmail.com",
        password: hashed,
        role: "super_admin",
        avatar: "AK",
      })
      console.log("✅ Super Admin created: arkakids@gmail.com / 1234")
    } else {
      console.log("⏭️  Super Admin already exists")
    }

    console.log("\n🎉 Seed complete!")
    console.log("   Login at /login with: arkakids@gmail.com / 1234\n")
  } catch (err) {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

seed()
