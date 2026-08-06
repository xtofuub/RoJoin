const USERNAME_ENDPOINT = 'https://users.roblox.com/v1/usernames/users';
const USER_ENDPOINT = 'https://users.roblox.com/v1/users';
const PRESENCE_ENDPOINT = 'https://presence.roblox.com/v1/presence/users';
const AVATAR_ENDPOINT = 'https://thumbnails.roblox.com/v1/users/avatar-headshot';
const THUMBNAIL_BATCH_ENDPOINT = 'https://thumbnails.roblox.com/v1/batch';
const UNIVERSE_ENDPOINT = 'https://apis.roblox.com/universes/v1/places';
const GAME_ENDPOINT = 'https://games.roblox.com/v1/games';
const SERVER_ENDPOINT = 'https://games.roblox.com/v1/games';

const DEFAULT_HEADERS = {
  accept: 'application/json',
  'content-type': 'application/json',
  'user-agent': 'RoJoiner/1.1 (+public-servers-only)',
};

const MAX_SCAN_PAGES = 8;
const MAX_SCAN_TOKENS = 6000;
const THUMBNAIL_CONCURRENCY = 4;

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

export function normalizePlaceId(value) {
  const input = String(value || '').trim();
  if (!input) return null;

  const direct = input.match(/^\d{1,16}$/)?.[0];
  const fromUrl = input.match(/roblox\.com\/(?:[a-z]{2}\/)?games\/(\d{1,16})/i)?.[1];
  const placeId = direct || fromUrl;

  if (!placeId || placeId === '0') {
    throw new PublicError('Enter a valid Roblox game URL or Place ID.', 400, 'INVALID_PLACE_ID');
  }

  return placeId;
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

function chunks(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

async function matchThumbnailBatches(requests, targetImageUrl) {
  const batches = chunks(requests, 100);

  for (let index = 0; index < batches.length; index += THUMBNAIL_CONCURRENCY) {
    const group = batches.slice(index, index + THUMBNAIL_CONCURRENCY);
    const responses = await Promise.all(group.map((batch) => fetchJson(THUMBNAIL_BATCH_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(batch),
    }, 10000)));

    for (const response of responses) {
      const match = response?.data?.find((item) => item?.state === 'Completed' && item.imageUrl === targetImageUrl);
      if (match?.requestId) return String(match.requestId);
    }
  }

  return null;
}

async function scanPublicServers(placeId, targetImageUrl) {
  if (!targetImageUrl) {
    return {
      supported: false,
      found: false,
      reason: 'TARGET_THUMBNAIL_UNAVAILABLE',
      pagesScanned: 0,
      serversScanned: 0,
      playersChecked: 0,
      truncated: false,
    };
  }

  let cursor = null;
  let pagesScanned = 0;
  let serversScanned = 0;
  let playersChecked = 0;
  let sawPlayerTokens = false;
  let truncated = false;

  while (pagesScanned < MAX_SCAN_PAGES && playersChecked < MAX_SCAN_TOKENS) {
    const url = new URL(`${SERVER_ENDPOINT}/${placeId}/servers/Public`);
    url.searchParams.set('sortOrder', 'Asc');
    url.searchParams.set('excludeFullGames', 'false');
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('cursor', cursor);

    const page = await fetchJson(url, { method: 'GET' }, 10000);
    const servers = Array.isArray(page?.data) ? page.data : [];
    pagesScanned += 1;
    serversScanned += servers.length;

    const requests = [];
    for (const server of servers) {
      const tokens = Array.isArray(server?.playerTokens) ? server.playerTokens : [];
      if (tokens.length) sawPlayerTokens = true;

      for (const token of tokens) {
        if (playersChecked + requests.length >= MAX_SCAN_TOKENS) {
          truncated = true;
          break;
        }
        requests.push({
          token,
          type: 'AvatarHeadshot',
          size: '150x150',
          requestId: String(server.id),
        });
      }

      if (truncated) break;
    }

    if (requests.length) {
      const gameId = await matchThumbnailBatches(requests, targetImageUrl);
      playersChecked += requests.length;
      if (gameId) {
        const server = servers.find((item) => String(item.id) === gameId);
        return {
          supported: true,
          found: true,
          gameId,
          playing: Number.isFinite(server?.playing) ? server.playing : null,
          maxPlayers: Number.isFinite(server?.maxPlayers) ? server.maxPlayers : null,
          pagesScanned,
          serversScanned,
          playersChecked,
          truncated,
        };
      }
    }

    cursor = page?.nextPageCursor || null;
    if (!cursor || truncated) break;
  }

  if (cursor && pagesScanned >= MAX_SCAN_PAGES) truncated = true;

  return {
    supported: sawPlayerTokens,
    found: false,
    reason: sawPlayerTokens ? 'PLAYER_NOT_FOUND' : 'PLAYER_TOKENS_UNAVAILABLE',
    pagesScanned,
    serversScanned,
    playersChecked,
    truncated,
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

export async function searchPublicPresence(rawUsername, rawPlace) {
  const username = normalizeUsername(rawUsername);
  const requestedPlaceId = normalizePlaceId(rawPlace);
  const user = await resolveUser(username);

  const [avatarUrl, matchingAvatarUrl, rawPresence] = await Promise.all([
    getAvatar(user.id, '420x420'),
    getAvatar(user.id, '150x150'),
    getPresence(user.id),
  ]);

  let presence = mapPresence(rawPresence);
  let placeId = presence.placeId || presence.rootPlaceId;
  let scan = null;
  let source = 'PUBLIC_PRESENCE';

  if (!(placeId && presence.gameId) && requestedPlaceId) {
    scan = await scanPublicServers(requestedPlaceId, matchingAvatarUrl);

    if (scan.found) {
      source = 'PUBLIC_SERVER_SCAN';
      placeId = requestedPlaceId;
      presence = {
        ...presence,
        type: 2,
        label: 'In game',
        placeId: requestedPlaceId,
        rootPlaceId: requestedPlaceId,
        gameId: scan.gameId,
        lastLocation: null,
      };
    }
  }

  const exactServerAvailable = Boolean(placeId && presence.gameId);
  const game = await getGameDetails(placeId || requestedPlaceId);
  const joins = buildJoinLinks(placeId, presence.gameId, user.id);

  let status;
  let message;

  if (exactServerAvailable) {
    status = 'JOINABLE';
    message = source === 'PUBLIC_SERVER_SCAN'
      ? `Matched this player in a public server after checking ${scan.playersChecked} player slots.`
      : 'Roblox publicly exposed this exact game instance.';
  } else if (scan && !scan.supported) {
    status = 'SCAN_UNAVAILABLE';
    message = 'Roblox did not expose the player tokens needed to scan this game’s public servers.';
  } else if (scan) {
    status = 'NOT_FOUND_IN_GAME';
    message = scan.truncated
      ? `No match was found in the first ${scan.serversScanned} public servers scanned. The game has more servers than this search checked.`
      : `No match was found across ${scan.serversScanned} public servers in this game.`;
  } else if (presence.type === 2) {
    status = 'IN_GAME_HIDDEN';
    message = 'The player appears to be in a game, but Roblox did not expose the exact server. Add the game URL to scan its public servers.';
  } else {
    status = 'NO_PUBLIC_SERVER';
    message = 'Roblox did not expose a public game server for this account. Add the game URL if you know what they are playing.';
  }

  return {
    searchedAt: new Date().toISOString(),
    source,
    status,
    user: { ...user, avatarUrl },
    presence,
    game,
    scan: scan ? { ...scan, placeId: requestedPlaceId } : null,
    joins,
    privacy: {
      exactServerAvailable,
      message,
    },
  };
}
