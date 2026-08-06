const statusNode = document.querySelector('#status');
const identityNode = document.querySelector('#identity');
const toolbarNode = document.querySelector('#toolbar');
const countNode = document.querySelector('#count');
const filterNode = document.querySelector('#filter');
const friendsNode = document.querySelector('#friends');
const refreshButton = document.querySelector('#refresh');

let friends = [];

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: { accept: 'application/json', ...(options.headers || {}) },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.errors?.[0]?.message || `Roblox request failed (${response.status}).`);
  return payload;
}

async function avatarMap(userIds) {
  if (!userIds.length) return new Map();
  const url = new URL('https://thumbnails.roblox.com/v1/users/avatar-headshot');
  url.searchParams.set('userIds', userIds.join(','));
  url.searchParams.set('size', '150x150');
  url.searchParams.set('format', 'Png');
  url.searchParams.set('isCircular', 'false');
  const payload = await api(url);
  return new Map((payload?.data || []).map((item) => [Number(item.targetId), item.imageUrl]));
}

function renderFriends() {
  const query = filterNode.value.trim().toLowerCase();
  const visible = friends.filter((friend) => `${friend.displayName} ${friend.username}`.toLowerCase().includes(query));
  countNode.textContent = `${friends.length} online`;
  friendsNode.innerHTML = visible.length
    ? visible.map((friend) => `
      <article class="friend">
        <img src="${escapeHTML(friend.avatarUrl || 'icon.svg')}" alt="" />
        <div><strong>${escapeHTML(friend.displayName)}</strong><span>@${escapeHTML(friend.username)} · ${escapeHTML(friend.location)}</span></div>
        <a href="roblox://userId=${encodeURIComponent(friend.id)}">Join</a>
      </article>`).join('')
    : '<div class="empty">No matching online friends.</div>';
}

async function load() {
  statusNode.hidden = false;
  statusNode.classList.remove('error');
  statusNode.textContent = 'Checking your Roblox session…';
  identityNode.hidden = true;
  toolbarNode.hidden = true;
  friendsNode.innerHTML = '';

  try {
    const me = await api('https://users.roblox.com/v1/users/authenticated');
    const [online, meAvatar] = await Promise.all([
      api(`https://friends.roblox.com/v1/users/${me.id}/friends/online`),
      avatarMap([me.id]),
    ]);

    const rawFriends = Array.isArray(online?.data) ? online.data : [];
    const ids = rawFriends.map((friend) => Number(friend.id || friend.userId)).filter(Number.isFinite);
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

    const presenceMap = new Map((presencePayload?.userPresences || []).map((presence) => [Number(presence.userId), presence]));
    friends = rawFriends.map((friend) => {
      const id = Number(friend.id || friend.userId);
      const presence = presenceMap.get(id);
      return {
        id,
        username: friend.name || friend.username || `User ${id}`,
        displayName: friend.displayName || friend.name || friend.username || `User ${id}`,
        avatarUrl: avatars.get(id) || null,
        location: presence?.lastLocation && presence.lastLocation !== 'Website' ? presence.lastLocation : 'Online',
      };
    });

    identityNode.innerHTML = `<img src="${escapeHTML(meAvatar.get(Number(me.id)) || 'icon.svg')}" alt="" /><div><strong>${escapeHTML(me.displayName || me.name)}</strong><span>@${escapeHTML(me.name)}</span></div>`;
    identityNode.hidden = false;
    toolbarNode.hidden = false;
    statusNode.hidden = true;
    renderFriends();
  } catch (error) {
    friends = [];
    statusNode.classList.add('error');
    statusNode.innerHTML = `Could not read your Roblox session. Sign in at <strong>roblox.com</strong>, then reopen the companion.<br /><br />${escapeHTML(error.message)}`;
  }
}

filterNode.addEventListener('input', renderFriends);
refreshButton.addEventListener('click', load);
load();
