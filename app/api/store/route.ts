export const dynamic = 'force-dynamic';

function extractCard(block: string) {
  // Extract product URL slug
  const hrefMatch = block.match(/\/p\/([a-z0-9-]{30,})/i);
  if (!hrefMatch) return null;

  // Extract product name from link text
  const nameMatch = block.match(/<a\s[^>]*href="\/p\/[^"]*"[^>]*>([^<]+)<\/a>/i);
  if (!nameMatch) return null;
  const text = nameMatch[1].trim();
  if (text.length < 5) return null;

  // Extract price
  const priceMatch = block.match(/US\$\s*([\d,.]+)/);
  if (!priceMatch) return null;

  // Extract first image
  const imgMatch = block.match(/<img[^>]+src="([^"]*active_storage[^"]*)"[^>]*>/i);

  // Extract SKU from [brackets]
  const skuMatch = text.match(/\[([A-Z0-9][^\]]{2,})\]/);

  return {
    sku: skuMatch ? skuMatch[1] : '',
    name: text.replace(/^\[[^\]]+\]\s*/, '').trim(),
    costUsd: parseFloat(priceMatch[1].replace(/,/g, '')),
    imageUrl: imgMatch ? imgMatch[1] : null,
  };
}

export async function GET() {
  try {
    const res = await fetch('https://tutecnotienda.com/productos', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return Response.json({ error: 'Store status ' + res.status, products: [] });

    const html = await res.text();

    // Split by "Vista rápida" - each product card has this link
    const cards = html.split('Vista rápida');
    const products: any[] = [];

    for (let i = 0; i < cards.length - 1 && products.length < 100; i++) {
      // Look BACKWARDS from the "Vista rápida" marker to find the product data
      // The card's content is in cards[i], the "Vista rápida" text was at the start of cards[i+1]
      const section = cards[i];
      const next = i < cards.length - 1 ? cards[i + 1] : '';

      // Extract URL from "Vista rápida" link: /line_items/new?id=slug
      const slugMatch = next.match(/\/line_items\/new\?id=([a-z0-9-]{30,})/i);
      if (!slugMatch) continue;

      const slug = slugMatch[1];
      // Build product URL from slug
      const productUrl = '/p/' + slug;

      // Find product name in the section - look for text after last [SKU] pattern
      const nameBlock = section.match(/\[([A-Z0-9][^\]]{2,})\]\s*((?:[A-Za-z0-9\u00C0-\u024F\s\-\/\+\.\,\&\;\:\!\?\(\)\[\]\{\}\#\@\$\%\*\"\'\_\|\\~\`\<\>\^\=\¡\¿\ñ\Ñ\á\é\í\ó\ú\Á\É\Í\Ó\Ú\ü\Ü\°\º\ª]{3,100}))/);
      const sku = nameBlock ? nameBlock[1] : '';
      const name = nameBlock ? nameBlock[2].trim() : slug.replace(/-/g, ' ');

      // Price
      const priceMatch = section.match(/US\$\s*([\d,.]+)/);

      // Image
      const imgMatch = section.match(/<img[^>]+src="([^"]*active_storage[^"]*)"[^>]*>/i);

      products.push({
        sku,
        name,
        costUsd: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0,
        imageUrl: imgMatch ? imgMatch[1] : null,
      });
    }

    return Response.json({ products, total: products.length });
  } catch (e: any) {
    return Response.json({ error: e?.message || 'fetch failed', products: [] });
  }
}
