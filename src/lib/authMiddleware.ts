import jwt from "jsonwebtoken"
import { NextRequest, NextResponse } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "arka-kids-secret-key-change-in-production"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

export interface JwtPayload {
  id: string
  email: string
  role: string
  tenantId?: string
  name: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any)
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

/**
 * Extract authenticated user from request.
 * Returns null if no token or invalid.
 */
export function getAuthUser(req: NextRequest): JwtPayload | null {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) return null
    const token = authHeader.slice(7)
    return verifyToken(token)
  } catch {
    return null
  }
}

/**
 * Middleware helper — call this at the top of every protected route.
 * Returns { user, error } where error is a NextResponse to return immediately if auth fails.
 */
export function requireAuth(req: NextRequest): { user: JwtPayload; error: null } | { user: null; error: NextResponse } {
  const user = getAuthUser(req)
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    }
  }
  return { user, error: null }
}

/**
 * Require super admin role.
 */
export function requireSuperAdmin(req: NextRequest): { user: JwtPayload; error: null } | { user: null; error: NextResponse } {
  const result = requireAuth(req)
  if (result.error) return result
  if (result.user.role !== "super_admin") {
    return {
      user: null,
      error: NextResponse.json({ message: "Forbidden: Super Admin only" }, { status: 403 }),
    }
  }
  return result
}

/**
 * Build a MongoDB tenant filter based on the user's role.
 * Super admins see everything; others are scoped to their tenantId.
 */
export function tenantFilter(user: JwtPayload): Record<string, string> {
  if (user.role === "super_admin") return {}
  return { tenantId: user.tenantId || "" }
}
