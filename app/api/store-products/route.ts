import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const BASE = 'https://tutecnotienda.com';

async function fetchPage(path: string) {
  const res = await fetch(BASE + path, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) return '';
  return await res.text();
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').toLowerCase().trim();

  const products: any[] = [];
  const seen = new Set<string>();

  try {
    for (let page = 1; page <= 5; page++) {
      const path = page === 1 ? '/productos' : `/productos?page=${page}`;
      const html = await fetchPage(path);
      if (!html) break;

      // Split by "Vista rápida" - each product card contains this link
      const cards = html.split('Vista rápida');
      if (cards.length <= 1) break;

      for (let i = 0; i < cards.length - 1; i++) {
        const block = cards[i];

        // Extract product link
        const hrefMatch = block.match(/\/p\/([a-z0-9-]+(?:-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})?)/i);
        if (!hrefMatch) continue;

        const slug = hrefMatch[0];
        const linkId = hrefMatch[1];
        if (seen.has(linkId)) continue;
        seen.add(linkId);

        // Extract image URL
        const imgMatch = block.match(/src="([^"]*active_storage[^"]*)"/);

        // Extract price - look for US$ followed by number
        const priceMatch = block.match(/US\$\s*([\d,.]+)/);

        // Extract name - look for text right before the link to /p/
        const nameMatch = block.match(/<a[^>]*href="\/p\/[^"]*"[^>]*>\s*\n?\s*([^\n<]+)/);
        let name = nameMatch ? nameMatch[1].trim() : '';

        if (!priceMatch || !name) continue;

        const price = parseFloat(priceMatch[1].replace(/,/g, ''));

        // Extract SKU from [brackets] in name
        const skuMatch = name.match(/\[([A-Z0-9][^\]]{2,})\]/);
        const sku = skuMatch ? skuMatch[1] : linkId.split('-')[0]?.toUpperCase() || '';

        // Remove SKU prefix from name
        name = name.replace(/^\[[^\]]+\]\s*/, '').trim();

        // Filter by query if present
        if (query && query.length >= 2) {
          const n = name.toLowerCase();
          const s = sku.toLowerCase();
          if (!n.includes(query) && !s.includes(query)) continue;
        }

        products.push({
          sku,
          name,
          costUsd: price,
          imageUrl: imgMatch ? imgMatch[1] : null,
          category: 'Importado',
        });

        if (query && products.length >= 20) break;
      }

      if (!html.includes('?page=' + (page + 1))) break;
      if (products.length >= 100) break;
    }
  } catch (e) {
    console.error('Store fetch error:', e);
  }

  return NextResponse.json({ products, total: products.length });
}
