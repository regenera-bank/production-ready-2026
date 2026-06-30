FROM node:22.16.0-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build && npm prune --omit=dev
FROM node:22.16.0-alpine
USER node
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 8443
CMD ["node","dist/server.js"]
