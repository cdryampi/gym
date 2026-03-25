FROM node:22-bookworm-slim AS base

WORKDIR /app

FROM base AS deps

ENV NODE_ENV=development

COPY package.json package-lock.json .npmrc ./
RUN npm ci --legacy-peer-deps

FROM deps AS builder

ENV NODE_ENV=development

COPY . .
RUN npm run build
RUN npm prune --omit=dev --legacy-peer-deps

FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PORT=9000
WORKDIR /app

COPY --from=builder /app ./
RUN rm -rf /app/src /app/integration-tests \
  && mkdir -p /app/public/admin \
  && if [ -d /app/.medusa/server/public/admin ]; then cp -R /app/.medusa/server/public/admin/. /app/public/admin/; fi

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 CMD ["node", "-e", "const port = process.env.PORT || 9000; fetch(`http://127.0.0.1:${port}/health`).then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1));"]

CMD ["npm", "run", "start"]
