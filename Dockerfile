FROM node:22-slim AS builder
WORKDIR /app
RUN npm install -g pnpm@latest
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install
COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm build

FROM node:22-slim
WORKDIR /app
RUN npm install -g pnpm@latest
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile 2>/dev/null || pnpm install --prod
COPY --from=builder /app/dist ./dist
RUN mkdir -p data
CMD ["node", "dist/index.js"]
