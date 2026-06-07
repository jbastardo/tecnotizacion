import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

function mapProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    costUsd: parseFloat(row.cost_usd),
    profitMargin: parseFloat(row.profit_margin) || 45,
    category: row.category,
    imageUrl: row.image_url || null,
    createdAt: row.created_at,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const result = await query(
      'SELECT id, name, description, cost_usd, profit_margin, category, image_url, created_at FROM products WHERE tenant_id = $1 ORDER BY created_at DESC',
      [session.tenantId]
    );
    return NextResponse.json(result.rows.map(mapProduct));
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { name, description, costUsd, profitMargin, category, imageUrl } = await request.json();
    if (!name || !costUsd) return NextResponse.json({ error: 'name and costUsd required' }, { status: 400 });

    const result = await query(
      `INSERT INTO products (tenant_id, name, description, cost_usd, profit_margin, category, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, description, cost_usd, profit_margin, category, image_url, created_at`,
      [session.tenantId, name, description || null, costUsd, profitMargin || 45, category || null, imageUrl || null]
    );
    return NextResponse.json(mapProduct(result.rows[0]), { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id, name, description, costUsd, profitMargin, category, imageUrl } = await request.json();
    if (!id || !name) return NextResponse.json({ error: 'id and name required' }, { status: 400 });

    const result = await query(
      `UPDATE products SET name = $1, description = $2, cost_usd = $3, profit_margin = $4, category = $5, image_url = $6
       WHERE id = $7 AND tenant_id = $8
       RETURNING id, name, description, cost_usd, profit_margin, category, image_url, created_at`,
      [name, description || null, costUsd, profitMargin || 45, category || null, imageUrl || null, id, session.tenantId]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapProduct(result.rows[0]));
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = await request.json();
    await query('DELETE FROM products WHERE id = $1 AND tenant_id = $2', [id, session.tenantId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
