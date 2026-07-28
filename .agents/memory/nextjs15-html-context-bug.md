---
name: Next.js 15 Html/HtmlContext bug
description: Bug de prerender del /404 en App Router; solución patch quirúrgico en node_modules
---

## El bug
En Next.js 15.x (al menos hasta 15.2.9), el prerender estático del `/404` en apps
App Router puras falla con:
```
Error: <Html> should not be imported outside of pages/_document
```

**Causa**: Next.js genera internamente el `/404` usando el Pages Router Document,
pero el `HtmlContext` (que provee `useHtmlContext()`) no está inicializado en
el contexto App Router. El componente `Html` lanza un error al intentar usar ese contexto.

## Workaround en Dockerfile (3 patches en stage deps, antes del build)

### Patch 1: pages.runtime.prod.js — eliminar el throw
```js
src.replace(
  /throw Object\.defineProperty\(Error\("<Html> should not be imported outside of pages\/_document\.\nRead more[^)]+\),"__NEXT_ERROR_CODE",\{value:"E67"[^}]+\}\)/,
  'console.warn("[next-patch] Html outside HtmlContext during static generation");return null'
)
```

### Patch 2: pages/_document.js CJS — guarda null
```js
// Antes:
'const { inAmpMode, ... } = (0, _htmlcontextsharedruntime.useHtmlContext)();'
// Después:
'const _htmlCtx = (0, _htmlcontextsharedruntime.useHtmlContext)(); if (!_htmlCtx) return null; const { inAmpMode, ... } = _htmlCtx;'
```

### Patch 3: pages/_document.js ESM — misma guarda
```js
// Antes: '... = useHtmlContext();'
// Después: 'const _htmlCtx = useHtmlContext(); if (!_htmlCtx) return null; const { ... } = _htmlCtx;'
```

## Páginas que necesitan force-dynamic
- `app/not-found.tsx`: `export const dynamic = 'force-dynamic'`
- `app/producto/page.tsx`: `export const dynamic = 'force-dynamic'` (usa window.location)

## Dockerfile: NODE_ENV en stages
- Stage `deps`: `ENV NODE_ENV=development` (Coolify inyecta production; npm 10.x falla con prod)
- Stage `builder`: sin ENV override (next build debe usar production runtime)
- Stage `runner`: `ENV NODE_ENV production`

**Why:** Con NODE_ENV=development en el stage builder, next build usa runtimes `.dev.js`
causando errores RSC en `/login` y `/producto` durante el prerender.
