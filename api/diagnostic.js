export default async function handler(_req, res) {
  try {
    const response = await fetch('https://games.roblox.com/v1/games/1818/servers/Public?sortOrder=Asc&excludeFullGames=false&limit=10', {
      headers: { accept: 'application/json', 'user-agent': 'RoJoiner-Diagnostic/1.0' },
      cache: 'no-store',
    });
    const payload = await response.json();
    const first = payload?.data?.[0] || {};
    res.status(response.status).json({
      ok: response.ok,
      serverCount: Array.isArray(payload?.data) ? payload.data.length : null,
      serverFields: Object.keys(first).sort(),
      arrayFields: Object.fromEntries(Object.entries(first).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])),
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error?.message || 'Unknown error' });
  }
}
