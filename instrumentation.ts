export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { pool } = await import('@/lib/db');
    if (!pool) {
      console.warn('[tecnotizaR] DATABASE_URL no definida — schema skipped');
      return;
    }
    const fs = await import('fs');
    const path = await import('path');
    const schema = fs.readFileSync(path.join(process.cwd(), 'lib/schema.sql'), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query(schema);
      console.log('[tecnotizaR] Schema aplicado OK');
    } catch (err) {
      console.error('[tecnotizaR] Error aplicando schema:', err);
    } finally {
      client.release();
    }
  }
}
