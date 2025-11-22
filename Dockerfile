# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

FROM base AS runner

ENV NODE_ENV=production

RUN mkdir -p /app/data && chown -R bun:bun /app

USER bun

COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=deps --chown=bun:bun /app/package.json ./package.json
COPY --chown=bun:bun *.ts ./
COPY --chown=bun:bun dashboard.html ./

EXPOSE 3000

ENTRYPOINT ["bun", "run", "server.ts"]