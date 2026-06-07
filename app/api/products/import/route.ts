import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws) as any[];

    let imported = 0;
    let updated = 0;

    for (const row of rows) {
      const sku = (row['SKU'] || row['sku'] || '').toString().trim();
      const name = row['Nombre'] || row['name'] || '';
      const costUsd = parseFloat(row['Costo USD'] || row['cost_usd'] || row['Costo'] || row['cost']) || 0;
      if (!name || !costUsd) continue;

      const desc = row['Descripción'] || row['descripcion'] || row['description'] || null;
      const margin = parseFloat(row['Margen %'] || row['margen'] || row['profit_margin']) || 45;
      const cat = row['Categoría'] || row['categoria'] || row['category'] || null;
      const img = row['URL Imagen'] || row['url_imagen'] || row['image_url'] || null;

      if (sku) {
        // UPSERT: update if SKU exists, insert if not
        const existing = await query(
          'SELECT id FROM products WHERE sku = $1 AND tenant_id = $2',
          [sku, session.tenantId]
        );

        if (existing.rows.length > 0) {
          // Update existing product by SKU
          await query(
            `UPDATE products SET name=$1, description=$2, cost_usd=$3, profit_margin=$4, category=$5, image_url=$6
             WHERE sku=$7 AND tenant_id=$8`,
            [name, desc, costUsd, margin, cat, img, sku, session.tenantId]
          );
          updated++;
        } else {
          // Insert new product with SKU
          await query(
            `INSERT INTO products (tenant_id, sku, name, description, cost_usd, profit_margin, category, image_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [session.tenantId, sku, name, desc, costUsd, margin, cat, img]
          );
          imported++;
        }
      } else {
        // No SKU: always insert new
        await query(
          `INSERT INTO products (tenant_id, name, description, cost_usd, profit_margin, category, image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [session.tenantId, name, desc, costUsd, margin, cat, img]
        );
        imported++;
      }
    }

    return NextResponse.json({ success: true, imported, updated });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
