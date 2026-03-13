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
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
