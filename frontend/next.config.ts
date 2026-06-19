/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Image optimization ──
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 160, 256, 384],
    qualities: [75, 80, 85, 90],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: 'cloudinary.com' },
    ],
  },

  // ── API proxy: frontend /api/* → backend :4000/api/* ──
  async rewrites() {
    const target = (process.env.API_PROXY_TARGET || 'http://localhost:4000/api').replace(/\/+$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${target}/:path*`,
      },
    ];
  },

  // ── Aggressive cache headers for static assets & API responses ──
  async headers() {
    return [
      {
        // Cache Next.js static chunks for 1 year
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Cache public images for 7 days
        source: '/:path*.{png,jpg,jpeg,gif,svg,ico,webp,avif}',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        // Light cache for pages
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },

  // ── Build & runtime ──
  compress: true,
  poweredByHeader: false,

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_CASHFREE_ENV: process.env.NEXT_PUBLIC_CASHFREE_ENV || 'sandbox',
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210',
  },
};

export default nextConfig;
