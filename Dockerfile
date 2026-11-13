# syntax=docker/dockerfile:1.7
# CYLOO — multi-stage production image.
# TanStack Start SSR bundled with Vite; standalone Node 22 runtime for AWS.

# ---------- 1. Dependencies ----------
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json .npmrc package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts

# ---------- 2. Build ----------
FROM node:22-alpine AS build
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Public build-time env (VITE_*) is baked in here.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_APP_ENV=production
ARG VITE_APP_MODE=production
ARG APP_VERSION=6.8.9
ARG APP_COMMIT=unknown
ARG BUILD_NODE_MAX_OLD_SPACE_SIZE=4096
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_APP_ENV=$VITE_APP_ENV \
    VITE_APP_MODE=$VITE_APP_MODE \
    APP_VERSION=$APP_VERSION \
    APP_COMMIT=$APP_COMMIT \
    APP_MODE=$VITE_APP_MODE
ENV NODE_OPTIONS=--max-old-space-size=$BUILD_NODE_MAX_OLD_SPACE_SIZE
# node-server emits the standalone HTTP server used by ECS, EC2 and Docker.
ENV NITRO_PRESET=node-server
RUN npm run prebuild && npm run build:server && npm run postbuild

# ---------- 3. Runtime ----------
FROM node:22-alpine AS runtime
ARG APP_VERSION=6.8.9
ARG APP_COMMIT=unknown
LABEL org.opencontainers.image.title="CYLOO" \
      org.opencontainers.image.description="CYLOO omnichannel messaging platform" \
      org.opencontainers.image.version="$APP_VERSION" \
      org.opencontainers.image.revision="$APP_COMMIT" \
      org.opencontainers.image.vendor="CYLOO"
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    APP_VERSION=$APP_VERSION \
    APP_MODE=production
RUN addgroup -S cyloo && adduser -S cyloo -G cyloo
COPY --from=build --chown=cyloo:cyloo /app/.output ./.output
COPY --from=build --chown=cyloo:cyloo /app/package.json ./package.json
COPY --from=build --chown=cyloo:cyloo /app/scripts/start.mjs ./scripts/start.mjs
COPY --from=build --chown=cyloo:cyloo /app/scripts/lib/environment.mjs ./scripts/lib/environment.mjs
COPY --from=build --chown=cyloo:cyloo /app/scripts/verify-deployment.mjs ./scripts/verify-deployment.mjs
COPY --from=build --chown=cyloo:cyloo /app/scripts/lib/deployment-verification.mjs ./scripts/lib/deployment-verification.mjs

USER cyloo
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/api/public/health || exit 1

CMD ["node", "scripts/start.mjs"]
