# syntax=docker/dockerfile:1.6

# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install deps (cached layer)
COPY package*.json ./
RUN npm ci

# Build the app with env baked in at build-time (VITE_ vars are inlined)
COPY . .
ARG APP_ENV=prod
ARG APP_VERSION=0.1.0
ARG MISTRAL_MODEL=mistral-small-latest
ARG ENABLE_AI=true
ARG SUPABASE_URL=""
ARG SUPABASE_PUBLISHABLE_KEY=""

ENV VITE_APP_ENV=$APP_ENV \
    VITE_APP_VERSION=$APP_VERSION \
    VITE_API_BASE_URL=/api \
    VITE_MISTRAL_MODEL=$MISTRAL_MODEL \
    VITE_ENABLE_AI=$ENABLE_AI \
    VITE_SUPABASE_URL=$SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_PUBLISHABLE_KEY

RUN if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_PUBLISHABLE_KEY" ]; then \
      echo "Error: Supabase configuration is missing!" && exit 1; \
    fi

RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

# Copy only what's needed to run
COPY --from=build /app/.output ./.output

# Non-root user (node is preinstalled in the base image)
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget --spider -q http://127.0.0.1:8080/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
