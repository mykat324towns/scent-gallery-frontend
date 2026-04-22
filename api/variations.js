const BASE = 'https://scentgallery.shop/wp-json/wc/store/v1/products';

export default async function handler(req, res) {
  // Accept ?ids=101,102,103 — comma-separated variation product IDs
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({ error: 'missing_ids' });
  }

  const idList = ids.split(',')
    .map(s => s.trim())
    .filter(s => /^\d+$/.test(s))
    .map(Number);

  if (idList.length === 0) {
    return res.status(400).json({ error: 'no_valid_ids' });
  }

  try {
    const results = await Promise.all(
      idList.map(async (id) => {
        const r = await fetch(`${BASE}/${id}`, {
          headers: { 'User-Agent': 'ScentGalleryProxy/1.0' },
        });
        if (!r.ok) return null;
        return r.json();
      })
    );

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(results.filter(Boolean));
  } catch (err) {
    console.error('[proxy/variations] fetch failed:', err.message);
    res.status(502).json({ error: 'proxy_error', message: err.message });
  }
}
