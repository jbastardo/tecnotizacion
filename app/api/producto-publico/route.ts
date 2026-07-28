import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Product id required' }, { status: 400 });

  try {
    const result = await query(
      'SELECT id, name, description, cost_usd, profit_margin, category, image_url FROM products WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const p = result.rows[0];
    const salePrice = parseFloat(p.cost_usd) / (1 - (parseFloat(p.profit_margin) || 45) / 100);

    return NextResponse.json({
      id: p.id,
      name: p.name,
      description: p.description,
      costUsd: parseFloat(p.cost_usd),
      profitMargin: parseFloat(p.profit_margin) || 45,
      salePriceUsd: salePrice,
      category: p.category,
      imageUrl: p.image_url,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Error fetching product' }, { status: 500 });
  }
}
