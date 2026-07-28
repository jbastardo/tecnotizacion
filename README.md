# Tecnotización - Sistema de Presupuestos Profesionales

Sistema multi-tenant para crear presupuestos profesionales en Venezuela, calculando precios según la forma de pago y respetando las utilidades.

## Características

- Multi-tenant (alquilable a colegas)
- Cálculo automático según forma de pago:
  - Bolívares: Usa tasa BCV para venta, tasa promedio para compra + IVA 16%
  - Efectivo/Binance/Divisas: Precio directo en USD
- Interfaz mobile-first
- Envío de presupuestos por WhatsApp
- Integración con tasas de cambio actualizadas

## Tecnologías

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL (Railway)
- Neon Database

## Desarrollo Local

```bash
npm install
npm run dev
```

## Despliegue en Railway

1. Crea un proyecto en Railway
2. Conecta este repositorio
3. Agrega una base de datos PostgreSQL
4. Configura las variables de entorno:
   - `DATABASE_URL`
5. Deploy automático

## Estructura de Base de Datos

- `tenants`: Empresas/usuarios multi-tenant
- `users`: Usuarios por tenant
- `products`: Productos con precio de costo en USD
- `quotes`: Presupuestos
- `quote_items`: Items de cada presupuesto
- `exchange_rates`: Tasas de cambio cacheadas

## Lógica de Precios

### Pago en Bolívares
- Compra: `costo_usd * tasa_promedio`
- Venta: `costo_usd * (1 + margen_utilidad) * tasa_bcv * (1 + iva)`

### Pago en Efectivo/Binance/Divisas
- Compra: `costo_usd`
- Venta: `costo_usd * (1 + margen_utilidad)`

## Licencia

MIT
