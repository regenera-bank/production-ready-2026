# @regenera/bank-core
# Multi-stage Dockerfile for Node.js Backend optimized for Cloud Run
# Senior Engineering Standard: Includes minimal attack surface, explicit caching, and hardened non-root execution.
# Compliance: Aligning with BACEN standard for immutable artifacts.

# Stage 1: Build Environment
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files strictly
COPY package*.json ./

# Clean ci install for deterministic builds
RUN npm ci --ignore-scripts

# Copy source code
COPY tsconfig*.json ./
COPY src/ ./src/

# Build project
RUN npm run build

# Stage 2: Production Environment (Distroless-like via Alpine)
FROM node:20-alpine AS production

# Security: Install CA certificates and configure secure timezone
RUN apk add --no-cache dumb-init ca-certificates tzdata \
    && cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime \
    && echo "America/Sao_Paulo" > /etc/timezone \
    && apk del tzdata

# Security: Create strict non-root user (Zero-Trust)
RUN addgroup -S regeneragroup -g 1001 && adduser -S regenerauser -u 1001 -G regeneragroup

# Setup app directory
WORKDIR /usr/src/app

# Ensure proper permissions before dropping root
RUN chown regenerauser:regeneragroup /usr/src/app

# Drop to non-root user early
USER regenerauser

# Only copy essential files for production install
COPY --chown=regenerauser:regeneragroup package*.json ./

# Install production deps securely
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder --chown=regenerauser:regeneragroup /usr/src/app/dist ./dist

# EXPOSE is documentary for Cloud Run (port is provided via ENV)
EXPOSE 8080

# Environment hardening
ENV NODE_ENV=production
ENV PORT=8080
ENV NODE_OPTIONS="--enable-source-maps --max-old-space-size=1536"

# Use dumb-init for proper signal handling (SIGTERM, SIGINT)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Execute the application securely
CMD ["node", "dist/main.js"]
