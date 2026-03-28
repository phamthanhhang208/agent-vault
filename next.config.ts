import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Serverless-friendly for Vercel
  // MCP endpoint needs streaming support
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
