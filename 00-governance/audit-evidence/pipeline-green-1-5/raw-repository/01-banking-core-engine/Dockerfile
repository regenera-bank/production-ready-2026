FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser
USER nodeuser
# CAMINHO REAL: dist/src/main.js
CMD ["node", "dist/src/main.js"]
