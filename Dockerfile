# Stage 1: Dependencies
# Installs all npm dependencies in an isolated layer for better caching
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
# Builds the Next.js application with standalone output
# Requires `output: "standalone"` in next.config.ts
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Runner
# Minimal production image with only necessary files
# Runs as non-root user for security
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only production files from builder
# - public: Static assets
# - .next/standalone: Self-contained server with dependencies
# - .next/static: Static build output (JS, CSS, etc.)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Configure server to listen on all interfaces
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the standalone Next.js server
CMD ["node", "server.js"]