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
    for (const row of rows) {
      const name = row['Nombre'] || row['name'];
      const costUsd = parseFloat(row['Costo USD'] || row['cost_usd'] || row['Costo'] || row['cost']) || 0;
      if (!name || !costUsd) continue;

      await query(
        `INSERT INTO products (tenant_id, name, description, cost_usd, profit_margin, category, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          session.tenantId,
          name,
          row['Descripción'] || row['descripcion'] || row['description'] || null,
          costUsd,
          parseFloat(row['Margen %'] || row['margen'] || row['profit_margin']) || 45,
          row['Categoría'] || row['categoria'] || row['category'] || null,
          row['URL Imagen'] || row['url_imagen'] || row['image_url'] || null,
        ]
      );
      imported++;
    }

    return NextResponse.json({ success: true, imported });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
