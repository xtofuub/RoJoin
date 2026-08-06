import { comparePlayers, PublicError } from '../lib/roblox.js';

const USERS_ENDPOINT = 'https://users.roblox.com/v1/users';
const AVATARS_ENDPOINT = 'https://thumbnails.roblox.com/v1/users/avatar-headshot';
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

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

function validUsername(value) {
  const username = typeof value === 'string' ? value.trim() : '';
  return USERNAME_PATTERN.test(username) ? username : null;
}

async function normalizeMutualFriends(result) {
  const unique = new Map();

  for (const friend of result.mutualFriends || []) {
    const id = Number(friend?.id);
    if (!Number.isSafeInteger(id) || id <= 0 || unique.has(id)) continue;
    unique.set(id, friend);
  }

  const mutualFriends = [...unique.values()];
  const userIds = mutualFriends.map((friend) => Number(friend.id)).slice(0, 100);
  const [profileMap, avatarMap] = await Promise.all([
    fetchProfiles(userIds),
    fetchAvatars(userIds),
  ]);

  const hydrated = mutualFriends.flatMap((friend) => {
    const id = Number(friend.id);
    const profile = profileMap.get(id);
    const username = validUsername(profile?.name) || validUsername(friend.username);

    // Deleted, moderated, and malformed friend records can use placeholder IDs or
    // omit a usable username. They are not renderable Roblox profiles, so do not
    // invent a profile card for them.
    if (!username) return [];

    const displayName = String(
      profile?.displayName || friend.displayName || profile?.name || username,
    ).trim() || username;

    return [{
      id,
      username,
      displayName,
      avatarUrl: avatarMap.get(id) || friend.avatarUrl || null,
      profileUrl: `https://www.roblox.com/users/${id}/profile`,
    }];
  });

  const rawMutualCount = Number(result.mutualCount || 0);

  return {
    ...result,
    mutualCount: hydrated.length,
    mutualShownCount: hydrated.length,
    unavailableMutualCount: Math.max(0, rawMutualCount - hydrated.length),
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
