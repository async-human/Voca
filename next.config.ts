import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(process.cwd(), 'src'),
    };
    return config;
  },
  async rewrites() {
    return [{ source: '/', destination: '/index.html' }];
  },
  async redirects() {
    return [
      { source: '/app.html', destination: '/app', permanent: true },
    ];
  },
};

export default nextConfig;
