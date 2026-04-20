const TARGET = 'https://scentgallery.shop/wp-json/wc/store/v1/products';

export default async function handler(req, res) {
  const qs = new URLSearchParams(req.query).toString();
  const url = qs ? `${TARGET}?${qs}` : TARGET;

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'ScentGalleryProxy/1.0' },
    });

    const body = await upstream.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.status(upstream.status).send(body);
  } catch (err) {
    console.error('[proxy/products] fetch failed:', err.message, { url });
    res.status(502).json({ error: 'proxy_error', message: err.message });
  }
}
