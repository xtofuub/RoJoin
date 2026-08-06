import { PublicError, searchPublicPresence } from '../lib/roblox.js';

const buckets = globalThis.__rojoinerRateBuckets || new Map();
globalThis.__rojoinerRateBuckets = buckets;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0] || 'unknown';
  return String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function enforceRateLimit(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 10;
  const current = buckets.get(ip);

  if (!current || now - current.startedAt >= windowMs) {
    buckets.set(ip, { startedAt: now, count: 1 });
    return;
  }

  current.count += 1;
  if (current.count > limit) {
    throw new PublicError('Too many searches from this connection. Try again in a minute.', 429, 'LOCAL_RATE_LIMITED');
  }
}

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
    enforceRateLimit(req);
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const result = await searchPublicPresence(body.username);
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
