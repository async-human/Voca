import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
