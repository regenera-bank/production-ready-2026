# [FILE] apps/services/notification-service/Dockerfile
# Dockerfile Canônico para Microserviços NestJS do Regenera Bank
# Adaptado para: notification-service
# Desenvolvedor: Don Paulo Ricardo

# --- Estágio 1: Builder ---
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/services/notification-service/package.json ./apps/services/notification-service/
RUN pnpm install --prod --filter="notification-service..."
COPY . .
RUN pnpm --filter notification-service build

# --- Estágio 2: Final ---
FROM node:18-alpine AS final
WORKDIR /usr/src/app
RUN addgroup -S node && adduser -S node -G node
USER node
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/apps/services/notification-service/dist ./dist
EXPOSE 3008
CMD ["node", "dist/main.js"]
