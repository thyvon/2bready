# Build context is the monorepo root (2bready-web/), not this directory —
# npm workspaces needs the root package.json/lockfile and sibling packages/*
# present to resolve @2bready/api-client. See docker-compose.prod.yml.

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
# admin-portal's deps end up used at runtime.
RUN npm ci --workspace=admin-portal --include-workspace-root

# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=admin-portal

# ---- Production ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# output: 'standalone' + outputFileTracingRoot (see next.config.ts) mirrors
# the monorepo path inside .next/standalone — server.js lands at
# apps/admin-portal/server.js, not at the standalone root.
COPY --from=builder /app/apps/admin-portal/public ./apps/admin-portal/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-portal/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-portal/.next/static ./apps/admin-portal/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "apps/admin-portal/server.js"]
