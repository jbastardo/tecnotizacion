import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Endpoint temporal de migración — remover después de ejecutar
export async function POST(request: Request) {
  const secret = request.headers.get('x-migrate-secret');
  if (secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sql } = await request.json();
  if (!sql) return NextResponse.json({ error: 'No SQL provided' }, { status: 400 });

  try {
    await query(sql);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
}
