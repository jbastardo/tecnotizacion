import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const pageNum = parseInt(searchParams.get('page') || '1');

  const products: any[] = [];
  const seen = new Set<string>();

  try {
    for (let page = 1; page <= 3; page++) {
      const url = page === 1
        ? 'https://tutecnotienda.com/productos'
        : `https://tutecnotienda.com/productos?page=${page}`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!res.ok) break;

      const html = await res.text();

      // Extract product links, images, and prices
      const linkRegex = /<a[^>]*href="(\/p\/[^"]+)"[^>]*>\s*\n?\s*([^\n<]+)/g;
      const imgRegex = /<img[^>]*src="([^"]*active_storage[^"]*)"[^>]*>/g;
      const priceRegex = /US\$\s*([\d,.]+)/g;

      let linkMatch;
      const links: { href: string; name: string }[] = [];
      while ((linkMatch = linkRegex.exec(html)) !== null) {
        const name = linkMatch[2]?.trim();
        if (name) links.push({ href: linkMatch[1], name });
      }

      let imgMatch;
      const images: string[] = [];
      while ((imgMatch = imgRegex.exec(html)) !== null) {
        images.push(imgMatch[1]);
      }

      let priceMatch;
      const prices: number[] = [];
      while ((priceMatch = priceRegex.exec(html)) !== null) {
        prices.push(parseFloat(priceMatch[1].replace(/,/g, '')));
      }

      // Match by position (they appear in the same order)
      for (let i = 0; i < links.length && i < Math.min(prices.length, images.length); i++) {
        const link = links[i];
        const imageUrl = images[i] || null;
        const price = prices[i] || 0;

        if (!price || seen.has(link.href)) continue;
        seen.add(link.href);

        // Extract SKU from name (text inside [brackets])
        const skuMatch = link.name.match(/\[([A-Z0-9][^\]]{2,})\]/);
        const sku = skuMatch ? skuMatch[1] : link.href.split('/').pop()?.split('-')[0]?.toUpperCase() || '';

        const cleanName = link.name.replace(/^\[[^\]]+\]\s*/, '').trim();

        // Filter by query if provided
        if (query && query.length >= 2) {
          const q = query.toLowerCase();
          if (!cleanName.toLowerCase().includes(q) && !sku.toLowerCase().includes(q)) continue;
        }

        products.push({
          sku,
          name: cleanName,
          costUsd: price,
          imageUrl: imageUrl?.startsWith('http') ? imageUrl : `https://tutecnotienda.com${imageUrl}`,
          category: 'Importado',
        });

        if (query && query.length >= 2 && products.length >= 20) break;
      }

      if (query && query.length >= 2 && products.length >= 20) break;
      if (page >= 3) break;
    }
  } catch (e) {
    console.error('Store fetch error:', e);
  }

  return NextResponse.json({ products, total: products.length });
}
