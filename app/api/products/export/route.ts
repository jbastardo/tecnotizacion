import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const result = await query(
      'SELECT name, sku, description, cost_usd, profit_margin, category, image_url FROM products WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY created_at DESC',
      [session.tenantId]
    );

    const data = result.rows.map((r: any) => ({
      SKU: r.sku || '',
      Nombre: r.name,
      Descripción: r.description || '',
      'Costo USD': parseFloat(r.cost_usd),
      'Margen %': parseFloat(r.profit_margin) || 45,
      Categoría: r.category || '',
      'URL Imagen': r.image_url || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 50 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=productos.xlsx',
      },
    });
  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
