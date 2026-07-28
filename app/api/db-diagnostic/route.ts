import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return NextResponse.json({ 
      error: 'DATABASE_URL not configured',
      env: {
        DATABASE_URL: 'undefined'
      }
    }, { status: 500 });
  }

  // SSL configuration: controlled by DATABASE_SSL environment variable
  const shouldUseSSL = process.env.DATABASE_SSL !== 'false';
  const sslConfig = shouldUseSSL ? {
    rejectUnauthorized: false,
  } : false;

  try {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslConfig,
    });

    // Probar conexión
    const client = await pool.connect();
    
    try {
      // Verificar versión de PostgreSQL
      const versionResult = await client.query('SELECT version()');
      
      // Verificar usuario actual
      const userResult = await client.query('SELECT current_user');
      
      // Verificar base de datos actual
      const dbResult = await client.query('SELECT current_database()');
      
      // Verificar tablas
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        LIMIT 10
      `);

      return NextResponse.json({
        status: 'connected',
        database: {
          version: versionResult.rows[0].version,
          currentUser: userResult.rows[0].current_user,
          currentDatabase: dbResult.rows[0].current_database,
          tables: tablesResult.rows.map(r => r.table_name)
        },
        config: {
          host: databaseUrl.split('@')[1]?.split(':')[0] || 'unknown',
          port: databaseUrl.split(':').slice(-2)[0] || 'unknown',
          database: databaseUrl.split('/').pop()?.split('?')[0] || 'unknown'
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any).code,
        detail: (error as any).detail
      },
      config: {
        databaseUrl: databaseUrl.replace(/:([^@]+)@/, ':***@'),
        host: databaseUrl.split('@')[1]?.split(':')[0] || 'unknown',
        port: databaseUrl.split(':').slice(-2)[0] || 'unknown',
        database: databaseUrl.split('/').pop()?.split('?')[0] || 'unknown'
      }
    }, { status: 500 });
  }
}
