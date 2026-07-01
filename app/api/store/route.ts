export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch('https://tutecnotienda.com/productos', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es,en;q=0.9',
      },
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return Response.json({ error: 'Store status ' + res.status, products: [] });
    }

    const html = await res.text();

    // Extract all prices
    const prices: number[] = [];
    const pr = /US\$\s*([\d,.]+)/g;
    let m;
    while ((m = pr.exec(html)) !== null) {
      prices.push(parseFloat(m[1].replace(/,/g, '')));
    }

    // Extract all product images (first image of each product card)
    const images: string[] = [];
    const ir = /<img[^>]+src="([^"]*active_storage[^"]*)"[^>]*>/gi;
    while ((m = ir.exec(html)) !== null) {
      const url = m[1];
      if (!images.includes(url) && !url.includes('logo')) images.push(url);
    }

    // Extract product links with visible text
    const linkRegex = /<a\s[^>]*href="\/p\/([a-z0-9-]{30,})"[^>]*>([^<]+)<\/a>/gi;
    const products: any[] = [];
    const seenHrefs = new Set<string>();
    let idx = 0;

    while ((m = linkRegex.exec(html)) !== null && idx < prices.length) {
      const slug = m[1];
      const text = m[2].trim();
      if (!text || text.length < 5 || seenHrefs.has(slug)) continue;
      seenHrefs.add(slug);

      const skuMatch = text.match(/\[([A-Z0-9][^\]]{2,})\]/);
      products.push({
        sku: skuMatch ? skuMatch[1] : '',
        name: text.replace(/^\[[^\]]+\]\s*/, '').trim(),
        costUsd: prices[idx] || 0,
        imageUrl: idx < images.length ? images[idx] : null,
      });
      idx++;
      if (products.length >= 100) break;
    }

    return Response.json({ products, total: products.length });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'fetch failed', products: [] });
  }
}
