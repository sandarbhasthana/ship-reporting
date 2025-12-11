# Multi-stage Dockerfile for Backend Service in Monorepo
# This handles the workspace dependency (@ship-reporting/prisma) correctly

FROM node:20-alpine AS builder

# Set working directory to monorepo root
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace packages
COPY packages/prisma ./packages/prisma
COPY backend ./backend

# Install dependencies from root (this resolves workspace dependencies)
RUN npm install --include=workspace-root

# Generate Prisma client and build prisma package
WORKDIR /app/packages/prisma
RUN npx prisma generate && npm run build

# Build backend
WORKDIR /app/backend
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy built packages
COPY --from=builder /app/packages/prisma ./packages/prisma
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/

# Install only production dependencies
RUN npm install --include=workspace-root --omit=dev

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]

