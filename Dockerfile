# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev

COPY package*.json ./
RUN npm ci

COPY . .

# ✅ Increase Node memory limit during Strapi build
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NODE_ENV=production

RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime and build dependencies for better-sqlite3
RUN apk add --no-cache \
    sqlite \
    python3 \
    make \
    g++ \
    sqlite-dev

ENV NODE_ENV=production
EXPOSE 1337

# Copy everything from builder
COPY --from=builder /app /app

# Rebuild better-sqlite3 for the container's architecture
RUN npm rebuild better-sqlite3

# Remove build dependencies to reduce image size (optional, but keeps image smaller)
RUN apk del python3 make g++ sqlite-dev

CMD ["npm", "start"]
