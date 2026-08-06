const USERNAME_ENDPOINT = 'https://users.roblox.com/v1/usernames/users';
const USER_ENDPOINT = 'https://users.roblox.com/v1/users';
const PRESENCE_ENDPOINT = 'https://presence.roblox.com/v1/presence/users';
const AVATAR_ENDPOINT = 'https://thumbnails.roblox.com/v1/users/avatar-headshot';
const UNIVERSE_ENDPOINT = 'https://apis.roblox.com/universes/v1/places';
const GAME_ENDPOINT = 'https://games.roblox.com/v1/games';

const DEFAULT_HEADERS = {
  accept: 'application/json',
  'content-type': 'application/json',
  'user-agent': 'RoJoin/1.0 (+public-presence-only)',
};

export class PublicError extends Error {
  constructor(message, status = 400, code = 'REQUEST_FAILED') {
    super(message);
    this.name = 'PublicError';
    this.status = status;
    this.code = code;
  }
}

async function fetchJson(url, options = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
      signal: controller.signal,
      cache: 'no-store',
    });

    const retryAfter = response.headers.get('retry-after');
    const payload = await response.json().catch(() => null);

    if (response.status === 429) {
      throw new PublicError(
        retryAfter
          ? `Roblox is rate-limiting requests. Try again in ${retryAfter} seconds.`
          : 'Roblox is rate-limiting requests. Try again shortly.',
        429,
        'ROBLOX_RATE_LIMITED',
      );
    }

    if (!response.ok) {
      throw new PublicError(
        payload?.errors?.[0]?.message || `Roblox request failed (${response.status}).`,
        response.status >= 500 ? 502 : response.status,
        'ROBLOX_REQUEST_FAILED',
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof PublicError) throw error;
    if (error?.name === 'AbortError') {
      throw new PublicError('Roblox took too long to respond.', 504, 'ROBLOX_TIMEOUT');
    }
    throw new PublicError('Could not reach Roblox right now.', 502, 'ROBLOX_UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }
}

export function normalizeUsername(value) {
  const username = String(value || '').trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username) || username.startsWith('_') || username.endsWith('_')) {
    throw new PublicError('Enter a valid Roblox username (3–20 letters, numbers, or one underscore).', 400, 'INVALID_USERNAME');
  }
  return username;
}

async function resolveUser(username) {
  const resolved = await fetchJson(USERNAME_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
  });

  const match = resolved?.data?.[0];
  if (!match?.id) {
    throw new PublicError('No Roblox account was found with that username.', 404, 'USER_NOT_FOUND');
  }

  const details = await fetchJson(`${USER_ENDPOINT}/${match.id}`, { method: 'GET' });

  return {
    id: Number(match.id),
    username: details?.name || match.name || username,
    displayName: details?.displayName || match.displayName || match.name || username,
    description: details?.description || '',
    isBanned: Boolean(details?.isBanned),
    created: details?.created || null,
    profileUrl: `https://www.roblox.com/users/${match.id}/profile`,
  };
}

async function getAvatar(userId) {
  const url = new URL(AVATAR_ENDPOINT);
  url.searchParams.set('userIds', String(userId));
  url.searchParams.set('size', '420x420');
  url.searchParams.set('format', 'Png');
  url.searchParams.set('isCircular', 'false');

  try {
    const response = await fetchJson(url, { method: 'GET' });
    return response?.data?.[0]?.imageUrl || null;
  } catch {
    return null;
  }
}

async function getPresence(userId) {
  const response = await fetchJson(PRESENCE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ userIds: [userId] }),
  });

  return response?.userPresences?.[0] || null;
}

async function getGameDetails(placeId) {
  if (!placeId) return null;

  try {
    const universe = await fetchJson(`${UNIVERSE_ENDPOINT}/${placeId}/universe`, { method: 'GET' });
    if (!universe?.universeId) return null;

    const games = await fetchJson(`${GAME_ENDPOINT}?universeIds=${universe.universeId}`, { method: 'GET' });
    const game = games?.data?.[0];
    if (!game) return null;

    return {
      universeId: Number(universe.universeId),
      name: game.name || null,
      description: game.description || null,
      creator: game.creator?.name || null,
      playing: Number.isFinite(game.playing) ? game.playing : null,
      visits: Number.isFinite(game.visits) ? game.visits : null,
      maxPlayers: Number.isFinite(game.maxPlayers) ? game.maxPlayers : null,
    };
  } catch {
    return null;
  }
}

function mapPresence(presence) {
  const type = Number(presence?.userPresenceType ?? 0);
  const labels = {
    0: 'Offline',
    1: 'Online',
    2: 'In game',
    3: 'In Studio',
    4: 'Invisible',
  };

  return {
    type,
    label: labels[type] || 'Unknown',
    lastLocation: presence?.lastLocation || null,
    lastOnline: presence?.lastOnline || null,
    placeId: presence?.placeId ? Number(presence.placeId) : null,
    rootPlaceId: presence?.rootPlaceId ? Number(presence.rootPlaceId) : null,
    gameId: typeof presence?.gameId === 'string' && presence.gameId.length > 5 ? presence.gameId : null,
  };
}

export function buildJoinLinks(placeId, gameId, userId) {
  const exact = placeId && gameId
    ? {
        app: `roblox://placeId=${encodeURIComponent(placeId)}&gameInstanceId=${encodeURIComponent(gameId)}`,
        web: `https://www.roblox.com/games/start?placeId=${encodeURIComponent(placeId)}&gameInstanceId=${encodeURIComponent(gameId)}`,
      }
    : null;

  const follow = userId
    ? {
        app: `roblox://userId=${encodeURIComponent(userId)}`,
        web: `https://www.roblox.com/games/start?userId=${encodeURIComponent(userId)}`,
      }
    : null;

  return { exact, follow };
}

export async function searchPublicPresence(rawUsername) {
  const username = normalizeUsername(rawUsername);
  const user = await resolveUser(username);

  const [avatarUrl, rawPresence] = await Promise.all([
    getAvatar(user.id),
    getPresence(user.id),
  ]);

  const presence = mapPresence(rawPresence);
  const placeId = presence.placeId || presence.rootPlaceId;
  const game = placeId ? await getGameDetails(placeId) : null;
  const joins = buildJoinLinks(placeId, presence.gameId, user.id);

  const exactServerAvailable = Boolean(placeId && presence.gameId);
  const status = presence.type === 2
    ? exactServerAvailable
      ? 'JOINABLE'
      : 'IN_GAME_HIDDEN'
    : presence.type === 0
      ? 'OFFLINE'
      : 'ONLINE_NOT_IN_GAME';

  return {
    searchedAt: new Date().toISOString(),
    status,
    user: { ...user, avatarUrl },
    presence,
    game,
    joins,
    privacy: {
      exactServerAvailable,
      message: exactServerAvailable
        ? 'Roblox publicly exposed this exact game instance.'
        : presence.type === 2
          ? 'The player is in a game, but Roblox did not expose an exact server to this public request.'
          : 'No public game server is currently available.',
    },
  };
}
