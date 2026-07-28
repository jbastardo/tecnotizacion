# ── Stage 1: Builder ────────────────────────────────────────────────────────
# IMPORTANTE: Usar imagen glibc (bookworm), NO alpine/musl.
# pnpm-workspace.yaml excluye los binarios musl de esbuild/lightningcss/rollup.
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Habilitar pnpm con la misma versión que el workspace
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

# Copiar manifests del workspace primero (cache layer)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copiar package.json de cada paquete del workspace
COPY lib/db/package.json            lib/db/
COPY lib/api-zod/package.json       lib/api-zod/
COPY lib/api-spec/package.json      lib/api-spec/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY artifacts/api-server/package.json artifacts/api-server/
COPY scripts/package.json           scripts/

# Instalar dependencias (lockfile congelado = build reproducible)
RUN pnpm install --frozen-lockfile

# Copiar el resto del código fuente
COPY lib/                  lib/
COPY artifacts/api-server/ artifacts/api-server/

# Compilar el bundle de producción con esbuild
RUN pnpm --filter @workspace/api-server run build

# ── Stage 2: Runner ─────────────────────────────────────────────────────────
# esbuild bundlea todo en dist/ — no se necesitan node_modules en producción
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Solo se copia el bundle compilado
COPY --from=builder /app/artifacts/api-server/dist ./dist

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
