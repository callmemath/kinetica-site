# Backend Dockerfile for Kinetica Fisioterapia
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache sqlite python3 make g++

# Copy package files first
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy ALL necessary configuration files
COPY tsconfig.json ./
COPY prisma.config.ts ./

# Copy source code and scripts
COPY src ./src/
COPY scripts ./scripts/

# Copy Prisma configuration
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Debug: Check what files are present
RUN echo "=== All files in working directory ===" && ls -la
RUN echo "=== TypeScript config content ===" && cat tsconfig.json

# Build the application
RUN npm run build

# Verify build output
RUN echo "=== Build output ===" && ls -la dist/

# Remove devDependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Create directory for database
RUN mkdir -p /app/data

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Change ownership of app directory
RUN chown -R backend:nodejs /app

# Switch to non-root user
USER backend

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/production.db"

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "run", "start:production"]