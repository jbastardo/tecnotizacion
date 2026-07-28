import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Endpoint temporal de migración — remover después de ejecutar
export async function POST(request: Request) {
  const secret = request.headers.get('x-migrate-secret');
  if (secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { table, rows } = await request.json();
  if (!table || !rows?.length) return NextResponse.json({ ok: true, inserted: 0 });
  if (!pool) return NextResponse.json({ error: 'No DB' }, { status: 500 });

  const COLS: Record<string, string[]> = {
    tenants:  ['id','name','slug','owner_email','iva_rate','created_at','updated_at'],
    users:    ['id','tenant_id','email','password_hash','name','role','created_at'],
    products: ['id','tenant_id','name','sku','description','cost_usd','profit_margin','category','image_url','created_at','updated_at'],
    clients:  ['id','tenant_id','rif','name','phone','email','is_revendedor','discount_revendedor','created_at','updated_at'],
    quotes:   ['id','tenant_id','quote_number','client_name','client_phone','client_email','payment_method','status','notes','total_usd','total_bs','items_data','rates_data','created_at','updated_at'],
  };

  const cols = COLS[table];
  if (!cols) return NextResponse.json({ error: 'Unknown table' }, { status: 400 });

  const client = await pool.connect();
  let inserted = 0;
  const errors: string[] = [];

  try {
    for (const row of rows) {
      const vals = cols.map(c => {
        const v = row[c];
        if (v === '' || v === undefined) return null;
        return v;
      });
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
      const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;
      try {
        await client.query(sql, vals);
        inserted++;
      } catch (e: any) {
        errors.push(`row ${inserted}: ${e.message}`);
      }
    }
  } finally {
    client.release();
  }

  return NextResponse.json({ ok: true, inserted, errors: errors.slice(0, 10) });
}
