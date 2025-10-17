import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during build for deployment
    ignoreDuringBuilds: true,
  },
  images: {
    // OPTIMIZATION: Disable Next.js image optimization to save Fast Origin Transfer
    // All images are served directly from R2 CDN using native <img> tags
    // This prevents Vercel from fetching, optimizing, and serving images through Edge Functions
    unoptimized: true,
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // OPTIMIZATION: Enable compression for all responses
  compress: true,
  // Optimize output
  poweredByHeader: false,
  output: 'standalone',
  // Experimental features for better performance
  experimental: {
    // Optimize font loading and package imports
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;