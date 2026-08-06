import { browseGame, comparePlayers, searchPublicPresence } from '../lib/roblox.js';

export const config = { maxDuration: 30 };

export default async function handler(_req, res) {
  const results = {};
  for (const [name, task] of [
    ['player', () => searchPublicPresence('builderman')],
    ['game', () => browseGame('1818', { sortOrder: 'Asc', excludeFull: true })],
    ['compare', () => comparePlayers('builderman', 'Roblox')],
  ]) {
    try {
      const value = await task();
      results[name] = {
        ok: true,
        status: value.status || null,
        user: value.user?.username || null,
        game: value.game?.name || null,
        servers: value.servers?.length ?? null,
        areFriends: value.areFriends ?? null,
        mutualCount: value.mutualCount ?? null,
      };
    } catch (error) {
      results[name] = { ok: false, code: error?.code || 'ERROR', message: error?.message || 'Unknown error' };
    }
  }
  res.status(200).json(results);
}
