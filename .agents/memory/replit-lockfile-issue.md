---
name: package-lock.json en Replit
description: El lockfile generado en Replit contiene URLs del proxy interno que rompen builds fuera de Replit
---

## El problema
Cuando `npm install` corre en Replit, el lockfile resultante tiene URLs como:
```
"resolved": "http://package-firewall.replit.local/npm/to-regex-range/-/to-regex-range-5.0.1.tgz"
```
en vez de `https://registry.npmjs.org/`.

Además, Replit Security Policy bloquea algunos paquetes con CVE (ej. `@emnapi/runtime`, `@emnapi/core`)
que Next.js 15.2.9 requiere. El lockfile queda incompleto.

## Síntomas en builds externos (Coolify, CI)
- npm 10.x: `npm error Exit handler never called!` a los 72 segundos (falla silenciosa)
- npm 11+: `npm error ENOTFOUND package-firewall.replit.local` (error claro)
- `npm ci`: `Missing: @emnapi/runtime@1.11.3 from lock file`

## Fix después de cada npm install en Replit
```bash
sed -i 's|http://package-firewall.replit.local/npm/|https://registry.npmjs.org/|g' package-lock.json
```

Verificar que no queden referencias:
```bash
grep -c "package-firewall.replit.local" package-lock.json  # debe dar 0
```

**Why:** El lockfile se commitea al repo y Coolify lo usa en el Docker build. Si tiene URLs
de Replit, el build falla en el servidor de Coolify que no tiene acceso a ese proxy interno.

## Dockerfile: usar npm install no npm ci
Como el lockfile puede tener paquetes faltantes (bloqueados por Replit Security Policy),
usar `npm install --include=dev` en el Dockerfile en vez de `npm ci`.
`npm ci` requiere lockfile perfecto; `npm install` resuelve paquetes faltantes.
