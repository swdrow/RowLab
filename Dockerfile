# oarbit Docker Image
# Multi-stage build for optimized production image

# ====================
# Build Stage
# ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma client BEFORE build (TypeScript needs it)
RUN npx prisma generate

# Build application
RUN npm run build

# ====================
# Production Stage
# ====================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S oarbit -u 1001

# Copy built assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Copy pre-generated Prisma client from builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install production dependencies only (no need to regenerate Prisma client)
RUN npm ci --only=production && \
    npm cache clean --force

# Set ownership
RUN chown -R oarbit:nodejs /app

# Switch to non-root user
USER oarbit

# Environment
ENV NODE_ENV=production
ENV PORT=3002

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1

# Start server
CMD ["node", "server/index.js"]
