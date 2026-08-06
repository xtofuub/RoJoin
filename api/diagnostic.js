import { searchPublicPresence } from '../lib/roblox.js';

export default async function handler(_req, res) {
  try {
    const result = await searchPublicPresence('builderman', '1818');
    res.status(200).json({
      ok: true,
      status: result.status,
      source: result.source,
      scan: result.scan,
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
