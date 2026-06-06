import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function mapProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    costUsd: parseFloat(row.cost_usd),
    profitMargin: parseFloat(row.profit_margin) || 45,
    category: row.category,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const result = await query(
      'SELECT id, name, description, cost_usd, profit_margin, category, created_at FROM products ORDER BY created_at DESC'
    );
    return NextResponse.json(result.rows.map(mapProduct));
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, costUsd, profitMargin, category } = body;

    const result = await query(
      `INSERT INTO products (name, description, cost_usd, profit_margin, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, cost_usd, profit_margin, category, created_at`,
      [name, description || null, costUsd, profitMargin || 45, category || null]
    );

    return NextResponse.json(mapProduct(result.rows[0]), { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, costUsd, profitMargin, category } = body;

    const result = await query(
      `UPDATE products SET name = $1, description = $2, cost_usd = $3, profit_margin = $4, category = $5
       WHERE id = $6
       RETURNING id, name, description, cost_usd, profit_margin, category, created_at`,
      [name, description || null, costUsd, profitMargin || 45, category || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(mapProduct(result.rows[0]));
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    await query('DELETE FROM products WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
