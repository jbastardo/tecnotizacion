import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const BASE = 'https://tutecnotienda.com';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').toLowerCase().trim();

  try {
    const res = await fetch(BASE + '/productos', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Tecnotizacion/1.0)' },
    });
    if (!res.ok) return NextResponse.json({ error: 'Could not fetch store' }, { status: 502 });

    const html = await res.text();

    // Extract just the product grid: between the product section and pagination/footer
    const gridStart = html.indexOf('<h1>Productos</h1>');
    const gridEnd = html.indexOf('<nav', gridStart > 0 ? gridStart : 0);
    const grid = gridStart > 0 && gridEnd > gridStart
      ? html.substring(gridStart, gridEnd)
      : html;

    const products: any[] = [];
    const seen = new Set<string>();

    // Extract product names from the grid: <a href="/p/slug">Name</a>
    // Only match links with actual product content (long enough text)
    const linkRegex = /<a\s+href="(\/p\/[^"]+)"[^>]*>\s*([^<]{5,})/g;
    const allLinks: { href: string; text: string }[] = [];
    let m;
    while ((m = linkRegex.exec(grid)) !== null) {
      const text = m[2].replace(/<[^>]+>/g, '').trim();
      if (text && text.length > 5) {
        allLinks.push({ href: m[1], text });
      }
    }

    // Extract prices from the grid
    const priceRegex = /US\$\s*([\d,.]+)/g;
    const allPrices: number[] = [];
    while ((m = priceRegex.exec(grid)) !== null) {
      allPrices.push(parseFloat(m[1].replace(/,/g, '')));
    }

    // Extract images from the grid
    const imgRegex = /<img\s+[^>]*src="([^"]*active_storage[^"]*)"[^>]*>/g;
    const allImages: string[] = [];
    while ((m = imgRegex.exec(grid)) !== null) {
      allImages.push(m[1]);
    }

    // Match links with prices by position (both lists are in page order)
    for (let i = 0; i < allLinks.length && i < allPrices.length; i++) {
      const link = allLinks[i];
      const img = i < allImages.length ? allImages[i] : null;
      const price = allPrices[i];
      if (!price || seen.has(link.href)) continue;
      seen.add(link.href);

      // Extract SKU from [brackets]
      const skuMatch = link.text.match(/\[([A-Z0-9][^\]]{2,})\]/);
      const sku = skuMatch ? skuMatch[1] : link.href.split('/').pop()?.split('-')[0]?.toUpperCase() || '';
      const name = link.text.replace(/^\[[^\]]+\]\s*/, '').trim();

      if (query && query.length >= 2) {
        if (!name.toLowerCase().includes(query) && !sku.toLowerCase().includes(query)) continue;
      }

      products.push({ sku, name, costUsd: price, imageUrl: img, category: 'Importado' });
      if (query && products.length >= 30) break;
    }

    return NextResponse.json({ products, total: products.length });
  } catch (e: any) {
    console.error('Store error:', e?.message || e);
    return NextResponse.json({ error: 'Failed to fetch store', products: [], total: 0 }, { status: 500 });
  }
}
