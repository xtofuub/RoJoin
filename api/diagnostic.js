async function inspect(placeId) {
  const response = await fetch(`https://games.roblox.com/v1/games/${placeId}/servers/Public?sortOrder=Desc&excludeFullGames=false&limit=10`, {
    headers: { accept: 'application/json', 'user-agent': 'RoJoiner-Diagnostic/1.0' },
    cache: 'no-store',
  });
  const payload = await response.json();
  const servers = Array.isArray(payload?.data) ? payload.data : [];
  return {
    placeId,
    status: response.status,
    serverCount: servers.length,
    totalPlaying: servers.reduce((sum, server) => sum + Number(server?.playing || 0), 0),
    playerTokenCount: servers.reduce((sum, server) => sum + (Array.isArray(server?.playerTokens) ? server.playerTokens.length : 0), 0),
    playerObjectCount: servers.reduce((sum, server) => sum + (Array.isArray(server?.players) ? server.players.length : 0), 0),
    fields: Object.keys(servers[0] || {}).sort(),
  };
}

export default async function handler(_req, res) {
  try {
    const results = await Promise.all([inspect('1818'), inspect('4924922222')]);
    res.status(200).json({ ok: true, results });
  } catch (error) {
    res.status(500).json({ ok: false, message: error?.message || 'Unknown error' });
  }
}
