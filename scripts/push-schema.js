const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Try .env.local first, fall back to process.env (Coolify/Railway)
try { require('dotenv').config({ path: '.env.local' }); } catch {}

async function pushSchema() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
  }

  // Detect if we're connecting to a local/internal database
  const databaseUrl = process.env.DATABASE_URL;
  const isLocalDB = databaseUrl && (
    databaseUrl.includes('localhost') ||
    databaseUrl.includes('127.0.0.1') ||
    databaseUrl.includes('postgres:') ||
    databaseUrl.includes('.coolify') ||
    databaseUrl.includes('coolify')
  );

  const sslConfig = isLocalDB ? false : { rejectUnauthorized: false };

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
  });

  const schemaPath = path.join(__dirname, '..', 'lib', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('Pushing schema to database...');
  
  try {
    await pool.query(schema);
    console.log('Schema pushed successfully!');
    await pool.end();
  } catch (error) {
    console.error('Error pushing schema:', error.message);
    await pool.end();
    process.exit(1);
  }
}

pushSchema();
