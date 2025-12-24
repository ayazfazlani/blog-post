import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose'],
  eslint: {
    // Disable ESLint during builds to avoid patching issues
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optional: ignore TypeScript errors during builds if needed
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;
