import type { NextConfig } from 'next';

const YEAR = 60 * 60 * 24 * 365;
const immutable = [{ key: 'Cache-Control', value: `public, max-age=${YEAR}, immutable` }];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // No source image is wider than 1280px, so variants above 1920 only cost cache space.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Optimised variants are re-generated at most monthly.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // Public assets keep stable names; long-lived caching (rename a file to bust it).
  // /_next/static is already immutable in production; listed for `next start` behind proxies.
  async headers() {
    return [
      { source: '/images/:path*', headers: immutable },
      { source: '/video/:path*', headers: immutable },
      { source: '/vendor/:path*', headers: immutable },
      { source: '/_next/static/:path*', headers: immutable },
    ];
  },
  // The six product routes became one page. A hash cannot be set server-side, so the
  // page turns ?type=x into #x on mount.
  async redirects() {
    return [{ source: '/products/:slug', destination: '/products?type=:slug', permanent: false }];
  },
};

export default nextConfig;
