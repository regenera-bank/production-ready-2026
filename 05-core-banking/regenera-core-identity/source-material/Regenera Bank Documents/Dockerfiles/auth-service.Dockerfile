# [FILE] apps/services/auth-service/Dockerfile
# Dockerfile Canônico para Microserviços NestJS do Regenera Bank
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
# Isso garante que as dependências só sejam reinstaladas se os arquivos de manifesto mudarem.
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copia os manifestos do projeto raiz e do microserviço específico.
# A estrutura `services/auth-service` reflete a localização relativa ao contexto do Docker.
COPY package.json ./
COPY apps/services/auth-service/package.json ./apps/services/auth-service/

# Instala APENAS as dependências de produção para o workspace inteiro,
# mas focado no microserviço de autenticação.
# O `pnpm` é inteligente e buscará as dependências do workspace.
RUN pnpm install --prod --filter="auth-service..."

# Copia todo o código-fonte. Isso é feito após o `pnpm install` para otimizar o cache.
COPY . .

# Executa o build específico para o microserviço de autenticação.
# Isso compilará o TypeScript e produzirá o output no diretório `dist`.
RUN pnpm --filter auth-service build


# --- Estágio 2: Final ---
# Este estágio cria a imagem final, enxuta e otimizada para produção.
# Ele copia apenas os artefatos de build e as dependências de produção do estágio 'builder'.
FROM node:18-alpine AS final

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Cria um usuário não-root 'node' e um grupo para segurança.
# A aplicação será executada sob este usuário, e não como 'root'.
RUN addgroup -S node && adduser -S node -G node
USER node

# Copia as dependências de produção do estágio 'builder'.
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./

# Copia os artefatos de build (código JavaScript compilado) do 'auth-service'.
COPY --from=builder /usr/src/app/apps/services/auth-service/dist ./dist

# Expõe a porta em que a aplicação será executada.
EXPOSE 3001

# Comando para iniciar a aplicação.
# Executa o entrypoint do microserviço de autenticação.
CMD ["node", "dist/main.js"]
