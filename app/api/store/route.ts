export const dynamic = 'force-dynamic';

export async function GET() {
  const url = 'https://tutecnotienda.com/productos';
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) {
      return Response.json({ error: 'Store down: ' + res.status, products: [] }, { status: 502 });
    }

    const html = await res.text();
    const start = html.indexOf('Productos</h1>');
    const grid = start > 0 ? html.substring(start) : html;

    // Match product links with text
    const links: { href: string; text: string }[] = [];
    const re = /<a\s[^>]*href="(\/p\/[^"]+)"[^>]*>([^<]+)</gi;
    let m;
    while ((m = re.exec(grid)) !== null) {
      const t = m[2].trim();
      if (t && t.length > 3) links.push({ href: m[1], text: t });
    }

    // Match prices
    const prices: number[] = [];
    const pr = /US\$\s*([\d,.]+)/gi;
    while ((m = pr.exec(grid)) !== null) {
      prices.push(parseFloat(m[1].replace(/,/g, '')));
    }

    // Match images
    const images: string[] = [];
    const ir = /<img[^>]+src="([^"]*active_storage[^"]*)"[^>]*>/gi;
    while ((m = ir.exec(grid)) !== null) {
      images.push(m[1]);
    }

    const products: any[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < links.length && i < prices.length; i++) {
      const l = links[i];
      if (!prices[i] || seen.has(l.href)) continue;
      seen.add(l.href);

      const skuMatch = l.text.match(/\[([A-Z0-9][^\]]{2,})\]/);
      const sku = skuMatch ? skuMatch[1] : '';
      const name = l.text.replace(/^\[[^\]]+\]\s*/, '').trim();
      const img = i < images.length ? images[i] : null;

      products.push({ sku, name, costUsd: prices[i], imageUrl: img });
    }

    return Response.json({ products, total: products.length, debug: { links: links.length, prices: prices.length, images: images.length, grid: grid.length } });
  } catch (e: any) {
    return Response.json({ error: e.message, products: [] });
  }
}
