# Build context is the monorepo root (2bready-web/), not this directory —
# npm workspaces needs the root package.json/lockfile and sibling packages/*
# present to resolve @2bready/api-client and @2bready/ui-core. See
# docker-compose.prod.yml. Mirrors apps/admin-portal/Dockerfile.

# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/admin-portal/package.json ./apps/admin-portal/package.json
COPY apps/client-portal/package.json ./apps/client-portal/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/ui-core/package.json ./packages/ui-core/package.json
# npm ci validates the lockfile against every workspace's package.json, not
# just the one being built — all of them must exist here even though only
# client-portal's deps end up used at runtime.
RUN npm ci --workspace=client-portal --include-workspace-root

# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=client-portal

# ---- Production ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# output: 'standalone' + outputFileTracingRoot (see next.config.ts) mirrors
# the monorepo path inside .next/standalone — server.js lands at
# apps/client-portal/server.js, not at the standalone root.
COPY --from=builder /app/apps/client-portal/public ./apps/client-portal/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/client-portal/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/client-portal/.next/static ./apps/client-portal/.next/static

USER nextjs
EXPOSE 3001
ENV PORT=3001 HOSTNAME=0.0.0.0

CMD ["node", "apps/client-portal/server.js"]
