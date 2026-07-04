# pnpm via Corepack (Version aus dem "packageManager"-Feld der package.json).
FROM node:24-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# --- Build: alle Deps installieren und die App bauen ---
FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# --- Prod-Deps: schlankes node_modules nur mit Runtime-Abhängigkeiten ---
# Eigener Stage statt `prune`, damit das Ergebnis reproduzierbar aus dem
# Lockfile kommt (esbuild/@tailwindcss/oxide sind devDeps und fehlen hier).
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# --- Runtime ---
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/build build/
COPY --from=prod-deps /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000

CMD ["node", "-r", "dotenv/config", "./build"]
