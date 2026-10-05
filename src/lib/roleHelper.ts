import connectDB from "@/lib/mongodb"
import { RoleModel } from "@/models/Role"
import { normalizePermissions, fullPermissions, type RolePermissions } from "@/lib/rolePermissions"

export async function getPermissionsForRole(roleNameOrId?: string): Promise<RolePermissions> {
  if (!roleNameOrId) return fullPermissions()
  const cleaned = roleNameOrId.trim()
  if (!cleaned) return fullPermissions()

  const rLower = cleaned.toLowerCase()
  const isOwnerOrAdmin =
    rLower.includes("franchise") ||
    rLower.includes("owner") ||
    rLower.includes("super_admin") ||
    rLower.includes("super admin")

  try {
    await connectDB()

    // 1. Try finding by MongoDB ObjectId if valid hex string
    if (/^[0-9a-fA-F]{24}$/.test(cleaned)) {
      const roleById = await RoleModel.findById(cleaned)
      if (roleById && roleById.permissions && Object.keys(roleById.permissions).length > 0) {
        return normalizePermissions(roleById.permissions)
      }
    }

    // 2. Try finding by exact name or case-insensitive regex or slug
    const escapedName = cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const slug = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, "_")

    const roleDoc = await RoleModel.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${escapedName}$`, "i") } },
        { slug: slug },
      ],
    })

    if (roleDoc && roleDoc.permissions && Object.keys(roleDoc.permissions).length > 0) {
      return normalizePermissions(roleDoc.permissions)
    }
  } catch (err) {
    console.error("Error fetching permissions for role:", roleNameOrId, err)
  }

  return isOwnerOrAdmin ? fullPermissions() : fullPermissions()
}
