const USERNAME_ENDPOINT = 'https://users.roblox.com/v1/usernames/users';
const USER_ENDPOINT = 'https://users.roblox.com/v1/users';
const PRESENCE_ENDPOINT = 'https://presence.roblox.com/v1/presence/users';
const AVATAR_ENDPOINT = 'https://thumbnails.roblox.com/v1/users/avatar-headshot';
const GAME_ICON_ENDPOINT = 'https://thumbnails.roblox.com/v1/games/icons';
const UNIVERSE_ENDPOINT = 'https://apis.roblox.com/universes/v1/places';
const GAME_ENDPOINT = 'https://games.roblox.com/v1/games';
const FRIENDS_ENDPOINT = 'https://friends.roblox.com/v1/users';

const DEFAULT_HEADERS = {
  accept: 'application/json',
  'content-type': 'application/json',
  'user-agent': 'RoJoiner/2.0 (+public-data-toolkit)',
};

export class PublicError extends Error {
  constructor(message, status = 400, code = 'REQUEST_FAILED') {
    super(message);
    this.name = 'PublicError';
    this.status = status;
    this.code = code;
  }
}

async function fetchJson(url, options = {}, timeoutMs = 10000) {
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

export function normalizePlaceId(value) {
  const raw = String(value || '').trim();
  const direct = raw.match(/^\d+$/)?.[0];
  const fromUrl = raw.match(/roblox\.com\/(?:[a-z]{2}\/)?games\/(\d+)/i)?.[1];
  const placeId = direct || fromUrl;
  if (!placeId) {
    throw new PublicError('Enter a valid Roblox game URL or numeric Place ID.', 400, 'INVALID_PLACE_ID');
  }
  return placeId;
}

export async function resolveUser(rawUsername) {
  const username = normalizeUsername(rawUsername);
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
    hasVerifiedBadge: Boolean(details?.hasVerifiedBadge),
    profileUrl: `https://www.roblox.com/users/${match.id}/profile`,
  };
}

async function getAvatar(userId, size = '420x420') {
  const url = new URL(AVATAR_ENDPOINT);
  url.searchParams.set('userIds', String(userId));
  url.searchParams.set('size', size);
  url.searchParams.set('format', 'Png');
  url.searchParams.set('isCircular', 'false');

  try {
    const response = await fetchJson(url, { method: 'GET' });
    return response?.data?.[0]?.imageUrl || null;
  } catch {
    return null;
  }
}

async function getAvatarMap(userIds, size = '150x150') {
  const ids = [...new Set(userIds.map(Number).filter(Number.isFinite))].slice(0, 100);
  if (!ids.length) return new Map();
  const url = new URL(AVATAR_ENDPOINT);
  url.searchParams.set('userIds', ids.join(','));
  url.searchParams.set('size', size);
  url.searchParams.set('format', 'Png');
  url.searchParams.set('isCircular', 'false');
  try {
    const response = await fetchJson(url, { method: 'GET' });
    return new Map((response?.data || []).map((item) => [Number(item.targetId), item.imageUrl || null]));
  } catch {
    return new Map();
  }
}

async function getPresence(userId) {
  const response = await fetchJson(PRESENCE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ userIds: [userId] }),
  });
  return response?.userPresences?.[0] || null;
}

async function getSocialStats(userId) {
  const endpoints = {
    friends: `${FRIENDS_ENDPOINT}/${userId}/friends/count`,
    followers: `${FRIENDS_ENDPOINT}/${userId}/followers/count`,
    following: `${FRIENDS_ENDPOINT}/${userId}/followings/count`,
  };

  const entries = await Promise.all(Object.entries(endpoints).map(async ([key, url]) => {
    try {
      const data = await fetchJson(url, { method: 'GET' });
      return [key, Number(data?.count ?? 0)];
    } catch {
      return [key, null];
    }
  }));
  return Object.fromEntries(entries);
}

async function getFriends(userId) {
  try {
    const data = await fetchJson(`${FRIENDS_ENDPOINT}/${userId}/friends`, { method: 'GET' });
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

function mapPresence(presence) {
  const type = Number(presence?.userPresenceType ?? 0);
  const labels = {
    0: 'No public presence',
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
    placeId: presence?.placeId ? String(presence.placeId) : null,
    rootPlaceId: presence?.rootPlaceId ? String(presence.rootPlaceId) : null,
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

async function getGameIcon(universeId) {
  if (!universeId) return null;
  const url = new URL(GAME_ICON_ENDPOINT);
  url.searchParams.set('universeIds', String(universeId));
  url.searchParams.set('returnPolicy', 'PlaceHolder');
  url.searchParams.set('size', '512x512');
  url.searchParams.set('format', 'Png');
  url.searchParams.set('isCircular', 'false');
  try {
    const data = await fetchJson(url, { method: 'GET' });
    return data?.data?.[0]?.imageUrl || null;
  } catch {
    return null;
  }
}

export async function getGameDetails(rawPlaceId) {
  const placeId = normalizePlaceId(rawPlaceId);
  const universe = await fetchJson(`${UNIVERSE_ENDPOINT}/${placeId}/universe`, { method: 'GET' });
  if (!universe?.universeId) {
    throw new PublicError('That place is not connected to a public Roblox experience.', 404, 'GAME_NOT_FOUND');
  }

  const games = await fetchJson(`${GAME_ENDPOINT}?universeIds=${universe.universeId}`, { method: 'GET' });
  const game = games?.data?.[0];
  if (!game) throw new PublicError('Roblox did not return details for that game.', 404, 'GAME_NOT_FOUND');
  const iconUrl = await getGameIcon(universe.universeId);

  return {
    placeId,
    universeId: String(universe.universeId),
    name: game.name || 'Untitled experience',
    description: game.description || '',
    creator: game.creator?.name || null,
    creatorType: game.creator?.type || null,
    playing: Number.isFinite(game.playing) ? game.playing : null,
    visits: Number.isFinite(game.visits) ? game.visits : null,
    maxPlayers: Number.isFinite(game.maxPlayers) ? game.maxPlayers : null,
    created: game.created || null,
    updated: game.updated || null,
    genre: game.genre || null,
    favoritedCount: Number.isFinite(game.favoritedCount) ? game.favoritedCount : null,
    iconUrl,
    gameUrl: `https://www.roblox.com/games/${placeId}`,
    launchUrl: `roblox://placeId=${encodeURIComponent(placeId)}`,
  };
}

export async function getPublicServers(rawPlaceId, options = {}) {
  const placeId = normalizePlaceId(rawPlaceId);
  const sortOrder = String(options.sortOrder || 'Asc') === 'Desc' ? 'Desc' : 'Asc';
  const excludeFull = Boolean(options.excludeFull);
  const cursor = String(options.cursor || '').trim();
  const url = new URL(`https://games.roblox.com/v1/games/${placeId}/servers/Public`);
  url.searchParams.set('sortOrder', sortOrder);
  url.searchParams.set('excludeFullGames', String(excludeFull));
  url.searchParams.set('limit', '100');
  if (cursor) url.searchParams.set('cursor', cursor);

  const payload = await fetchJson(url, { method: 'GET' }, 15000);
  const servers = (payload?.data || []).map((server) => ({
    id: String(server.id),
    playing: Number(server.playing || 0),
    maxPlayers: Number(server.maxPlayers || 0),
    ping: Number.isFinite(server.ping) ? server.ping : null,
    fps: Number.isFinite(server.fps) ? server.fps : null,
    capacity: server.maxPlayers ? Math.round((server.playing / server.maxPlayers) * 100) : 0,
    isFull: Number(server.playing || 0) >= Number(server.maxPlayers || 0),
    joins: buildJoinLinks(placeId, String(server.id), null).exact,
  }));

  return {
    placeId,
    servers,
    previousPageCursor: payload?.previousPageCursor || null,
    nextPageCursor: payload?.nextPageCursor || null,
  };
}

export async function browseGame(rawPlaceId, options = {}) {
  const [game, serverPage] = await Promise.all([
    getGameDetails(rawPlaceId),
    getPublicServers(rawPlaceId, options),
  ]);
  return { game, ...serverPage };
}

export async function comparePlayers(rawA, rawB) {
  const [userA, userB] = await Promise.all([resolveUser(rawA), resolveUser(rawB)]);
  if (userA.id === userB.id) {
    throw new PublicError('Choose two different Roblox accounts.', 400, 'SAME_USER');
  }

  const [friendsA, friendsB, avatarA, avatarB, statsA, statsB] = await Promise.all([
    getFriends(userA.id),
    getFriends(userB.id),
    getAvatar(userA.id, '180x180'),
    getAvatar(userB.id, '180x180'),
    getSocialStats(userA.id),
    getSocialStats(userB.id),
  ]);

  const idsA = new Set(friendsA.map((friend) => Number(friend.id)));
  const idsB = new Set(friendsB.map((friend) => Number(friend.id)));
  const mutualRaw = friendsA.filter((friend) => idsB.has(Number(friend.id))).slice(0, 24);
  const avatarMap = await getAvatarMap(mutualRaw.map((friend) => friend.id));
  const mutualFriends = mutualRaw.map((friend) => ({
    id: Number(friend.id),
    username: friend.name,
    displayName: friend.displayName || friend.name,
    avatarUrl: avatarMap.get(Number(friend.id)) || null,
    profileUrl: `https://www.roblox.com/users/${friend.id}/profile`,
  }));

  return {
    comparedAt: new Date().toISOString(),
    areFriends: idsA.has(userB.id) || idsB.has(userA.id),
    userA: { ...userA, avatarUrl: avatarA, social: statsA },
    userB: { ...userB, avatarUrl: avatarB, social: statsB },
    mutualCount: [...idsA].filter((id) => idsB.has(id)).length,
    mutualFriends,
  };
}

export async function searchPublicPresence(rawUsername) {
  const user = await resolveUser(rawUsername);

  const [avatarUrl, rawPresence, social] = await Promise.all([
    getAvatar(user.id),
    getPresence(user.id),
    getSocialStats(user.id),
  ]);

  const presence = mapPresence(rawPresence);
  const placeId = presence.placeId || presence.rootPlaceId;
  const exactServerAvailable = Boolean(placeId && presence.gameId);
  const game = placeId ? await getGameDetails(placeId).catch(() => null) : null;
  const joins = buildJoinLinks(placeId, presence.gameId, user.id);

  let status;
  let message;

  if (exactServerAvailable) {
    status = 'JOINABLE';
    message = 'Roblox exposed this exact game instance. The primary button opens that server directly.';
  } else if (presence.type === 2) {
    status = 'IN_GAME_HIDDEN';
    message = 'The player appears to be in a game, but Roblox did not expose the server ID. Try joining through Roblox; their join settings still apply.';
  } else {
    status = 'NO_PUBLIC_SERVER';
    message = 'Roblox did not expose a current game server. Try joining through Roblox to let the app check their live status and permissions.';
  }

  return {
    searchedAt: new Date().toISOString(),
    status,
    user: { ...user, avatarUrl, social },
    presence,
    game,
    joins,
    diagnostics: {
      publicPresenceReturned: Boolean(rawPresence),
      publicPlaceReturned: Boolean(placeId),
      exactInstanceReturned: Boolean(presence.gameId),
      fallbackUsesRoblox: Boolean(joins.follow),
    },
    privacy: {
      exactServerAvailable,
      fallbackJoinAvailable: Boolean(joins.follow),
      message,
    },
  };
}
