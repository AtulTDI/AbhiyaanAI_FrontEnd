# ---------- Base stage ----------
FROM node:18-bullseye AS base

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install deps
RUN npm ci --legacy-peer-deps

# Copy source folder + other files
COPY App.tsx ./
COPY index.ts ./
COPY tsconfig.json ./
COPY src ./src
COPY app.config.js ./
COPY assets ./assets

# ---------- Dev stage (Expo Metro / Web Dev) ----------
FROM base AS dev

# Accept build args for APIs
ARG APP_ENV
ARG DEV_API
ARG DEV_ALT_API
ARG PROD_API
ARG PROD_ALT_API

# Pass them into runtime ENV
ENV APP_ENV=${APP_ENV}
ENV DEV_API=${DEV_API}
ENV DEV_ALT_API=${DEV_ALT_API}
ENV PROD_API=${PROD_API}
ENV PROD_ALT_API=${PROD_ALT_API}

# Expose Expo/Metro bundler ports
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002
EXPOSE 19006

# Run Expo in dev mode
CMD ["npx", "expo", "start", "--clear"]

# ---------- Build stage (Static web export) ----------
FROM base AS build

# Accept same args for build-time substitution
ARG APP_ENV
ARG DEV_API
ARG DEV_ALT_API
ARG PROD_API
ARG PROD_ALT_API

ENV APP_ENV=${APP_ENV}
ENV DEV_API=${DEV_API}
ENV DEV_ALT_API=${DEV_ALT_API}
ENV PROD_API=${PROD_API}
ENV PROD_ALT_API=${PROD_ALT_API}

# Verify Expo CLI
RUN npx expo --version

# Run static web export (Expo SDK 50+ outputs to /dist by default)
RUN npx expo export --platform web

# ---------- Prod stage (NGINX serving) ----------
FROM nginx:1.27-alpine AS prod

# Set timezone for logs
ENV TZ=UTC

# Clean default NGINX html
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from build stage (dist folder instead of .expo/web-export)
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom NGINX config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck for orchestration
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:80/ || exit 1

# Run NGINX
CMD ["nginx", "-g", "daemon off;"]