import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query('SELECT 1');
    return NextResponse.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() }, { status: 500 });
  }
}
