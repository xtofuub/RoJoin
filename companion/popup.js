const statusNode = document.querySelector('#status');
const identityNode = document.querySelector('#identity');
const workspaceNode = document.querySelector('#workspace');
const onlineCountNode = document.querySelector('#online-count');
const joinableCountNode = document.querySelector('#joinable-count');
const filterNode = document.querySelector('#filter');
const friendsNode = document.querySelector('#friends');
const refreshButton = document.querySelector('#refresh');
const modeButtons = [...document.querySelectorAll('[data-mode]')];

const CACHE_KEY = 'rojoiner-companion-snapshot-v2';
const RATE_LIMIT_KEY = 'rojoiner-companion-rate-limit-until';
const CACHE_TTL_MS = 90_000;
const MIN_MANUAL_REFRESH_MS = 30_000;
const REQUEST_GAP_MS = 220;
const DEFAULT_RATE_LIMIT_MS = 45_000;

let friends = [];
let mode = 'joinable';
let loading = false;
let nextRequestAt = 0;

class RateLimitError extends Error {
  constructor(message, retryAfterMs) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function initials(value) {
  return String(value || 'R')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || 'R';
}

function validId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (!parsed?.savedAt || !parsed?.snapshot?.me || !Array.isArray(parsed?.snapshot?.friends)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(snapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), snapshot }));
  } catch {
    // The companion still works if local storage is unavailable.
  }
}

function getRateLimitUntil() {
  const value = Number(localStorage.getItem(RATE_LIMIT_KEY) || 0);
  return Number.isFinite(value) ? value : 0;
}

function setRateLimitUntil(value) {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, String(value));
  } catch {
    // Ignore storage failures.
  }
}

function clearRateLimit() {
  try {
    localStorage.removeItem(RATE_LIMIT_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function formatWait(ms) {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  return seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds}s`;
}

function retryDelayFrom(response) {
  const retryAfter = response.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }

  const reset = Number(response.headers.get('x-ratelimit-reset'));
  if (Number.isFinite(reset) && reset > 0) return reset * 1000;
  return DEFAULT_RATE_LIMIT_MS;
}

async function requestGate() {
  const wait = Math.max(0, nextRequestAt - Date.now());
  if (wait) await sleep(wait);
  nextRequestAt = Date.now() + REQUEST_GAP_MS;
}

async function api(url, options = {}) {
  await requestGate();
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { accept: 'application/json', ...(options.headers || {}) },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);

  if (response.status === 429) {
    const retryAfterMs = Math.max(retryDelayFrom(response), 15_000);
    throw new RateLimitError('Roblox is rate-limiting friend requests.', retryAfterMs);
  }

  if (!response.ok) {
    throw new Error(payload?.errors?.[0]?.message || `Roblox request failed (${response.status}).`);
  }
  return payload;
}

function batches(values, size = 50) {
  const output = [];
  for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size));
  return output;
}

function uniqueIds(values) {
  return [...new Set(values.map(validId).filter(Boolean))];
}

function onlineItemId(item) {
  return validId(
    item?.userId ??
    item?.id ??
    item?.userPresence?.userId ??
    item?.userPresence?.UserId
  );
}

async function fetchOnlineFriendIds(userId) {
  const payload = await api(`https://friends.roblox.com/v1/users/${encodeURIComponent(userId)}/friends/online`);
  return uniqueIds((payload?.data || []).map(onlineItemId));
}

async function fetchAllFriendIds(userId) {
  const ids = [];
  const seen = new Set();
  let cursor = null;

  for (let page = 0; page < 24; page += 1) {
    const url = new URL(`https://friends.roblox.com/v1/users/${encodeURIComponent(userId)}/friends/find`);
    url.searchParams.set('limit', '50');
    url.searchParams.set('userSort', 'FriendScore');
    if (cursor) url.searchParams.set('cursor', cursor);

    const payload = await api(url.toString());
    for (const item of payload?.PageItems || payload?.pageItems || []) {
      const id = validId(item?.id || item?.userId);
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }

    cursor = payload?.NextCursor || payload?.nextCursor || null;
    if (!cursor) break;
  }

  if (ids.length) return ids;

  const legacy = await api(`https://friends.roblox.com/v1/users/${encodeURIComponent(userId)}/friends`);
  for (const item of legacy?.data || []) {
    const id = validId(item?.id || item?.userId);
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

async function hydrateProfiles(userIds) {
  const map = new Map();
  for (const batch of batches(uniqueIds(userIds), 100)) {
    const payload = await api('https://users.roblox.com/v1/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userIds: batch, excludeBannedUsers: false }),
    });
    for (const user of payload?.data || []) {
      const id = validId(user.id);
      if (id) map.set(id, user);
    }
  }
  return map;
}

async function presenceMap(userIds) {
  const map = new Map();
  for (const batch of batches(uniqueIds(userIds), 50)) {
    const payload = await api('https://presence.roblox.com/v1/presence/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userIds: batch }),
    });
    for (const presence of payload?.userPresences || []) {
      const id = validId(presence.userId);
      if (id) map.set(id, presence);
    }
  }
  return map;
}

async function avatarMap(userIds) {
  const map = new Map();
  for (const batch of batches(uniqueIds(userIds), 100)) {
    const url = new URL('https://thumbnails.roblox.com/v1/users/avatar-headshot');
    url.searchParams.set('userIds', batch.join(','));
    url.searchParams.set('size', '150x150');
    url.searchParams.set('format', 'Png');
    url.searchParams.set('isCircular', 'false');
    const payload = await api(url.toString());
    for (const item of payload?.data || []) {
      const id = validId(item.targetId);
      if (id) map.set(id, item.imageUrl || null);
    }
  }
  return map;
}

function buildSnapshot(me, ids, profiles, presences, avatars) {
  const rows = ids.flatMap((id) => {
    const profile = profiles.get(id);
    if (!profile) return [];

    const username = String(profile.name || profile.username || '').trim();
    if (!username) return [];

    const presence = presences.get(id);
    const presenceType = Number(presence?.userPresenceType || 0);
    if (presenceType <= 0) return [];

    const placeId = Number(presence?.placeId);
    const gameId = typeof presence?.gameId === 'string' && presence.gameId ? presence.gameId : null;
    const location = presence?.lastLocation && presence.lastLocation !== 'Website' ? presence.lastLocation : '';

    return [{
      id,
      username,
      displayName: String(profile.displayName || username).trim() || username,
      avatarUrl: avatars.get(id) || null,
      location,
      presenceType,
      placeId: Number.isSafeInteger(placeId) && placeId > 0 ? placeId : null,
      gameId,
    }];
  });

  rows.sort((a, b) => {
    if (a.presenceType === 2 && b.presenceType !== 2) return -1;
    if (a.presenceType !== 2 && b.presenceType === 2) return 1;
    return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' });
  });

  return {
    me: {
      id: Number(me.id),
      username: String(me.name || ''),
      displayName: String(me.displayName || me.name || ''),
      avatarUrl: avatars.get(validId(me.id)) || null,
    },
    friends: rows,
  };
}

async function loadSnapshot() {
  const me = await api('https://users.roblox.com/v1/users/authenticated');

  let candidateIds = await fetchOnlineFriendIds(me.id);
  let presences = new Map();

  if (candidateIds.length) {
    presences = await presenceMap(candidateIds);
  } else {
    const allFriendIds = await fetchAllFriendIds(me.id);

    if (!allFriendIds.length) {
      const countPayload = await api(`https://friends.roblox.com/v1/users/${encodeURIComponent(me.id)}/friends/count`).catch(() => null);
      const count = Number(countPayload?.count || 0);
      if (count > 0) throw new Error(`Roblox reports ${count} friends but returned no friend IDs.`);
      candidateIds = [];
    } else {
      presences = await presenceMap(allFriendIds);
      candidateIds = allFriendIds.filter((id) => Number(presences.get(id)?.userPresenceType || 0) > 0);
    }
  }

  candidateIds = uniqueIds(candidateIds);

  if (candidateIds.length && !presences.size) {
    presences = await presenceMap(candidateIds);
  }

  const profiles = await hydrateProfiles(candidateIds);
  const avatars = await avatarMap([me.id, ...candidateIds]);
  return buildSnapshot(me, candidateIds, profiles, presences, avatars);
}

function avatarHTML(url, name, className) {
  return `<div class="${className}"><img src="${escapeHTML(url || 'icon.svg')}" alt="" /><span>${escapeHTML(initials(name))}</span></div>`;
}

function presenceLabel(friend) {
  if (friend.presenceType === 2) return friend.location || 'In game';
  if (friend.presenceType === 3) return 'In Studio';
  return 'Online';
}

function presenceClass(friend) {
  if (friend.presenceType === 2) return 'in-game';
  if (friend.presenceType === 3) return 'studio';
  return '';
}

function joinUrl(friend) {
  if (friend.presenceType !== 2) return null;
  if (friend.placeId && friend.gameId) {
    return `roblox://experiences/start?placeId=${encodeURIComponent(friend.placeId)}&gameInstanceId=${encodeURIComponent(friend.gameId)}`;
  }
  return `roblox://userId=${encodeURIComponent(friend.id)}`;
}

function attachAvatarFallbacks(scope) {
  scope.querySelectorAll('.identity-avatar img, .friend-avatar img').forEach((image) => {
    image.addEventListener('error', () => image.remove(), { once: true });
    if (image.complete && image.naturalWidth === 0) image.remove();
  });
}

function renderFriends() {
  const query = filterNode.value.trim().toLowerCase();
  const inGame = friends.filter((friend) => friend.presenceType === 2);
  const base = mode === 'joinable' ? inGame : friends;
  const visible = base.filter((friend) => `${friend.displayName} ${friend.username} ${friend.location}`.toLowerCase().includes(query));

  onlineCountNode.textContent = String(friends.length);
  joinableCountNode.textContent = String(inGame.length);

  friendsNode.innerHTML = visible.length
    ? visible.map((friend) => {
      const join = joinUrl(friend);
      const exact = Boolean(friend.placeId && friend.gameId);
      return `
      <article class="friend">
        ${avatarHTML(friend.avatarUrl, friend.displayName, 'friend-avatar')}
        <div class="friend-copy">
          <strong>${escapeHTML(friend.displayName)}</strong>
          <span>@${escapeHTML(friend.username)}</span>
          <small class="${presenceClass(friend)}">${escapeHTML(presenceLabel(friend))}</small>
        </div>
        <div class="friend-actions">
          ${join ? `<a class="join" href="${escapeHTML(join)}" title="${exact ? 'Join exact server' : 'Ask Roblox to join this friend'}">Join</a>` : ''}
          <a href="https://www.roblox.com/users/${encodeURIComponent(friend.id)}/profile" target="_blank" rel="noreferrer">Profile</a>
        </div>
      </article>`;
    }).join('')
    : `<div class="empty">${mode === 'joinable' ? 'None of your online friends are currently shown as in-game.' : 'No online friends match this filter.'}</div>`;

  attachAvatarFallbacks(friendsNode);
}

function setMode(nextMode) {
  mode = nextMode;
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  renderFriends();
}

function renderSnapshot(snapshot) {
  friends = Array.isArray(snapshot?.friends) ? snapshot.friends : [];
  identityNode.innerHTML = `
    ${avatarHTML(snapshot.me.avatarUrl, snapshot.me.displayName || snapshot.me.username, 'identity-avatar')}
    <div class="identity-copy"><strong>${escapeHTML(snapshot.me.displayName || snapshot.me.username)}</strong><span>@${escapeHTML(snapshot.me.username)}</span></div>
    <a href="https://www.roblox.com/users/${encodeURIComponent(snapshot.me.id)}/profile" target="_blank" rel="noreferrer">Profile</a>`;
  attachAvatarFallbacks(identityNode);
  identityNode.hidden = false;
  workspaceNode.hidden = false;
  renderFriends();
}

function hideStatus() {
  statusNode.hidden = true;
  statusNode.classList.remove('error', 'notice');
}

function showStatus(message, { error = false, compact = false } = {}) {
  statusNode.hidden = false;
  statusNode.classList.toggle('error', error);
  statusNode.classList.toggle('notice', compact);
  statusNode.innerHTML = message;
}

function setLoadingState(value) {
  loading = value;
  refreshButton.disabled = value;
  refreshButton.classList.toggle('loading', value);
  refreshButton.setAttribute('aria-busy', String(value));
}

async function load({ force = false } = {}) {
  if (loading) return;

  const cached = readCache();
  const cacheAge = cached ? Date.now() - cached.savedAt : Infinity;
  const blockedUntil = getRateLimitUntil();

  if (cached) renderSnapshot(cached.snapshot);

  if (blockedUntil > Date.now()) {
    showStatus(`Roblox is rate-limiting refreshes. ${cached ? 'Showing the last successful result. ' : ''}Try again in <strong>${formatWait(blockedUntil - Date.now())}</strong>.`, {
      error: true,
      compact: Boolean(cached),
    });
    return;
  }

  if (!force && cached && cacheAge < CACHE_TTL_MS) {
    hideStatus();
    return;
  }

  if (force && cached && cacheAge < MIN_MANUAL_REFRESH_MS) {
    showStatus(`Already refreshed <strong>${formatWait(cacheAge)}</strong> ago. Using the cached result to avoid Roblox rate limits.`, {
      compact: true,
    });
    return;
  }

  setLoadingState(true);
  if (cached) {
    showStatus('Refreshing Roblox presence…', { compact: true });
  } else {
    identityNode.hidden = true;
    workspaceNode.hidden = true;
    showStatus('Loading your online Roblox friends…');
  }

  try {
    const snapshot = await loadSnapshot();
    clearRateLimit();
    writeCache(snapshot);
    renderSnapshot(snapshot);
    hideStatus();
  } catch (error) {
    if (error instanceof RateLimitError) {
      const retryAfterMs = Math.max(error.retryAfterMs || DEFAULT_RATE_LIMIT_MS, 15_000);
      setRateLimitUntil(Date.now() + retryAfterMs);
      showStatus(`Roblox temporarily rate-limited the refresh. ${cached ? 'Showing the last successful result. ' : ''}Try again in <strong>${formatWait(retryAfterMs)}</strong>.`, {
        error: true,
        compact: Boolean(cached),
      });
    } else {
      showStatus(`Could not load your Roblox friends.<br /><br />${escapeHTML(error.message)}`, {
        error: true,
        compact: Boolean(cached),
      });
    }
  } finally {
    setLoadingState(false);
  }
}

filterNode.addEventListener('input', renderFriends);
refreshButton.addEventListener('click', () => load({ force: true }));
modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
load();
