# ---------- Base stage: install dependencies ----------
FROM node:18 AS base

WORKDIR /src

# Copy only dependency files to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies (skip peer conflicts if needed)
RUN npm install --legacy-peer-deps

# Copy full project (not just /src)
COPY . .

# ---------- Dev stage: for local Expo development (LAN) ----------
FROM base AS dev

# Expose Metro bundler
EXPOSE 8081

# Expose Expo DevTools
EXPOSE 19000

# Expose Expo debugging
EXPOSE 19001

# Expose Expo web
EXPOSE 19002

# Expose Expo updates
EXPOSE 19006

# Start Expo in LAN mode (better for testing on real devices)
CMD ["npx", "expo", "start", "--web", "--clear"]

# ---------- Build stage: generate static web build ----------
FROM base AS build-web

# Run static web export
RUN npx expo export:web

# ---------- Production stage: serve static web app with NGINX ----------
FROM nginx:alpine AS prod

# Copy web build from previous stage
COPY --from=build-web /app/web-build /usr/share/nginx/html

# Expose default HTTP port
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]