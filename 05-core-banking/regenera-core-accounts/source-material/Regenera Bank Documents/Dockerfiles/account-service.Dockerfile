# [FILE] apps/services/account-service/Dockerfile
# Dockerfile Canônico para Microserviços NestJS do Regenera Bank
# Adaptado para: account-service
# Desenvolvedor: Don Paulo Ricardo

# --- Estágio 1: Builder ---
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
RUN npm install -g pnpm
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/services/account-service/package.json ./apps/services/account-service/
RUN pnpm install --prod --filter="account-service..."
COPY . .
RUN pnpm --filter account-service build

# --- Estágio 2: Final ---
FROM node:18-alpine AS final
WORKDIR /usr/src/app
RUN addgroup -S node && adduser -S node -G node
USER node
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/apps/services/account-service/dist ./dist
EXPOSE 3003
CMD ["node", "dist/main.js"]
