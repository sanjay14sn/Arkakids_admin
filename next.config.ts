import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API routes are now handled by Next.js route handlers at src/app/api/
  // No proxy rewrite needed — MongoDB Atlas is connected directly
};

export default nextConfig;
