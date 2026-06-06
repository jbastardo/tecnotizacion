import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      'SELECT id, name, description, cost_usd, profit_margin, category, created_at FROM products ORDER BY created_at DESC'
    );
    return NextResponse.json(result.rows);
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

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
