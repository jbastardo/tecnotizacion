# Tecnotización - Guía de Deployment en Coolify

## Problema Original
La aplicación fue migrada de Railway a Coolify pero la conexión a PostgreSQL fallaba debido a:
1. SSL hardcodeado en `lib/db.ts` (necesario para Railway, problemático para Coolify interno)
2. Falta de configuración Docker para Coolify
3. Next.js sin modo `standalone` para optimización de imagen

## Solución Aplicada

### 1. Conexión BD Inteligente (`lib/db.ts`)
Se implementó detección automática de entorno:
- **Railway/Externo:** SSL habilitado con `rejectUnauthorized: false`
- **Coolify/Interno:** SSL deshabilitado para conexiones locales

```typescript
const isLocalDB = databaseUrl && (
  databaseUrl.includes('localhost') ||
  databaseUrl.includes('127.0.0.1') ||
  databaseUrl.includes('postgres:') ||
  databaseUrl.includes('.coolify') ||
  databaseUrl.includes('coolify')
);
const sslConfig = isLocalDB ? false : { rejectUnauthorized: false };
```

### 2. Docker Compose para Coolify
- PostgreSQL 16 Alpine con healthcheck
- Schema SQL montado como init script
- Red externa `coolify` para integración con proxy

### 3. Dockerfile Optimizado
- Multi-stage build con Next.js standalone output
- Imagen reducida (~150MB vs ~800MB)
- Usuario no-root para seguridad

## Pasos de Deployment en Coolify

### Opción A: Usar PostgreSQL de Coolify
1. En Coolify, crear un recurso "PostgreSQL"
2. Copiar la `DATABASE_URL` generada
3. Configurar la aplicación con:
   ```
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_APP_URL=https://tecnotizacion.tudominio.com
   ```
4. Coolify detectará automáticamente el Dockerfile

### Opción B: Usar docker-compose.yml
1. Subir el proyecto a Coolify como "Docker Compose"
2. Configurar variables de entorno en Coolify
3. El compose creará app + PostgreSQL juntos

## Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión PostgreSQL | `postgresql://user:***@host:5432/db` |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app | `https://tecnotizacion.tudominio.com` |
| `POSTGRES_USER` | Usuario BD (solo compose) | `tecnotizacion` |
| `POST...n` | Password BD (solo compose) | `***` |
| `POSTGRES_DB` | Nombre BD (solo compose) | `tecnotizacion` |

## Verificación Post-Deployment

1. **Health Check:**
   ```bash
   curl https://tecnotizacion.tudominio.com/api/health
   # Debe retornar: {"status":"ok","db":"connected",...}
   ```

2. **Logs de la aplicación:**
   ```bash
   # En Coolify, revisar logs del deployment
   # Buscar: "DATABASE_URL is not defined" = problema de config
   # Buscar: "connection refused" = problema de red/BD
   ```

3. **Push manual del schema (si es necesario):**
   ```bash
   npm run db:push
   ```

## Troubleshooting

### Error: "connection refused"
- Verificar que PostgreSQL esté corriendo
- Verificar que `DATABASE_URL` use el hostname correcto
- En docker-compose: el hostname es `postgres` (nombre del servicio)

### Error: "SSL required" o "no SSL"
- Si usas PostgreSQL externo: verifica que `DATABASE_URL` no contenga `localhost`
- Si usas PostgreSQL interno: el código debería detectar automáticamente y deshabilitar SSL

### Error: "database does not exist"
- Ejecutar `npm run db:push` para crear las tablas
- O verificar que el schema.sql se ejecutó en el init de PostgreSQL

### Error: "permission denied"
- Verificar credenciales en `DATABASE_URL`
- En Coolify: regenerar la URL de conexión desde el recurso PostgreSQL

## Arquitectura Multi-Tenant

La aplicación soporta múltiples tenants (empresas). Tablas principales:
- `tenants` - Empresas/organizaciones
- `users` - Usuarios asociados a tenants
- `products` - Productos por tenant
- `clients` - Clientes por tenant
- `quotes` - Cotizaciones por tenant

Cada tenant tiene su propio `tenant_id` y los datos están aislados.
