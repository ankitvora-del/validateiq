export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { q } = req.query;
  if (!q) { res.status(400).json({ error: 'Missing query parameter q' }); return; }

  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&sort=relevance&limit=12&t=year`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ValidateIQ/1.0 (product validation tool)' }
    });
    if (!response.ok) throw new Error(`Reddit returned HTTP ${response.status}`);
    const data = await response.json();
    const posts = (data?.data?.children || []).map(p => ({
      title:    p.data.title,
      text:     (p.data.selftext || '').slice(0, 280),
      sub:      p.data.subreddit,
      ups:      p.data.ups,
      comments: p.data.num_comments,
      url:      `https://reddit.com${p.data.permalink}`
    }));
    res.status(200).json({ ok: true, posts });
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message, posts: [] });
  }
}
