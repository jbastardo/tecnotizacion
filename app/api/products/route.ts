import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

function mapProduct(row: any) {
  return {
    id: row.id,
    sku: row.sku || '',
    name: row.name,
    description: row.description,
    costUsd: parseFloat(row.cost_usd),
    profitMargin: parseFloat(row.profit_margin) || 45,
    category: row.category,
    imageUrl: row.image_url || null,
    createdAt: row.created_at,
  };
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  // Store search: proxy to tutecnotienda.com
  if (searchParams.get('source') === 'store') {
    return handleStoreSearch(searchParams);
  }

  const tryQuery = async (sql: string) => {
    try { return await query(sql, [session.tenantId]); } catch { return null; }
  };

  // Try all column combinations, preferring ones with sku and image_url
  let result = await tryQuery(
    'SELECT id, sku, name, description, cost_usd, profit_margin, category, image_url, created_at FROM products WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY created_at DESC'
  );
  if (!result) result = await tryQuery(
    'SELECT id, sku, name, description, cost_usd, profit_margin, category, created_at FROM products WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY created_at DESC'
  );
  if (!result) result = await tryQuery(
    'SELECT id, name, description, cost_usd, profit_margin, category, image_url, created_at FROM products WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY created_at DESC'
  );
  if (!result) result = await tryQuery(
    'SELECT id, name, description, cost_usd, profit_margin, category, created_at FROM products WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY created_at DESC'
  );
  if (!result) result = await tryQuery(
    'SELECT id, name, description, cost_usd, profit_margin, category, created_at FROM products ORDER BY created_at DESC'
  );

  if (result) return NextResponse.json(result.rows.map(mapProduct));
  return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { name, description, costUsd, profitMargin, category, imageUrl, sku } = await request.json();
    if (!name || !costUsd) return NextResponse.json({ error: 'name and costUsd required' }, { status: 400 });

    const params = [session.tenantId, name, description || null, costUsd, profitMargin || 45, category || null];

    const tryInsert = async (sql: string, p: any[]) => {
      try { return await query(sql, p); } catch { return null; }
    };

    let result = await tryInsert(
      `INSERT INTO products (tenant_id, name, description, cost_usd, profit_margin, category, image_url, sku)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, sku, name, description, cost_usd, profit_margin, category, image_url, created_at`,
      [...params, imageUrl || null, sku || null]
    );
    if (!result) result = await tryInsert(
      `INSERT INTO products (tenant_id, name, description, cost_usd, profit_margin, category, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, description, cost_usd, profit_margin, category, image_url, created_at`,
      [...params, imageUrl || null]
    );
    if (!result) result = await tryInsert(
      `INSERT INTO products (tenant_id, name, description, cost_usd, profit_margin, category)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, description, cost_usd, profit_margin, category, created_at`,
      params
    );

    if (!result) return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    const row = result.rows[0];
    return NextResponse.json({
      id: row.id, sku: row.sku || '', name: row.name, description: row.description || '',
      costUsd: parseFloat(row.cost_usd), profitMargin: parseFloat(row.profit_margin) || 45,
      category: row.category, imageUrl: row.image_url || null, createdAt: row.created_at,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { id, name, description, costUsd, profitMargin, category, imageUrl, sku } = await request.json();
    if (!id || !name) return NextResponse.json({ error: 'id and name required' }, { status: 400 });

    const result = await query(
      `UPDATE products SET name = $1, description = $2, cost_usd = $3, profit_margin = $4, category = $5, image_url = $6, sku = $7
       WHERE id = $8 AND tenant_id = $9
       RETURNING id, sku, name, description, cost_usd, profit_margin, category, image_url, created_at`,
      [name, description || null, costUsd, profitMargin || 45, category || null, imageUrl || null, sku || null, id, session.tenantId]
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

async function handleStoreSearch(params: URLSearchParams) {
  const query = (params.get('q') || '').toLowerCase().trim();
  try {
    const res = await fetch('https://tutecnotienda.com/productos', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Tecnotizacion/1.0)' },
    });
    if (!res.ok) return NextResponse.json({ error: 'Store returned ' + res.status }, { status: 502 });

    const html = await res.text();
    const start = html.indexOf('Productos</h1>');
    const end = html.indexOf('<nav', start > 0 ? start : 0);
    const grid = start > 0 && end > start ? html.substring(start, end) : html;

    const products: any[] = [];
    const seen = new Set<string>();

    // Match: <a href="/p/slug...">any text here</a>
    const linkRegex = /<a\s[^>]*href="(\/p\/[^"]+)"[^>]*>([^<]+)</gi;
    let m;
    const links: { href: string; text: string }[] = [];
    while ((m = linkRegex.exec(grid)) !== null) {
      const text = m[2]?.trim();
      if (text && text.length > 3) links.push({ href: m[1], text });
    }

    const priceRegex = /US\$\s*([\d,.]+)/gi;
    const prices: number[] = [];
    while ((m = priceRegex.exec(grid)) !== null) {
      prices.push(parseFloat(m[1].replace(/,/g, '')));
    }

    const imgRegex = /<img[^>]+src="([^"]*active_storage[^"]*)"[^>]*>/gi;
    const images: string[] = [];
    while ((m = imgRegex.exec(grid)) !== null) {
      images.push(m[1]);
    }

    for (let i = 0; i < links.length && i < prices.length; i++) {
      const link = links[i];
      if (!prices[i] || seen.has(link.href)) continue;
      seen.add(link.href);

      const skuMatch = link.text.match(/\[([A-Z0-9][^\]]{2,})\]/);
      const sku = skuMatch ? skuMatch[1] : link.href.split('/').pop()?.split('-')[0]?.toUpperCase() || '';
      const name = link.text.replace(/^\[[^\]]+\]\s*/, '').trim();
      const img = i < images.length ? images[i] : null;

      if (query && !name.toLowerCase().includes(query) && !sku.toLowerCase().includes(query)) continue;

      products.push({ sku, name, costUsd: prices[i], imageUrl: img, category: 'Importado' });
      if (query && products.length >= 30) break;
    }

    return NextResponse.json({
      products,
      total: products.length,
      debug: { linksFound: links.length, pricesFound: prices.length, imagesFound: images.length, gridSize: grid.length },
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Store fetch failed: ' + (e?.message || 'unknown'), products: [], total: 0 });
  }
}
