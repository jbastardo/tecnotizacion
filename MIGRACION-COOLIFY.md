# Guía de Migración: ControlBox/Railway → Coolify

## Estado Actual
- ✅ Código actualizado con detección automática SSL
- ✅ Dockerfile optimizado para Coolify
- ✅ docker-compose.yml configurado
- ✅ Configuración vieja eliminada (railway.json, Procfile)
- ❌ ControlBox aún conectado (causando fallo en commits)

---

## Paso 1: Desconectar ControlBox

### Opción A: Desde GitHub (Recomendado)

1. Ve a tu repositorio: https://github.com/jbastardo/tecnotizacion
2. Click en **"Settings"** (pestaña superior derecha)
3. En el menú lateral, busca **"Integrations"** o **"GitHub Apps"**
4. Busca **ControlBox** en la lista
5. Click en **"Configure"** o **"Remove"**
6. Confirma la eliminación

### Opción B: Desde ControlBox

1. Accede al dashboard de ControlBox
2. Busca el proyecto "tecnotizacion"
3. Elimina el proyecto o desconecta el repositorio
4. Revoca los permisos de GitHub si es necesario

### Opción C: Revocar permisos de GitHub

1. Ve a: https://github.com/settings/applications
2. Busca **ControlBox** en "Authorized OAuth Apps" o "GitHub Apps"
3. Click en **"Revoke access"**

---

## Paso 2: Configurar Coolify

### 2.1 Crear nuevo recurso

1. Accede a tu dashboard de Coolify
2. Click en **"New Resource"** → **"Docker Compose"**
3. Selecciona:
   - **Source:** Git Repository
   - **Repository:** `jbastardo/tecnotizacion`
   - **Branch:** `main`

### 2.2 Configurar variables de entorno

En la sección **"Environment Variables"** agrega:

```bash
# ============================================
# BASE DE DATOS
# ============================================
POSTGRES_USER=tecnotizacion
POST...n
POSTGRES_DB=tecnotizacion
DATABASE_URL=postgresql://tecnotizacion:***@postgres:5432/tecnotizacion

# ============================================
# APLICACIÓN
# ============================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tecnotizacion.tudominio.com

# ============================================
# OPCIONAL: Si usas dominio personalizado
# ============================================
# COOLIFY_DOMAIN=tecnotizacion.tudominio.com
```

**⚠️ IMPORTANTE:**
- Reemplaza `***` con una contraseña segura (mínimo 16 caracteres)
- Cambia `tudominio.com` por tu dominio real
- La `DATABASE_URL` debe usar el hostname `postgres` (nombre del servicio en docker-compose)

### 2.3 Configurar Build

- **Build Pack:** Docker Compose
- Coolify detectará automáticamente el `docker-compose.yml`

### 2.4 Configurar Dominio (Opcional)

Si tienes un dominio personalizado:

1. En Coolify, ve a **"Domains"**
2. Agrega: `tecnotizacion.tudominio.com`
3. Configura el DNS:
   ```
   Tipo: A
   Nombre: tecnotizacion
   Valor: <IP-de-tu-servidor-Coolify>
   ```

### 2.5 Deploy

1. Click en **"Deploy"**
2. Espera el build (3-5 minutos)
3. Monitorea los logs buscando:
   ```
   ✅ Schema pushed successfully!
   ✅ Server ready at http://0.0.0.0:3000
   ```

---

## Paso 3: Verificación Post-Deployment

### 3.1 Health Check

```bash
curl https://tecnotizacion.tudominio.com/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-07-24T..."
}
```

### 3.2 Verificar Base de Datos

```bash
# Acceder al contenedor PostgreSQL
docker exec -it tecnotizacion-db psql -U tecnotizacion -d tecnotizacion

# Listar tablas
\dt

# Verificar datos
SELECT * FROM tenants LIMIT 5;
```

### 3.3 Logs de la Aplicación

En Coolify, revisa los logs del deployment. Busca:
- ✅ `DATABASE_URL is not defined` → **NO debe aparecer** (indica config correcta)
- ✅ `connection refused` → **NO debe aparecer** (indica BD conectada)
- ✅ `Server ready` → **Debe aparecer** (app corriendo)

---

## Troubleshooting

### Error: "ControlBox still failing"

**Causa:** ControlBox aún está conectado al repositorio.

**Solución:**
1. Desconectar ControlBox (Paso 1 arriba)
2. O ignorar el fallo (no afecta el deployment en Coolify)

### Error: "connection refused" en Coolify

**Causa:** La app no puede conectar con PostgreSQL.

**Solución:**
1. Verificar que `DATABASE_URL` use `postgres` como hostname
2. Verificar que PostgreSQL esté corriendo: `docker ps | grep postgres`
3. Revisar logs de PostgreSQL: `docker logs tecnotizacion-db`

### Error: "database does not exist"

**Causa:** El schema no se creó automáticamente.

**Solución:**
```bash
# Acceder al contenedor de la app
docker exec -it tecnotizacion-app sh

# Ejecutar migración manual
npm run db:push
```

### Error: "SSL required" o "no SSL"

**Causa:** Conflicto de configuración SSL.

**Solución:**
- El código ya tiene detección automática
- Verificar que `DATABASE_URL` no contenga `localhost` si es BD externa
- Para BD interna de Coolify, el código debería detectar automáticamente

---

## Arquitectura Final

```
┌─────────────────────────────────────┐
│           Coolify Server            │
│                                     │
│  ┌──────────────  ┌─────────────┐ │
│  │   Next.js    │  │  PostgreSQL │ │
│  │     App      │──│     16      │ │
│  │  (Port 3000) │  │  (Port 5432)│ │
│  └──────┬───────┘  └─────────────┘ │
│         │                           │
│  ┌──────▼───────┐                   │
│  │   Coolify    │                   │
│  │    Proxy     │                   │
│  │  (Traefik)   │                   │
│  └──────┬───────┘                   │
└────────────────────────────────────┘
          │
    ┌─────▼──────┐
    │  Internet  │
    │  (HTTPS)   │
    └────────────
```

---

## Checklist Final

- [ ] ControlBox desconectado del repositorio
- [ ] Variables de entorno configuradas en Coolify
- [ ] Deploy exitoso en Coolify
- [ ] Health check responde OK
- [ ] Base de datos conectada
- [ ] Dominio configurado (si aplica)
- [ ] SSL/HTTPS funcionando
- [ ] Backups configurados en Coolify

---

## Recursos Adicionales

- **Documentación Coolify:** https://coolify.io/docs/
- **Next.js Docker:** https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- **PostgreSQL Docker:** https://hub.docker.com/_/postgres
- **Soporte Coolify:** https://discord.gg/coolify

---

## Notas de Seguridad

1. **Contraseñas:** Usa contraseñas fuertes para PostgreSQL (mínimo 16 caracteres)
2. **Backups:** Configura backups automáticos en Coolify
3. **SSL:** Coolify maneja SSL automáticamente con Let's Encrypt
4. **Updates:** Mantén Coolify actualizado para parches de seguridad
5. **Monitoreo:** Configura alertas de recursos en Coolify
