import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-auth'],
  eslint: {
    // Disable ESLint during build for deployment
    ignoreDuringBuilds: true,
  },
  images: {
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
        hostname: '*.vercel.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.netlify.app',
        port: '',
        pathname: '/**',
      },
    ],
    // Optimize image delivery for cost reduction
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Enable compression
  compress: true,
  // Optimize output
  poweredByHeader: false,
  // Enable SWC minification for smaller bundles
  swcMinify: true,
  // Experimental features for better performance
  experimental: {
    // Optimize font loading
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;