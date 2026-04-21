const BASE = 'https://scentgallery.shop/wp-json/wc/store/v1/products';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'missing_or_invalid_id' });
  }

  const url = `${BASE}/${id}/variations`;

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'ScentGalleryProxy/1.0' },
    });

    const body = await upstream.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.status(upstream.status).send(body);
  } catch (err) {
    console.error('[proxy/variations] fetch failed:', err.message, { url });
    res.status(502).json({ error: 'proxy_error', message: err.message });
  }
}
