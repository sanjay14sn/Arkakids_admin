#!/usr/bin/env node
/**
 * Generates boilerplate Next.js API route files for all remaining modules.
 * Run once: node scripts/gen-routes.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"

const BASE = "src/app/api"

const modules = [
  {
    path: "homework",
    model: "Homework",
    modelImport: `import { Homework } from "@/models/index"`,
  },
  {
    path: "journal",
    model: "Journal",
    modelImport: `import { Journal } from "@/models/index"`,
  },
  {
    path: "absences",
    model: "Absence",
    modelImport: `import { Absence } from "@/models/index"`,
  },
  {
    path: "childcare",
    model: "ChildCare",
    modelImport: `import { ChildCare } from "@/models/index"`,
  },
  {
    path: "child-documents",
    model: "ChildDocument",
    modelImport: `import { ChildDocument } from "@/models/index"`,
  },
  {
    path: "messages",
    model: "Message",
    modelImport: `import { Message } from "@/models/index"`,
  },
  {
    path: "calendar",
    model: "CalendarEvent",
    modelImport: `import { CalendarEvent } from "@/models/index"`,
  },
  {
    path: "progress",
    model: "Progress",
    modelImport: `import { Progress } from "@/models/index"`,
  },
  {
    path: "campaigns",
    model: "Campaign",
    modelImport: `import { Campaign } from "@/models/index"`,
  },
  {
    path: "admissions",
    model: "Admission",
    modelImport: `import { Admission } from "@/models/index"`,
  },
  {
    path: "transfers",
    model: "Transfer",
    modelImport: `import { Transfer } from "@/models/index"`,
  },
  {
    path: "bde/followups",
    model: "FollowUp",
    modelImport: `import { FollowUp } from "@/models/index"`,
  },
]

function listRoute(path, model, modelImport) {
  return `import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
${modelImport}
import { requireAuth, tenantFilter } from "@/lib/authMiddleware"

export async function GET(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const items = await ${model}.find(tenantFilter(user)).sort({ createdAt: -1 })
    return NextResponse.json(items)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = requireAuth(req)
  if (error) return error
  try {
    await connectDB()
    const data = await req.json()
    const item = await ${model}.create({ ...data, tenantId: user.tenantId || data.tenantId })
    return NextResponse.json(item, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
`
}

function idRoute(path, model, modelImport) {
  return `import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
${modelImport}
import { requireAuth } from "@/lib/authMiddleware"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    const item = await ${model}.findById(id)
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(item)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    const data = await req.json()
    const item = await ${model}.findByIdAndUpdate(id, data, { new: true })
    if (!item) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(item)
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { error } = requireAuth(req)
  if (error) return error
  const { id } = await params
  try {
    await connectDB()
    await ${model}.findByIdAndDelete(id)
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
`
}

for (const mod of modules) {
  const listDir = join(BASE, mod.path)
  const idDir = join(BASE, mod.path, "[id]")

  mkdirSync(listDir, { recursive: true })
  mkdirSync(idDir, { recursive: true })

  const listFile = join(listDir, "route.ts")
  const idFile = join(idDir, "route.ts")

  if (!existsSync(listFile)) {
    writeFileSync(listFile, listRoute(mod.path, mod.model, mod.modelImport))
    console.log(`✅ Created ${listFile}`)
  } else {
    console.log(`⏭️  Skipped ${listFile} (exists)`)
  }

  if (!existsSync(idFile)) {
    writeFileSync(idFile, idRoute(mod.path, mod.model, mod.modelImport))
    console.log(`✅ Created ${idFile}`)
  } else {
    console.log(`⏭️  Skipped ${idFile} (exists)`)
  }
}

console.log("\n🎉 Route generation complete!")
