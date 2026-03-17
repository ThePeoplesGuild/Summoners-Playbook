export default async function handler(req, res) {
  const { player, limit = '10' } = req.query;

  if (!player) {
    return res.status(400).json({ error: 'Player name is required' });
  }

  try {
    const url = `https://api2.splinterlands.com/battle/history?player=${encodeURIComponent(player)}&limit=${encodeURIComponent(limit)}`;
    const response = await fetch(url);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Proxy returned non-JSON response — check Vercel routing');
    }

    if (!response.ok) {
      throw new Error(`Splinterlands API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
