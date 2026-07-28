import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return NextResponse.json({ 
      error: 'DATABASE_URL not configured'
    }, { status: 500 });
  }

  // SSL configuration
  const shouldUseSSL = process.env.DATABASE_SSL !== 'false';
  const sslConfig = shouldUseSSL ? {
    rejectUnauthorized: false,
  } : false;

  try {
    const client = new Client({
      connectionString: databaseUrl,
      ssl: sslConfig,
    });

    await client.connect();
    
    try {
      // Verificar versión
      const versionResult = await client.query('SELECT version()');
      
      // Verificar usuario actual
      const userResult = await client.query('SELECT current_user, session_user');
      
      // Verificar base de datos actual
      const dbResult = await client.query('SELECT current_database()');
      
      // Verificar roles disponibles
      const rolesResult = await client.query(`
        SELECT rolname, rolsuper, rolcreaterole, rolcreatedb 
        FROM pg_roles 
        WHERE rolname IN ('postgres', current_user)
      `);
      
      // Verificar bases de datos disponibles
      const databasesResult = await client.query(`
        SELECT datname, datdba 
        FROM pg_database 
        WHERE datistemplate = false
        LIMIT 10
      `);

      return NextResponse.json({
        status: 'connected',
        database: {
          version: versionResult.rows[0].version,
          currentUser: userResult.rows[0].current_user,
          sessionUser: userResult.rows[0].session_user,
          currentDatabase: dbResult.rows[0].current_database,
          roles: rolesResult.rows,
          databases: databasesResult.rows
        },
        config: {
          databaseUrl: databaseUrl.replace(/:([^@]+)@/, ':***@'),
          ssl: shouldUseSSL ? 'enabled' : 'disabled'
        }
      });
    } finally {
      await client.end();
    }
  } catch (error) {
    const pgError = error as any;
    return NextResponse.json({
      status: 'error',
      error: {
        message: pgError.message,
        code: pgError.code,
        detail: pgError.detail,
        hint: pgError.hint,
        position: pgError.position,
        internalPosition: pgError.internalPosition,
        internalQuery: pgError.internalQuery,
        where: pgError.where,
        schema: pgError.schema,
        table: pgError.table,
        column: pgError.column,
        dataType: pgError.dataType,
        constraint: pgError.constraint,
        file: pgError.file,
        line: pgError.line,
        routine: pgError.routine
      },
      config: {
        databaseUrl: databaseUrl.replace(/:([^@]+)@/, ':***@'),
        ssl: shouldUseSSL ? 'enabled' : 'disabled',
        host: databaseUrl.split('@')[1]?.split(':')[0] || 'unknown',
        port: databaseUrl.split(':')[2]?.split('/')[0] || '5432',
        database: databaseUrl.split('/').pop()?.split('?')[0] || 'unknown',
        user: databaseUrl.split(':')[1]?.split('/')[0] || 'unknown'
      }
    }, { status: 500 });
  }
}
