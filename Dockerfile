FROM node:20-slim AS base

# Install dependencies (including devDependencies for build)
FROM base AS deps
# libc6-compat no es necesario en Debian (glibc ya disponible).
# NODE_ENV=development: Coolify inyecta NODE_ENV=production como build-arg en
# todos los stages; con prod, npm 10.x falla al descargar binarios @next/swc-*.
ENV NODE_ENV=development
WORKDIR /app
COPY package.json package-lock.json* ./
# npm 10.8.2 (incluido en node:20-slim) falla con "Exit handler never called!"
# a los 72s exactos al descargar paquetes pesados de Next.js 15. Es un bug
# conocido de npm 10.x con timeouts de red. npm 12 lo resuelve.
RUN npm install -g npm@11 && npm install --include=dev

# Patch de Next.js 15.x: el componente Html del Pages Router lanza un error
# durante la generación estática del /404 en apps App Router porque el
# HtmlContext no está inicializado. Se aplica aquí (stage deps) donde están
# los node_modules, antes del build.
RUN node -e "\
  const fs = require('fs');\
  \
  /* Patch 1: pages.runtime.prod.js — Html function que hace throw */\
  const runtimeFile = 'node_modules/next/dist/compiled/next-server/pages.runtime.prod.js';\
  let src = fs.readFileSync(runtimeFile, 'utf8');\
  src = src.replace(\
    /throw Object\\.defineProperty\\(Error\\(\"<Html> should not be imported outside of pages\\/_document\\.\\\\nRead more[^)]+\\),\"__NEXT_ERROR_CODE\",\\{value:\"E67\"[^}]+\\}\\)/,\
    'console.warn(\"[next-patch] Html outside HtmlContext during static generation\");return null'\
  );\
  fs.writeFileSync(runtimeFile, src);\
  \
  /* Patch 2: pages/_document.js CJS — destructuring de useHtmlContext() sin guarda null */\
  const docFileCJS = 'node_modules/next/dist/pages/_document.js';\
  let docSrc = fs.readFileSync(docFileCJS, 'utf8');\
  docSrc = docSrc.replace(\
    'const { inAmpMode, docComponentsRendered, locale, scriptLoader, __NEXT_DATA__ } = (0, _htmlcontextsharedruntime.useHtmlContext)();',\
    'const _htmlCtx = (0, _htmlcontextsharedruntime.useHtmlContext)(); if (!_htmlCtx) return null; const { inAmpMode, docComponentsRendered, locale, scriptLoader, __NEXT_DATA__ } = _htmlCtx;'\
  );\
  fs.writeFileSync(docFileCJS, docSrc);\
  \
  /* Patch 3: pages/_document.js ESM — misma guarda */\
  const docFileESM = 'node_modules/next/dist/esm/pages/_document.js';\
  let docESM = fs.readFileSync(docFileESM, 'utf8');\
  docESM = docESM.replace(\
    'const { inAmpMode, docComponentsRendered, locale, scriptLoader, __NEXT_DATA__ } = useHtmlContext();',\
    'const _htmlCtx = useHtmlContext(); if (!_htmlCtx) return null; const { inAmpMode, docComponentsRendered, locale, scriptLoader, __NEXT_DATA__ } = _htmlCtx;'\
  );\
  fs.writeFileSync(docFileESM, docESM);\
  \
  console.log('Next.js patches aplicados OK');\
"

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next build con NODE_ENV=production (correcto para el runtime de Next.js).
# Las devDeps ya están instaladas en el stage deps.
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/lib/schema.sql ./lib/schema.sql

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
