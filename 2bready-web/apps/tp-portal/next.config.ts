import type { NextConfig } from 'next';
import path from 'node:path';

// Production mounts this app at /tp-portal on the same origin as the other
// apps (see docker-compose.prod.yml + devops/nginx/nginx.conf) — same
// env-gated approach as client-portal's /portal basePath. Unset in dev, so
// `npm run dev` still serves from the root as before.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: basePath || undefined,
  // Monorepo root — without this, Next infers the tracing root from lockfile
  // location heuristics, which can miscount workspace packages (packages/*)
  // that live outside this app's own directory.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@2bready/api-client', '@2bready/ui-core'],
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
