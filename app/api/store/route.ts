export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch('https://tutecnotienda.com/productos', {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      return Response.json({ error: 'Store status ' + res.status, products: [] });
    }

    const html = await res.text();

    // Find all prices
    const prices: number[] = [];
    const pr = /US\$\s*([\d,.]+)/g;
    let m;
    while ((m = pr.exec(html)) !== null) {
      prices.push(parseFloat(m[1].replace(/,/g, '')));
    }

    // Find product names from <a> tags containing product links
    const linkRegex = /<a\s[^>]*href="\/p\/([a-z0-9-]+[a-z0-9-]{20,})"[^>]*>([^<]+)<\/a>/gi;
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
        imageUrl: null,
      });
      idx++;
      if (products.length >= 100) break;
    }

    return Response.json({ products, total: products.length, pricesFound: prices.length });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'fetch failed', products: [] });
  }
}
