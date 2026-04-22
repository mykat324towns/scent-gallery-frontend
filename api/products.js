const BASE = 'https://scentgallery.shop/wp-json/wc/store/v1/products';

async function fetchVariationPrices(variationIds) {
  const results = await Promise.all(
    variationIds.map(async (id) => {
      try {
        const r = await fetch(`${BASE}/${id}`, {
          headers: { 'User-Agent': 'ScentGalleryProxy/1.0' },
        });
        if (!r.ok) return null;
        const data = await r.json();
        return { id, prices: data.prices || null };
      } catch {
        return null;
      }
    })
  );
  return results.filter(Boolean);
}

export default async function handler(req, res) {
  // Strip internal flag before forwarding — WooCommerce doesn't know about it
  const embedVariations = req.query.embed_variations === '1';
  const forward = { ...req.query };
  delete forward.embed_variations;

  const qs  = new URLSearchParams(forward).toString();
  const url = qs ? `${BASE}?${qs}` : BASE;

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'ScentGalleryProxy/1.0' },
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      return res.status(upstream.status).send(body);
    }

    const products = await upstream.json();

    // Only embed per-variation prices when the product page requests it.
    // Listing pages skip this — otherwise 6 products × 5 variations = 30 extra WC calls.
    if (embedVariations) {
      const list = Array.isArray(products) ? products : [];
      await Promise.all(list.map(async (product) => {
        const rawVars = product.variations || [];
        if (!Array.isArray(rawVars) || rawVars.length === 0) return;

        const ids = rawVars.map(v => (typeof v === 'object' ? v.id : v)).filter(Boolean);
        if (ids.length === 0) return;

        const varPrices = await fetchVariationPrices(ids);
        const priceMap  = {};
        varPrices.forEach(v => { priceMap[v.id] = v.prices; });

        product.variations = rawVars.map(v => {
          const id    = typeof v === 'object' ? v.id : v;
          const attrs = (typeof v === 'object' && v.attributes) ? v.attributes : [];
          return { id, attributes: attrs, prices: priceMap[id] || null };
        });
      }));
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(products);
  } catch (err) {
    console.error('[proxy/products] fetch failed:', err.message, { url });
    res.status(502).json({ error: 'proxy_error', message: err.message });
  }
}
