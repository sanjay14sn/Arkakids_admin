import type { NextConfig } from "next"

const BACKEND_URL = process.env.ARKA_BACKEND_URL || "http://13.205.189.169:4000"

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
