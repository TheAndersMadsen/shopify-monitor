# syntax=docker/dockerfile:1

# Stage 1: Base
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json bun.lockb* ./
# --frozen-lockfile ensures reproducible builds
# --production skips devDependencies (though we only have types, good habit)
RUN bun install --frozen-lockfile --production

# Stage 3: Runner
FROM base AS runner

# Set environment variables
ENV NODE_ENV=production
ENV WEBHOOK_URL=""

# Create a non-root user and group if not present (Alpine/Bun image usually has 'bun')
# We ensure strict permissions for the data directory
USER bun

# Copy dependencies from deps stage
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=deps --chown=bun:bun /app/package.json ./package.json

# Copy source code
COPY --chown=bun:bun *.ts ./
COPY --chown=bun:bun dashboard.html ./

# Create data directory with correct permissions for the 'bun' user
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Entry point
ENTRYPOINT ["bun", "run", "server.ts"]