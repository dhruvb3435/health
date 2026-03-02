/** @type {import('next').NextConfig} */
const RAILWAY_BACKEND = process.env.RAILWAY_BACKEND_URL || 'https://healthcare-management-system-production-5c2d.up.railway.app';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  // Proxy /api-proxy/* → Railway backend (server-side, so mobile clients only need to reach Vercel)
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${RAILWAY_BACKEND}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
