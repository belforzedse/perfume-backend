# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

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

ENV NODE_ENV=production
EXPOSE 1337

COPY --from=builder /app /app

CMD ["npm", "start"]
