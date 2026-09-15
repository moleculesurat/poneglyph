FROM node:26-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run bundle

FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080 STATE_DIR=/data
COPY --from=build /app/out ./out
COPY --from=build /app/dist ./dist
COPY server.mjs store.mjs ./
EXPOSE 8080
CMD ["node", "server.mjs"]
