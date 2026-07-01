import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const STORE_URL = 'https://tutecnotienda.com/productos';
const BASE = 'https://tutecnotienda.com';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const products: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 5) {
    try {
      const url = page === 1 ? STORE_URL : `${STORE_URL}?page=${page}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Tecnotizacion/1.0)' },
      });
      if (!res.ok) break;

      const html = await res.text();

      // Extract product cards using regex
      const productRegex = /<a[^>]*href="(\/p\/[^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>/g;
      const priceRegex = /US\$\s*([\d,.]+)/g;
      const nameRegex = /<a[^>]*href="\/p\/[^"]+"[^>]*>\s*(.+?)\s*<\/a>/g;

      // Simpler approach: extract by structure patterns
      const sections = html.split('Vista rápida');

      for (let i = 0; i < sections.length - 1; i++) {
        const section = html.split('Vista rápida')[i];
        if (!section) continue;

        const hrefMatch = section.match(/\/p\/([^"?]+)/);
        const imgMatch = section.match(/src="([^"]*active_storage[^"]*)"/);
        const priceMatch = section.match(/US\$\s*([\d,.]+)/);
        const nameMatch = section.match(/<a[^>]*href="\/p\/[^"]*"[^>]*>\s*\n?\s*([^\n<]+)/);

        if (hrefMatch && priceMatch) {
          const slug = hrefMatch[1];
          let name = '';
          if (nameMatch) {
            name = nameMatch[1].trim();
          } else {
            // Extract from URL slug
            name = slug.replace(/-/g, ' ').replace(/\w\S*/g, (txt: string) =>
              txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
          }

          const skuMatch = name.match(/\[([A-Z0-9][^\]]+)\]/);
          const sku = skuMatch ? skuMatch[1] : slug.split('-')[0].toUpperCase();

          products.push({
            sku,
            name: name.replace(/^\[[^\]]+\]\s*/, '').trim(),
            costUsd: parseFloat(priceMatch[1].replace(/,/g, '')),
            imageUrl: imgMatch ? imgMatch[1] : null,
            category: 'Importado',
          });
        }
      }

      hasMore = html.includes('?page=' + (page + 1));
      page++;
    } catch (e) {
      break;
    }
  }

  return NextResponse.json({ products, total: products.length });
}
