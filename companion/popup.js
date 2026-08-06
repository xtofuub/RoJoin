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

function batches(values, size = 100) {
  const output = [];
  for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size));
  return output;
}

async function avatarMap(userIds) {
  const map = new Map();
  for (const batch of batches([...new Set(userIds.map(validId).filter(Boolean))])) {
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

function attachAvatarFallbacks(scope) {
  scope.querySelectorAll('.identity-avatar img, .friend-avatar img').forEach((image) => {
    image.addEventListener('error', () => image.remove(), { once: true });
    if (image.complete && image.naturalWidth === 0) image.remove();
  });
}

function renderFriends() {
  const query = filterNode.value.trim().toLowerCase();
  const joinable = friends.filter((friend) => friend.presenceType === 2);
  const base = mode === 'joinable' ? joinable : friends;
  const visible = base.filter((friend) => `${friend.displayName} ${friend.username} ${friend.location}`.toLowerCase().includes(query));

  onlineCountNode.textContent = String(friends.length);
  joinableCountNode.textContent = String(joinable.length);

  friendsNode.innerHTML = visible.length
    ? visible.map((friend) => `
      <article class="friend">
        ${avatarHTML(friend.avatarUrl, friend.displayName, 'friend-avatar')}
        <div class="friend-copy">
          <strong>${escapeHTML(friend.displayName)}</strong>
          <span>@${escapeHTML(friend.username)}</span>
          <small class="${presenceClass(friend)}">${escapeHTML(presenceLabel(friend))}</small>
        </div>
        <div class="friend-actions">
          ${friend.presenceType === 2 ? `<a class="join" href="roblox://userId=${encodeURIComponent(friend.id)}">Join</a>` : ''}
          <a href="https://www.roblox.com/users/${encodeURIComponent(friend.id)}/profile" target="_blank" rel="noreferrer">Profile</a>
        </div>
      </article>`).join('')
    : `<div class="empty">${mode === 'joinable' ? 'None of your visible online friends are currently shown as in-game.' : 'No online friends match this filter.'}</div>`;

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
  statusNode.textContent = 'Checking your Roblox session…';
  identityNode.hidden = true;
  workspaceNode.hidden = true;
  friendsNode.innerHTML = '';
  refreshButton.classList.add('loading');
  refreshButton.disabled = true;

  try {
    const me = await api('https://users.roblox.com/v1/users/authenticated');
    const [online, meAvatar] = await Promise.all([
      api(`https://friends.roblox.com/v1/users/${me.id}/friends/online`),
      avatarMap([me.id]),
    ]);

    const rawFriends = Array.isArray(online?.data) ? online.data : [];
    const deduped = new Map();
    for (const friend of rawFriends) {
      const id = validId(friend.id || friend.userId);
      if (id && !deduped.has(id)) deduped.set(id, friend);
    }

    const ids = [...deduped.keys()];
    const [avatars, presencePayload] = await Promise.all([
      avatarMap(ids),
      ids.length
        ? api('https://presence.roblox.com/v1/presence/users', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ userIds: ids }),
          })
        : Promise.resolve({ userPresences: [] }),
    ]);

    const presenceMap = new Map((presencePayload?.userPresences || []).map((presence) => [validId(presence.userId), presence]));
    friends = ids.flatMap((id) => {
      const friend = deduped.get(id);
      const username = String(friend?.name || friend?.username || '').trim();
      if (!username) return [];
      const presence = presenceMap.get(id);
      const presenceType = Number(presence?.userPresenceType || 1);
      const location = presence?.lastLocation && presence.lastLocation !== 'Website' ? presence.lastLocation : '';
      return [{
        id,
        username,
        displayName: String(friend.displayName || username).trim() || username,
        avatarUrl: avatars.get(id) || null,
        location,
        presenceType,
      }];
    }).sort((a, b) => {
      if (a.presenceType === 2 && b.presenceType !== 2) return -1;
      if (a.presenceType !== 2 && b.presenceType === 2) return 1;
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
    statusNode.innerHTML = `Could not use your Roblox session. Sign in at <strong>roblox.com</strong>, then reopen the companion.<br /><br />${escapeHTML(error.message)}`;
  } finally {
    refreshButton.classList.remove('loading');
    refreshButton.disabled = false;
  }
}

filterNode.addEventListener('input', renderFriends);
refreshButton.addEventListener('click', load);
modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
load();
