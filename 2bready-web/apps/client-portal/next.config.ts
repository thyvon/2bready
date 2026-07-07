import type { NextConfig } from 'next';
import path from 'node:path';

// Production mounts this app at /portal on the same origin as admin-portal
// (see docker-compose.prod.yml + devops/nginx/nginx.conf) rather than a
// subdomain — avoids needing new DNS/Cloudflare Tunnel config. Unset in dev,
// so `npm run dev` still serves from the root as before. Every internal link
// in this app goes through next/link (GlowButton, Breadcrumbs, nav items),
// so Next rewrites hrefs automatically — no per-link code changes needed.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: basePath || undefined,
  // Monorepo root — without this, Next infers the tracing root from lockfile
  // location heuristics, which can miscount workspace packages (packages/*)
  // that live outside this app's own directory. Same fix already applied to
  // admin-portal's next.config.ts.
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
