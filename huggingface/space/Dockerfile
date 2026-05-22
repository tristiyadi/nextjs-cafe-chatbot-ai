# ══════════════════════════════════════════════════════════════
# Kafe Nusantara — Hugging Face Space Dockerfile
# ══════════════════════════════════════════════════════════════
#
# This is a lightweight version for HF Spaces that runs the
# Next.js app in demo/static mode. The full infrastructure
# (PostgreSQL, Qdrant, Ollama, TEI) should be run locally
# or on a proper cloud setup.
#
# For HF Spaces, this builds and serves the Next.js app
# with demo/mock data (no external services required).
# ══════════════════════════════════════════════════════════════

FROM node:20-alpine AS base

# ── Stage 1: Install dependencies ────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# ── Stage 2: Build ───────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables for demo mode
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Skip DB-dependent build steps
ENV SKIP_DB_CHECK=true

RUN npm run build

# ── Stage 3: Production ─────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user (HF Spaces requirement)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
