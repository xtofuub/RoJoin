import { browseGame, PublicError } from '../lib/roblox.js';

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store, max-age=0');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return send(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const result = await browseGame(body.place, {
      sortOrder: body.sortOrder,
      excludeFull: body.excludeFull,
      cursor: body.cursor,
    });
    return send(res, 200, result);
  } catch (error) {
    const status = error instanceof PublicError ? error.status : 500;
    return send(res, status, {
      error: {
        code: error instanceof PublicError ? error.code : 'INTERNAL_ERROR',
        message: error instanceof PublicError ? error.message : 'Something went wrong.',
      },
    });
  }
}
