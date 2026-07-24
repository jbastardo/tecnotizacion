import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not defined - database operations will fail');
}

// Detect if we're connecting to a local/internal database (Coolify) vs external (Railway)
const isLocalDB = databaseUrl && (
  databaseUrl.includes('localhost') ||
  databaseUrl.includes('127.0.0.1') ||
  databaseUrl.includes('postgres:') ||
  databaseUrl.includes('.coolify') ||
  databaseUrl.includes('coolify')
);

// SSL configuration: only enable for external databases
const sslConfig = isLocalDB ? false : {
  rejectUnauthorized: false,
};

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
