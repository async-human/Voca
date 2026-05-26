import type { NextConfig } from 'next';
import path from 'path';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  // Force CSS/JS on apex — avoids www redirect breaking styles on vokal.work
  assetPrefix: siteUrl || undefined,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(process.cwd(), 'src'),
    };
    return config;
  },
};

export default nextConfig;
