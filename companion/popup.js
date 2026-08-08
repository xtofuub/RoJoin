const statusNode = document.querySelector('#status');
const identityNode = document.querySelector('#identity');
const workspaceNode = document.querySelector('#workspace');
const onlineCountNode = document.querySelector('#online-count');
const joinableCountNode = document.querySelector('#joinable-count');
const filterNode = document.querySelector('#filter');
const friendsNode = document.querySelector('#friends');
const refreshButton = document.querySelector('#refresh');
const modeButtons = [...document.querySelectorAll('[data-mode]')];

let friends = [];
let mode = 'joinable';

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

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { accept: 'application/json', ...(options.headers || {}) },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
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

async function avatarMap(userIds) {
  const map = new Map();
  for (const batch of batches([...new Set(userIds.map(validId).filter(Boolean))], 100)) {
    const url = new URL('https://thumbnails.roblox.com/v1/users/avatar-headshot');
    url.searchParams.set('userIds', batch.join(','));
    url.searchParams.set('size', '150x150');
    url.searchParams.set('format', 'Png');
    url.searchParams.set('isCircular', 'false');
    const payload = await api(url);
    for (const item of payload?.data || []) {
      const id = validId(item.targetId);
      if (id) map.set(id, item.imageUrl || null);
    }
  }
  return map;
}

async function hydrateProfiles(userIds) {
  const map = new Map();
  for (const batch of batches([...new Set(userIds.map(validId).filter(Boolean))], 100)) {
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
  for (const batch of batches([...new Set(userIds.map(validId).filter(Boolean))], 50)) {
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

async function fetchFriendIds(userId) {
  const ids = [];
  const seen = new Set();
  let cursor = null;

  for (let page = 0; page < 24; page += 1) {
    const url = new URL(`https://friends.roblox.com/v1/users/${encodeURIComponent(userId)}/friends/find`);
    url.searchParams.set('limit', '50');
    url.searchParams.set('userSort', 'FriendScore');
    if (cursor) url.searchParams.set('cursor', cursor);

    const payload = await api(url);
    const items = payload?.PageItems || payload?.pageItems || [];
    for (const item of items) {
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

async function loadDirectSnapshot() {
  const me = await api('https://users.roblox.com/v1/users/authenticated');
  const [friendIds, meAvatar, countPayload] = await Promise.all([
    fetchFriendIds(me.id),
    avatarMap([me.id]),
    api(`https://friends.roblox.com/v1/users/${encodeURIComponent(me.id)}/friends/count`).catch(() => null),
  ]);

  const expectedCount = Number(countPayload?.count || 0);
  if (!friendIds.length && expectedCount > 0) {
    throw new Error(`Roblox reports ${expectedCount} friends, but the friend pages were empty.`);
  }

  const [profiles, avatars, presences] = await Promise.all([
    hydrateProfiles(friendIds),
    avatarMap(friendIds),
    presenceMap(friendIds),
  ]);

  return buildSnapshot(me, meAvatar.get(Number(me.id)) || null, friendIds, profiles, avatars, presences);
}

function buildSnapshot(me, myAvatarUrl, friendIds, profiles, avatars, presences) {
  const rows = friendIds.flatMap((id) => {
    const profile = profiles.get(id);
    if (!profile) return [];
    const username = String(profile.name || profile.username || '').trim();
    if (!username) return [];
    const presence = presences.get(id);
    const presenceType = Number(presence?.userPresenceType || 0);
    const location = presence?.lastLocation && presence.lastLocation !== 'Website' ? presence.lastLocation : '';
    const placeId = Number(presence?.placeId);
    const gameId = typeof presence?.gameId === 'string' && presence.gameId ? presence.gameId : null;
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
    if (a.presenceType > b.presenceType) return -1;
    if (a.presenceType < b.presenceType) return 1;
    return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' });
  });

  return {
    me: {
      id: Number(me.id),
      username: String(me.name || ''),
      displayName: String(me.displayName || me.name || ''),
      avatarUrl: myAvatarUrl,
    },
    friends: rows,
  };
}

async function loadViaRobloxTab() {
  if (!browser?.tabs || !browser?.scripting) throw new Error('Roblox-tab bridge is unavailable.');

  const tabs = await browser.tabs.query({ url: ['https://www.roblox.com/*', 'https://roblox.com/*'] });
  const tab = tabs.find((item) => item.active) || tabs[0];
  if (!tab?.id) throw new Error('Open roblox.com in a tab, stay signed in, then press refresh.');

  const results = await browser.scripting.executeScript({
    target: { tabId: tab.id },
    world: 'MAIN',
    func: async () => {
      const request = async (url, options = {}) => {
        const response = await fetch(url, {
          ...options,
          credentials: 'include',
          headers: { accept: 'application/json', ...(options.headers || {}) },
          cache: 'no-store',
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.errors?.[0]?.message || `Roblox request failed (${response.status}).`);
        return payload;
      };
      const safeId = (value) => {
        const id = Number(value);
        return Number.isSafeInteger(id) && id > 0 ? id : null;
      };
      const batch = (values, size) => {
        const out = [];
        for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
        return out;
      };

      const me = await request('https://users.roblox.com/v1/users/authenticated');
      const ids = [];
      const seen = new Set();
      let cursor = null;
      for (let page = 0; page < 24; page += 1) {
        const url = new URL(`https://friends.roblox.com/v1/users/${encodeURIComponent(me.id)}/friends/find`);
        url.searchParams.set('limit', '50');
        url.searchParams.set('userSort', 'FriendScore');
        if (cursor) url.searchParams.set('cursor', cursor);
        const payload = await request(url.toString());
        const items = payload?.PageItems || payload?.pageItems || [];
        for (const item of items) {
          const id = safeId(item?.id || item?.userId);
          if (id && !seen.has(id)) { seen.add(id); ids.push(id); }
        }
        cursor = payload?.NextCursor || payload?.nextCursor || null;
        if (!cursor) break;
      }

      if (!ids.length) {
        const legacy = await request(`https://friends.roblox.com/v1/users/${encodeURIComponent(me.id)}/friends`);
        for (const item of legacy?.data || []) {
          const id = safeId(item?.id || item?.userId);
          if (id && !seen.has(id)) { seen.add(id); ids.push(id); }
        }
      }

      const countPayload = await request(`https://friends.roblox.com/v1/users/${encodeURIComponent(me.id)}/friends/count`).catch(() => null);
      const expectedCount = Number(countPayload?.count || 0);
      if (!ids.length && expectedCount > 0) throw new Error(`Roblox reports ${expectedCount} friends, but returned no friend IDs.`);

      const profiles = [];
      for (const group of batch(ids, 100)) {
        const payload = await request('https://users.roblox.com/v1/users', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ userIds: group, excludeBannedUsers: false }),
        });
        profiles.push(...(payload?.data || []));
      }

      const presences = [];
      for (const group of batch(ids, 50)) {
        const payload = await request('https://presence.roblox.com/v1/presence/users', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ userIds: group }),
        });
        presences.push(...(payload?.userPresences || []));
      }

      const avatarIds = [Number(me.id), ...ids];
      const avatars = [];
      for (const group of batch(avatarIds, 100)) {
        const url = new URL('https://thumbnails.roblox.com/v1/users/avatar-headshot');
        url.searchParams.set('userIds', group.join(','));
        url.searchParams.set('size', '150x150');
        url.searchParams.set('format', 'Png');
        url.searchParams.set('isCircular', 'false');
        const payload = await request(url.toString());
        avatars.push(...(payload?.data || []));
      }

      return { me, ids, profiles, presences, avatars };
    },
  });

  const raw = results?.[0]?.result;
  if (!raw?.me) throw new Error('The Roblox tab did not return session data.');

  const profiles = new Map((raw.profiles || []).map((item) => [validId(item.id), item]).filter(([id]) => id));
  const presences = new Map((raw.presences || []).map((item) => [validId(item.userId), item]).filter(([id]) => id));
  const avatars = new Map((raw.avatars || []).map((item) => [validId(item.targetId), item.imageUrl || null]).filter(([id]) => id));
  return buildSnapshot(raw.me, avatars.get(validId(raw.me.id)) || null, raw.ids || [], profiles, avatars, presences);
}

function avatarHTML(url, name, className) {
  return `<div class="${className}"><img src="${escapeHTML(url || 'icon.svg')}" alt="" /><span>${escapeHTML(initials(name))}</span></div>`;
}

function presenceLabel(friend) {
  if (friend.presenceType === 2) return friend.location || 'In game';
  if (friend.presenceType === 3) return 'In Studio';
  if (friend.presenceType === 1) return 'Online';
  return 'Offline';
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
    : `<div class="empty">${mode === 'joinable' ? 'None of your friends are currently shown as in-game to this Roblox session.' : 'No friends match this filter.'}</div>`;

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

async function load() {
  statusNode.hidden = false;
  statusNode.classList.remove('error');
  statusNode.textContent = 'Loading your Roblox friends…';
  identityNode.hidden = true;
  workspaceNode.hidden = true;
  friendsNode.innerHTML = '';
  refreshButton.classList.add('loading');
  refreshButton.disabled = true;

  try {
    let snapshot;
    try {
      snapshot = await loadViaRobloxTab();
    } catch (bridgeError) {
      console.warn('RoJoiner Roblox-tab bridge failed; using extension requests.', bridgeError);
      snapshot = await loadDirectSnapshot();
    }

    friends = snapshot.friends;
    identityNode.innerHTML = `
      ${avatarHTML(snapshot.me.avatarUrl, snapshot.me.displayName || snapshot.me.username, 'identity-avatar')}
      <div class="identity-copy"><strong>${escapeHTML(snapshot.me.displayName || snapshot.me.username)}</strong><span>@${escapeHTML(snapshot.me.username)}</span></div>
      <a href="https://www.roblox.com/users/${encodeURIComponent(snapshot.me.id)}/profile" target="_blank" rel="noreferrer">Profile</a>`;
    attachAvatarFallbacks(identityNode);

    identityNode.hidden = false;
    workspaceNode.hidden = false;
    statusNode.hidden = true;
    renderFriends();
  } catch (error) {
    friends = [];
    statusNode.classList.add('error');
    statusNode.innerHTML = `Could not load your Roblox friends. Keep a signed-in <strong>roblox.com</strong> tab open, then press refresh.<br /><br />${escapeHTML(error.message)}`;
  } finally {
    refreshButton.classList.remove('loading');
    refreshButton.disabled = false;
  }
}

filterNode.addEventListener('input', renderFriends);
refreshButton.addEventListener('click', load);
modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
load();
