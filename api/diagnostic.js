import { searchPublicPresence } from '../lib/roblox.js';

export default async function handler(_req, res) {
  try {
    const result = await searchPublicPresence('Firefox124316');
    res.status(200).json({
      ok: true,
      status: result.status,
      username: result.user.username,
      publicPlaceId: result.presence.placeId || result.presence.rootPlaceId,
      exactJoinAvailable: Boolean(result.joins.exact?.app),
      fallbackJoinAvailable: Boolean(result.joins.follow?.app),
      fallbackProtocol: result.joins.follow?.app?.split('=')[0] || null,
      message: result.privacy.message,
    });
  } catch (error) {
    res.status(error?.status || 500).json({
      ok: false,
      code: error?.code || 'INTERNAL_ERROR',
      message: error?.message || 'Unknown error',
    });
  }
}
