import { NextRequest, NextResponse } from "next/server"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const scope = (formData.get("scope") as string) || "journal"

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const folderMap: Record<string, string> = {
      journal: "arka_kids/daily_journal",
      classroom: "arka_kids/classroom",
      documents: "arka_kids/documents",
      homework: "arka_kids/homework",
      hr: "arka_kids/hr",
    }
    const folder = folderMap[scope] || `arka_kids/${scope}`

    const isVideo = file.type.startsWith("video/")
    const uploadResult = await uploadToCloudinary(buffer, {
      folder,
      resourceType: isVideo ? "video" : "auto",
    })

    return NextResponse.json({
      url: uploadResult.secure_url,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      fileName: file.name,
      size: uploadResult.bytes || file.size,
      format: uploadResult.format,
      resource_type: uploadResult.resource_type,
      kind: isVideo ? "video" : "photo",
      uploadedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Cloudinary API Route Error:", error)
    return NextResponse.json(
      { message: error?.message || "Failed to upload file to Cloudinary" },
      { status: 500 }
    )
  }
}
