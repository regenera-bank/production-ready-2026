# [FILE] apps/services/api-gateway/Dockerfile
# Dockerfile Canônico para Microserviços NestJS do Regenera Bank
# Adaptado para: api-gateway
# Desenvolvedor: Don Paulo Ricardo

# --- Estágio 1: Builder ---
# Este estágio instala todas as dependências, incluindo as de desenvolvimento,
# e constrói o código-fonte TypeScript para JavaScript.
FROM node:18-alpine AS builder

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Instala o pnpm globalmente
RUN npm install -g pnpm

# Copia os arquivos de manifesto do workspace do monorepo para aproveitar o cache de camadas do Docker.
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copia os manifestos do projeto raiz e do microserviço específico.
COPY package.json ./
COPY apps/services/api-gateway/package.json ./apps/services/api-gateway/

# Instala APENAS as dependências de produção para o workspace inteiro,
# mas focado no microserviço api-gateway.
RUN pnpm install --prod --filter="api-gateway..."

# Copia todo o código-fonte.
COPY . .

# Executa o build específico para o microserviço api-gateway.
RUN pnpm --filter api-gateway build


# --- Estágio 2: Final ---
# Este estágio cria a imagem final, enxuta e otimizada para produção.
FROM node:18-alpine AS final

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Cria um usuário não-root 'node' para segurança.
RUN addgroup -S node && adduser -S node -G node
USER node

# Copia as dependências de produção do estágio 'builder'.
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./

# Copia os artefatos de build (código JavaScript compilado) do 'api-gateway'.
COPY --from=builder /usr/src/app/apps/services/api-gateway/dist ./dist

# Expõe a porta em que a aplicação será executada (porta do gateway).
EXPOSE 3000

# Comando para iniciar a aplicação.
CMD ["node", "dist/main.js"]
