export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { engine, q, k, amazon_domain, gl, hl, api_key } = req.query;
  if (!api_key) { res.status(200).json({ ok: false, error: 'No SerpAPI key provided' }); return; }

  try {
    const params = new URLSearchParams({ engine, api_key });
    if (q)             params.set('q', q);
    if (k)             params.set('k', k);
    if (amazon_domain) params.set('amazon_domain', amazon_domain);
    if (gl)            params.set('gl', gl);
    if (hl)            params.set('hl', hl);

    const url = `https://serpapi.com/search.json?${params}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`SerpAPI returned HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    if (engine === 'amazon') {
      const products = (data.organic_results || []).slice(0, 8).map(p => ({
        title:   p.title   || '',
        price:   p.price   || null,
        rating:  p.rating  || null,
        reviews: p.reviews || null,
        bought:  p.bought_last_month || null
      })).filter(p => p.title);
      res.status(200).json({ ok: true, products });
    } else {
      const results = (data.shopping_results || []).slice(0, 8).map(p => ({
        title:  p.title  || '',
        price:  p.price  || null,
        source: p.source || null,
        rating: p.rating || null
      })).filter(p => p.title);
      res.status(200).json({ ok: true, results });
    }
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message });
  }
}
