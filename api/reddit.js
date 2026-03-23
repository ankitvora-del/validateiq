export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { q } = req.query;
  if (!q) { res.status(400).json({ error: 'Missing query parameter q' }); return; }

  const urls = [
    `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=relevance&limit=12&t=year&raw_json=1`,
    `https://old.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=relevance&limit=12&t=year&raw_json=1`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
  };

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) continue;
      const data = await response.json();
      const posts = (data?.data?.children || []).map(p => ({
        title:    p.data.title,
        text:     (p.data.selftext || '').slice(0, 280),
        sub:      p.data.subreddit,
        ups:      p.data.ups,
        comments: p.data.num_comments,
        url:      `https://reddit.com${p.data.permalink}`
      })).filter(p => p.title);
      if (posts.length > 0) {
        res.status(200).json({ ok: true, posts });
        return;
      }
    } catch (e) {
      continue;
    }
  }

  res.status(200).json({ ok: false, error: 'Reddit blocked request — Claude will estimate this layer', posts: [] });
}
