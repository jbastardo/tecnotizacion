import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    if (!pool) {
      return NextResponse.json({ 
        status: 'error', 
        db: 'not_configured',
        message: 'DATABASE_URL is not defined',
        timestamp: new Date().toISOString() 
      }, { status: 500 });
    }

    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return NextResponse.json({ 
        status: 'ok', 
        db: 'connected', 
        timestamp: new Date().toISOString() 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? {
      message: errorMessage,
      code: (error as any).code,
      detail: (error as any).detail,
    } : { message: errorMessage };

    return NextResponse.json({ 
      status: 'error', 
      db: 'disconnected',
      error: errorDetails,
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}
