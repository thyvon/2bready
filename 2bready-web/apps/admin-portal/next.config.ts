import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Monorepo root — without this, Next infers the tracing root from lockfile
  // location heuristics, which can miscount workspace packages (packages/*)
  // that live outside this app's own directory.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@2bready/api-client'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
};

export default nextConfig;
