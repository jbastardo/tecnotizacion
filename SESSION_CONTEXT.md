# Sesión: Tecnotización - Migración Railway a Coolify
**Session ID:** f6abc37294f6  
**Fecha:** 24 julio 2026  
**Estado:** Código actualizado y push exitoso a GitHub

## Contexto
- Aplicación Next.js + PostgreSQL migrada de Railway a Coolify
- Problema: Conexión a BD fallaba por SSL hardcodeado
- Solución: Detección automática de entorno (SSL inteligente)

## Archivos modificados
- `lib/db.ts` - Detección automática SSL
- `Dockerfile` - Multi-stage build optimizado
- `docker-compose.yml` - Stack completo con PostgreSQL 16
- `next.config.ts` - Output standalone
- `scripts/push-schema.js` - Misma lógica SSL
- `.env.coolify.example` - Variables de entorno
- `DEPLOYMENT.md` - Guía completa

## Próximos pasos
1. Re-deploy en Coolify desde dashboard
2. Configurar variables de entorno en Coolify:
   - DATABASE_URL
   - NEXT_PUBLIC_APP_URL
3. Verificar healthcheck: `/api/health`

## Workspace
- Ruta: `/workspace/task-tecnotizacion-coolify`
- Repo: https://github.com/jbastardo/tecnotizacion
- Commit: d042ffa

## Habilidad documentada
- `railway-to-coolify-migration` en `/workspace/autolearning/skills/devops/`

## Para continuar esta sesión
```bash
hermes --resume f6abc37294f6
```
