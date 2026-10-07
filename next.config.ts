import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // The six product routes became one page. A hash cannot be set server-side, so the
  // page turns ?type=x into #x on mount.
  async redirects() {
    return [{ source: '/products/:slug', destination: '/products?type=:slug', permanent: false }];
  },
};

export default nextConfig;
