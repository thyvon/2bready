# Build context is the monorepo root (2bready-web/), not this directory —
# npm workspaces needs the root package.json/lockfile present to resolve
# the workspace tree. See docker-compose.prod.yml. Mirrors
# apps/admin-portal/Dockerfile and apps/client-portal/Dockerfile.
#
# Marketing has no api-client/ui-core dependency (confirmed when it was
# split into its own app — no axios, no zod/react-hook-form/zustand either),
# so unlike the other two apps' deps stages, this one only needs its own
# package.json plus the root lockfile.

# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/marketing/package.json ./apps/marketing/package.json
RUN npm ci --workspace=marketing --include-workspace-root

# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ADMIN_PORTAL_URL
ARG NEXT_PUBLIC_CLIENT_PORTAL_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_ADMIN_PORTAL_URL=${NEXT_PUBLIC_ADMIN_PORTAL_URL}
ENV NEXT_PUBLIC_CLIENT_PORTAL_URL=${NEXT_PUBLIC_CLIENT_PORTAL_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=marketing

# ---- Production ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# output: 'standalone' + outputFileTracingRoot (see next.config.ts) mirrors
# the monorepo path inside .next/standalone — server.js lands at
# apps/marketing/server.js, not at the standalone root.
COPY --from=builder /app/apps/marketing/public ./apps/marketing/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/marketing/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/marketing/.next/static ./apps/marketing/.next/static

USER nextjs
EXPOSE 3002
ENV PORT=3002 HOSTNAME=0.0.0.0

CMD ["node", "apps/marketing/server.js"]
