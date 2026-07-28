---
name: Coolify deploy — tecnotizaR
description: Infraestructura Coolify, env vars, UUIDs, y lecciones del deploy de tecnotizaR
---

## Infraestructura
- **Coolify UI**: https://coolify.tutecnotienda.site/login
- **Coolify API base**: https://coolify.tutecnotienda.site/api/v1
- **Servidor**: `localhost` UUID `w3zpdku0mcyj5bsibfmss5by`
- **Proyecto**: "Apps Tecnotienda" UUID `eo5v2d4pmgvwexatnddyrs4h`, env `production` UUID `ek1ykyuroo0trdqrd9d6tsrz`
- **App tecnotizaR**: UUID `uol7u71xu265wg7gnxasp1zb`, build_pack `dockercompose`
- **Repo**: `jbastardo/tecnotizacion` (público), branch `main`
- **App URL**: https://tecnotizacion.tutecnotienda.site (vía Cloudflare Tunnel)
- **Healthcheck**: GET /api/health → `{"status":"ok","db":"connected",...}`

## API Coolify para deploy
```bash
# Triggerear deploy
curl -X POST "https://coolify.tutecnotienda.site/api/v1/applications/uol7u71xu265wg7gnxasp1zb/start" \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json"

# Verificar status
curl "https://coolify.tutecnotienda.site/api/v1/deployments/<uuid>" \
  -H "Authorization: Bearer <token>"
```

## Env vars en Coolify (Runtime only, no Build-time excepto NEXT_PUBLIC_*)
- `POSTGRES_PASSWORD` — password del postgres interno
- `DATABASE_SSL=false` — sin SSL (postgres local)
- `NODE_ENV=production` — **marcar como Runtime only**, no Build-time
- `NEXT_PUBLIC_APP_URL=https://tecnotizacion.tutecnotienda.site`

**Why:** NODE_ENV=production inyectado en Build-time por Coolify causa que npm 10.x
falle silenciosamente con "Exit handler never called!" al descargar paquetes.
Solución en Dockerfile: `ENV NODE_ENV=development` en stage `deps`.

## Lecciones críticas
1. Coolify agrega ARG a todos los stages del Dockerfile para cada env var marcada como "Available at Buildtime"
2. La API v1 de Coolify no permite setear `private_key_id`, `docker_compose_domains`, ni `docker_compose_raw` via PATCH
3. El dominio real lo maneja Cloudflare Tunnel, no Coolify directamente
