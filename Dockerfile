# ---------- Base stage ----------
FROM node:18-bullseye AS base

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install deps
RUN npm ci --legacy-peer-deps

# Copy project files
COPY App.tsx ./
COPY index.ts ./
COPY tsconfig.json ./
COPY app.config.js ./
COPY i18n.ts ./
COPY locales ./locales
COPY src ./src
COPY assets ./assets

# ---------- Dev stage (Expo Metro / Web Dev) ----------
FROM base AS dev

# Accept build args for APIs
ARG APP_ENV
ARG DEV_API
ARG DEV_ALT_API
ARG UAT_API
ARG UAT_ALT_API
ARG DEMO_API
ARG DEMO_ALT_API
ARG PROD_API
ARG PROD_ALT_API

# Inject as ENV for runtime usage
ENV APP_ENV=${APP_ENV}
ENV DEV_API=${DEV_API}
ENV DEV_ALT_API=${DEV_ALT_API}
ENV UAT_API=${UAT_API}
ENV UAT_ALT_API=${UAT_ALT_API}
ENV DEMO_API=${DEMO_API}
ENV DEMO_ALT_API=${DEMO_ALT_API}
ENV PROD_API=${PROD_API}
ENV PROD_ALT_API=${PROD_ALT_API}

# Expose Expo/Metro ports
EXPOSE 8081 19000 19001 19002 19006

# Start Expo in dev mode
CMD ["npx", "expo", "start", "--clear"]

# ---------- Build stage (Static Web Export) ----------
FROM base AS build

ARG APP_ENV
ARG DEV_API
ARG DEV_ALT_API
ARG UAT_API
ARG UAT_ALT_API
ARG DEMO_API
ARG DEMO_ALT_API
ARG PROD_API
ARG PROD_ALT_API

ENV APP_ENV=${APP_ENV}
ENV DEV_API=${DEV_API}
ENV DEV_ALT_API=${DEV_ALT_API}
ENV UAT_API=${UAT_API}
ENV UAT_ALT_API=${UAT_ALT_API}
ENV DEMO_API=${DEMO_API}
ENV DEMO_ALT_API=${DEMO_ALT_API}
ENV PROD_API=${PROD_API}
ENV PROD_ALT_API=${PROD_ALT_API}

# Build Expo web output
RUN npx expo export --platform web

# ---------- Prod stage (NGINX serving) ----------
FROM nginx:1.27-alpine AS prod

ENV TZ=UTC

# Clean default Nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]