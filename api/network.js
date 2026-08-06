const USERNAME_ENDPOINT = 'https://users.roblox.com/v1/usernames/users';
const USERS_ENDPOINT = 'https://users.roblox.com/v1/users';
const FRIENDS_ENDPOINT = 'https://friends.roblox.com/v1/users';
const AVATARS_ENDPOINT = 'https://thumbnails.roblox.com/v1/users/avatar-headshot';
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const MAX_FRIENDS = 200;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 24;
const buckets = new Map();

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store, max-age=0');
  res.end(JSON.stringify(payload));
}

function requestIp(req) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

function rateLimited(req) {
  const now = Date.now();
  const key = requestIp(req);
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'user-agent': 'RoJoiner/2.0',
        ...(options.headers || {}),
      },
    });
    if (!response.ok) {
      const error = new Error(`Roblox returned ${response.status}.`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function resolveUser(rawUsername) {
  const username = String(rawUsername || '').trim();
  if (!USERNAME_PATTERN.test(username)) {
    const error = new Error('Enter a valid Roblox username.');
    error.status = 400;
    error.code = 'INVALID_USERNAME';
    throw error;
  }

  const payload = await fetchJson(USERNAME_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  });
  const match = payload?.data?.[0];
  if (!match?.id) {
    const error = new Error('That Roblox account could not be found.');
    error.status = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return {
    id: Number(match.id),
    username: match.name,
    displayName: match.displayName || match.name,
  };
}

function chunks(values, size = 100) {
  const output = [];
  for (let index = 0; index < values.length; index += size) {
    output.push(values.slice(index, index + size));
  }
  return output;
}

async function fetchProfiles(userIds) {
  const map = new Map();
  for (const batch of chunks(userIds)) {
    const payload = await fetchJson(USERS_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userIds: batch, excludeBannedUsers: false }),
    }).catch(() => ({ data: [] }));
    for (const profile of payload?.data || []) map.set(Number(profile.id), profile);
  }
  return map;
}

async function fetchAvatars(userIds) {
  const map = new Map();
  for (const batch of chunks(userIds)) {
    const url = new URL(AVATARS_ENDPOINT);
    url.searchParams.set('userIds', batch.join(','));
    url.searchParams.set('size', '150x150');
    url.searchParams.set('format', 'Png');
    url.searchParams.set('isCircular', 'false');
    const payload = await fetchJson(url).catch(() => ({ data: [] }));
    for (const avatar of payload?.data || []) {
      map.set(Number(avatar.targetId), avatar.imageUrl || null);
    }
  }
  return map;
}

async function getNetwork(username) {
  const root = await resolveUser(username);
  const [friendsPayload, countPayload, rootAvatars] = await Promise.all([
    fetchJson(`${FRIENDS_ENDPOINT}/${root.id}/friends`).catch(() => ({ data: [] })),
    fetchJson(`${FRIENDS_ENDPOINT}/${root.id}/friends/count`).catch(() => ({ count: null })),
    fetchAvatars([root.id]),
  ]);

  const rawFriends = Array.isArray(friendsPayload?.data) ? friendsPayload.data : [];
  const uniqueIds = [...new Set(rawFriends
    .map((friend) => Number(friend?.id))
    .filter((id) => Number.isSafeInteger(id) && id > 0))]
    .slice(0, MAX_FRIENDS);

  const [profiles, avatars] = await Promise.all([
    fetchProfiles(uniqueIds),
    fetchAvatars(uniqueIds),
  ]);

  const rawById = new Map(rawFriends.map((friend) => [Number(friend?.id), friend]));
  const friends = uniqueIds.flatMap((id) => {
    const raw = rawById.get(id);
    const profile = profiles.get(id);
    const candidate = String(profile?.name || raw?.name || '').trim();
    if (!USERNAME_PATTERN.test(candidate)) return [];
    return [{
      id,
      username: candidate,
      displayName: String(profile?.displayName || raw?.displayName || candidate).trim() || candidate,
      avatarUrl: avatars.get(id) || null,
      profileUrl: `https://www.roblox.com/users/${id}/profile`,
    }];
  }).sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));

  const reportedCount = Number.isFinite(Number(countPayload?.count)) ? Number(countPayload.count) : friends.length;

  return {
    retrievedAt: new Date().toISOString(),
    root: {
      ...root,
      avatarUrl: rootAvatars.get(root.id) || null,
      profileUrl: `https://www.roblox.com/users/${root.id}/profile`,
      friendCount: reportedCount,
    },
    friends,
    shownCount: friends.length,
    unavailableCount: Math.max(0, reportedCount - friends.length),
    limited: reportedCount > MAX_FRIENDS,
    limit: MAX_FRIENDS,
    privacy: {
      publicOnly: true,
      message: 'Only public friend-list data returned by Roblox is shown. Hidden activity and private relationships are not inferred.',
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return send(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST.' } });
  }
  if (rateLimited(req)) {
    return send(res, 429, { error: { code: 'RATE_LIMITED', message: 'Too many network lookups. Try again in a minute.' } });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    return send(res, 200, await getNetwork(body.username));
  } catch (error) {
    return send(res, Number(error.status || 500), {
      error: {
        code: error.code || 'NETWORK_LOOKUP_FAILED',
        message: error.status ? error.message : 'The public friend network could not be loaded.',
      },
    });
  }
}
