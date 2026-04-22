// Single storefront endpoint — proxies to WP sg/v1/storefront.
// Browser makes 1 request; WP handles aggregation from transient cache.

const WP_ENDPOINT = 'https://scentgallery.shop/wp-json/sg/v1/storefront';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }

  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  const { context, slug } = req.query;
  if (!context) return res.status(400).json({ error: 'missing_context' });

  const params = new URLSearchParams({ context });
  if (slug) params.set('slug', slug);
  const url = `${WP_ENDPOINT}?${params}`;

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'ScentGalleryProxy/1.0' },
    });

    const body = await upstream.text();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

    const wpCache = upstream.headers.get('X-SG-Cache');
    if (wpCache) res.setHeader('X-SG-Cache', wpCache);

    return res.status(upstream.status).send(body);
  } catch (err) {
    console.error('[storefront] fetch failed:', err.message, { url });
    return res.status(502).json({ error: 'proxy_error', message: err.message });
  }
}
