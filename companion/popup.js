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
    const me = await api('https://users.roblox.com/v1/users/authenticated');
    const [friendPayload, meAvatar] = await Promise.all([
      api(`https://friends.roblox.com/v1/users/${encodeURIComponent(me.id)}/friends`),
      avatarMap([me.id]),
    ]);

    const rawFriends = Array.isArray(friendPayload?.data) ? friendPayload.data : [];
    const deduped = new Map();
    for (const friend of rawFriends) {
      const id = validId(friend.id || friend.userId);
      if (id && !deduped.has(id)) deduped.set(id, friend);
    }

    const ids = [...deduped.keys()];
    const [avatars, presences] = await Promise.all([
      avatarMap(ids),
      presenceMap(ids),
    ]);

    friends = ids.flatMap((id) => {
      const friend = deduped.get(id);
      const username = String(friend?.name || friend?.username || '').trim();
      if (!username) return [];
      const presence = presences.get(id);
      const presenceType = Number(presence?.userPresenceType || 0);
      const location = presence?.lastLocation && presence.lastLocation !== 'Website' ? presence.lastLocation : '';
      const placeId = Number(presence?.placeId);
      const gameId = typeof presence?.gameId === 'string' && presence.gameId ? presence.gameId : null;
      return [{
        id,
        username,
        displayName: String(friend.displayName || username).trim() || username,
        avatarUrl: avatars.get(id) || null,
        location,
        presenceType,
        placeId: Number.isSafeInteger(placeId) && placeId > 0 ? placeId : null,
        gameId,
      }];
    }).sort((a, b) => {
      if (a.presenceType === 2 && b.presenceType !== 2) return -1;
      if (a.presenceType !== 2 && b.presenceType === 2) return 1;
      if (a.presenceType > b.presenceType) return -1;
      if (a.presenceType < b.presenceType) return 1;
      return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' });
    });

    identityNode.innerHTML = `
      ${avatarHTML(meAvatar.get(Number(me.id)), me.displayName || me.name, 'identity-avatar')}
      <div class="identity-copy"><strong>${escapeHTML(me.displayName || me.name)}</strong><span>@${escapeHTML(me.name)}</span></div>
      <a href="https://www.roblox.com/users/${encodeURIComponent(me.id)}/profile" target="_blank" rel="noreferrer">Profile</a>`;
    attachAvatarFallbacks(identityNode);

    identityNode.hidden = false;
    workspaceNode.hidden = false;
    statusNode.hidden = true;
    renderFriends();
  } catch (error) {
    friends = [];
    statusNode.classList.add('error');
    statusNode.innerHTML = `Could not load your Roblox friends. Sign in at <strong>roblox.com</strong>, then reopen the companion.<br /><br />${escapeHTML(error.message)}`;
  } finally {
    refreshButton.classList.remove('loading');
    refreshButton.disabled = false;
  }
}

filterNode.addEventListener('input', renderFriends);
refreshButton.addEventListener('click', load);
modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
load();
