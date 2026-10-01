import { v2 as cloudinary, UploadApiResponse } from "cloudinary"

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dn98ovhm7"
const apiKey = process.env.CLOUDINARY_API_KEY || "651847337155826"
const apiSecret = process.env.CLOUDINARY_API_SECRET || "s5AhCwi5PpzDFjPVze4U9LzwsJw"

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
})

export { cloudinary }

export async function uploadToCloudinary(
  buffer: Buffer,
  options?: {
    folder?: string
    publicId?: string
    resourceType?: "auto" | "image" | "video" | "raw"
  }
): Promise<UploadApiResponse> {
  const folder = options?.folder || "arka_kids/daily_journal"
  const resourceType = options?.resourceType || "auto"

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: options?.publicId,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed with empty result"))
        }
        resolve(result)
      }
    )

    uploadStream.end(buffer)
  })
}
