# syntax=docker/dockerfile:1
# CO4-020: Multi-stage build
# Stage 1 — build the SPA
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
# Build-time env vars (not secrets — these are public Vite VITE_ vars only)
ARG VITE_API_BASE_URL=''
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npx vite build

# Stage 2 — production runtime (Node serves static dist + /api/* proxy)
FROM node:20-alpine AS runtime
WORKDIR /app

# Only install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled SPA and server
COPY --from=builder /app/dist ./dist
COPY server.cjs ./server.cjs

# Runtime secrets injected via env — never baked into image
# Required: GEMINI_API_KEY, FRONTEND_ORIGIN
# Optional: BACKEND_PORT (default 3001), GENERATION_ENABLED (default true)
ENV NODE_ENV=production
ENV BACKEND_PORT=3001

EXPOSE 3001

CMD ["node", "server.cjs"]
