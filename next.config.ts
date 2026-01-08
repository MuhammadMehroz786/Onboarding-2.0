import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Skip static generation during build to prevent Prisma initialization errors
    isrMemoryCacheSize: 0,
  },
};

export default nextConfig;
