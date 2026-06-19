const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Try .env.local first, fall back to process.env (Railway)
try { require('dotenv').config({ path: '.env.local' }); } catch {}

async function pushSchema() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
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
