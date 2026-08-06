import { comparePlayers, PublicError } from '../lib/roblox.js';

const USERS_ENDPOINT = 'https://users.roblox.com/v1/users';
const AVATARS_ENDPOINT = 'https://thumbnails.roblox.com/v1/users/avatar-headshot';

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store, max-age=0');
  res.end(JSON.stringify(payload));
}

async function fetchProfiles(userIds) {
  if (!userIds.length) return new Map();

  try {
    const response = await fetch(USERS_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'user-agent': 'RoJoiner/2.0',
      },
      body: JSON.stringify({ userIds, excludeBannedUsers: false }),
    });

    if (!response.ok) return new Map();
    const payload = await response.json().catch(() => null);
    return new Map((payload?.data || []).map((profile) => [Number(profile.id), profile]));
  } catch {
    return new Map();
  }
}

async function fetchAvatars(userIds) {
  if (!userIds.length) return new Map();

  try {
    const url = new URL(AVATARS_ENDPOINT);
    url.searchParams.set('userIds', userIds.join(','));
    url.searchParams.set('size', '150x150');
    url.searchParams.set('format', 'Png');
    url.searchParams.set('isCircular', 'false');

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        'user-agent': 'RoJoiner/2.0',
      },
    });

    if (!response.ok) return new Map();
    const payload = await response.json().catch(() => null);
    return new Map((payload?.data || []).map((avatar) => [Number(avatar.targetId), avatar.imageUrl || null]));
  } catch {
    return new Map();
  }
}

async function normalizeMutualFriends(result) {
  const unique = new Map();

  for (const friend of result.mutualFriends || []) {
    const id = Number(friend?.id);
    if (!Number.isFinite(id) || unique.has(id)) continue;
    unique.set(id, friend);
  }

  const mutualFriends = [...unique.values()];
  const userIds = mutualFriends.map((friend) => Number(friend.id)).slice(0, 100);
  const [profileMap, avatarMap] = await Promise.all([
    fetchProfiles(userIds),
    fetchAvatars(userIds),
  ]);

  const hydrated = mutualFriends.map((friend) => {
    const id = Number(friend.id);
    const profile = profileMap.get(id);
    const username = profile?.name || friend.username || String(id);
    const displayName = profile?.displayName || friend.displayName || profile?.name || friend.username || `User ${id}`;

    return {
      id,
      username,
      displayName,
      avatarUrl: avatarMap.get(id) || friend.avatarUrl || null,
      profileUrl: `https://www.roblox.com/users/${id}/profile`,
    };
  });

  return {
    ...result,
    mutualCount: Math.max(Number(result.mutualCount || 0), hydrated.length),
    mutualShownCount: hydrated.length,
    mutualFriends: hydrated,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return send(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const result = await comparePlayers(body.usernameA, body.usernameB);
    return send(res, 200, await normalizeMutualFriends(result));
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
