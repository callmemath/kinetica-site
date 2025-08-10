# Backend Dockerfile for Kinetica Fisioterapia
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache sqlite

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema first
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src/
COPY scripts ./scripts/

# Build the application
RUN npm run build

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