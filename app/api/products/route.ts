import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const products = await sql`
      SELECT id, name, description, cost_usd, category, created_at
      FROM products
      ORDER BY created_at DESC
    `;
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, costUsd, category } = body;

    const result = await sql`
      INSERT INTO products (name, description, cost_usd, category)
      VALUES (${name}, ${description || null}, ${costUsd}, ${category || null})
      RETURNING id, name, description, cost_usd, category, created_at
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
