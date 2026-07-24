import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not defined - database operations will fail');
}

// SSL configuration: controlled by DATABASE_SSL environment variable
// Set DATABASE_SSL=false for Coolify (internal PostgreSQL without SSL)
// Set DATABASE_SSL=true for external databases (Railway, etc.)
const shouldUseSSL = process.env.DATABASE_SSL !== 'false';
const sslConfig = shouldUseSSL ? {
  rejectUnauthorized: false,
} : false;

export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: sslConfig,
    })
  : null;

export async function query(text: string, params?: any[]) {
  if (!pool) {
    throw new Error('Database is not configured. Set DATABASE_URL environment variable.');
  }
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
