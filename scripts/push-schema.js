const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

async function pushSchema() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in .env.local');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const schemaPath = path.join(__dirname, '..', 'lib', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('Pushing schema to database...');
  
  try {
    await sql(schema);
    console.log('Schema pushed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error.message);
    process.exit(1);
  }
}

pushSchema();
