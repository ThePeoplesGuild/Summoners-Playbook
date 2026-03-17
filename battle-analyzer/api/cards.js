export default async function handler(req, res) {
  try {
    const response = await fetch('https://api2.splinterlands.com/cards/get_details');

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Proxy returned non-JSON response — check Vercel routing');
    }

    if (!response.ok) {
      throw new Error(`Splinterlands API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Cache for 1 hour — card details rarely change
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
