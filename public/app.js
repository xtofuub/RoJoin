const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('en');

const STORAGE = {
  players: 'rojoiner:favourite-players:v1',
  games: 'rojoiner:favourite-games:v1',
  recent: 'rojoiner:recent-servers:v1',
};

const state = {
  player: null,
  game: null,
  servers: [],
  nextCursor: null,
  sharedServerId: null,
};

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  renderLibrary();
}

function upsertStore(key, item, identity, max = 30) {
  const items = readStore(key).filter((entry) => identity(entry) !== identity(item));
  items.unshift(item);
  writeStore(key, items.slice(0, max));
}

let toastTimer;
function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('visible'), 2400);
}

async function copyText(value, message = 'Copied') {
  try {
    await navigator.clipboard.writeText(value);
    toast(message);
  } catch {
    window.prompt('Copy this link:', value);
  }
}

async function request(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || 'The request failed.');
    error.code = payload?.error?.code || 'REQUEST_FAILED';
    throw error;
  }
  return payload;
}

function setBusy(form, busy, label) {
  const button = $('button[type="submit"]', form);
  if (!button) return;
  button.disabled = busy;
  const text = $('span', button);
  if (!button.dataset.label) button.dataset.label = text.textContent;
  text.textContent = busy ? label : button.dataset.label;
  button.classList.toggle('loading', busy);
}

function renderLoading(target, title, detail) {
  target.innerHTML = `<div class="loading-block"><span class="loading-line"></span><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(detail)}</p></div></div>`;
}

function renderError(target, error) {
  target.innerHTML = `<div class="error-block"><span>${escapeHTML(error.code || 'REQUEST_FAILED')}</span><div><strong>Could not complete the request.</strong><p>${escapeHTML(error.message)}</p></div></div>`;
}

function setTab(name, scroll = false) {
  $$('.tool-tab').forEach((button) => {
    const active = button.dataset.tab === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  $$('.tool-panel').forEach((panel) => {
    const active = panel.dataset.panel === name;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
  if (name === 'library') renderLibrary();
  if (scroll) $('#toolkit').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$$('.tool-tab').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));

function playerShareUrl(username) {
  return `${location.origin}/player/${encodeURIComponent(username)}`;
}

function gameShareUrl(placeId) {
  return `${location.origin}/game/${encodeURIComponent(placeId)}`;
}

function serverShareUrl(placeId, serverId) {
  return `${location.origin}/server/${encodeURIComponent(placeId)}/${encodeURIComponent(serverId)}`;
}

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function publicLocation(data) {
  if (data.game?.name) return data.game.name;
  if (data.presence?.lastLocation && data.presence.lastLocation !== 'Website') return data.presence.lastLocation;
  return 'Not exposed';
}

function playerStatus(data) {
  if (data.status === 'JOINABLE') return ['EXACT SERVER FOUND', 'good'];
  if (data.status === 'IN_GAME_HIDDEN') return ['IN GAME / SERVER HIDDEN', 'warn'];
  return ['NO PUBLIC SERVER EXPOSED', 'muted'];
}

function renderPlayer(data) {
  state.player = data;
  const target = $('#player-state');
  const [statusText, statusClass] = playerStatus(data);
  const social = data.user.social || {};
  const placeId = data.presence?.placeId || data.presence?.rootPlaceId;
  const launch = data.joins?.exact?.app || data.joins?.follow?.app;
  const launchText = data.joins?.exact?.app ? 'Open exact server' : 'Try joining player';
  const diagnosticRows = [
    ['Public presence', data.diagnostics?.publicPresenceReturned ? 'Returned' : 'Not returned'],
    ['Public place', data.diagnostics?.publicPlaceReturned ? 'Returned' : 'Hidden'],
    ['Exact instance', data.diagnostics?.exactInstanceReturned ? 'Returned' : 'Hidden'],
    ['Fallback', data.diagnostics?.fallbackUsesRoblox ? 'Roblox-controlled' : 'Unavailable'],
  ];

  target.innerHTML = `
    <article class="player-result">
      <div class="result-topline"><span class="status ${statusClass}">${statusText}</span><span>${escapeHTML(new Date(data.searchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</span></div>
      <div class="player-identity">
        <img src="${escapeHTML(data.user.avatarUrl || '/favicon.svg')}" alt="${escapeHTML(data.user.displayName)} avatar" />
        <div><h4>${escapeHTML(data.user.displayName)}${data.user.hasVerifiedBadge ? '<i title="Verified">✓</i>' : ''}</h4><a href="${escapeHTML(data.user.profileUrl)}" target="_blank" rel="noreferrer">@${escapeHTML(data.user.username)}</a><p>Joined ${escapeHTML(formatDate(data.user.created))}</p></div>
      </div>
      <div class="metric-grid">
        <div><span>Friends</span><strong>${social.friends == null ? '—' : integer.format(social.friends)}</strong></div>
        <div><span>Followers</span><strong>${social.followers == null ? '—' : compact.format(social.followers)}</strong></div>
        <div><span>Following</span><strong>${social.following == null ? '—' : compact.format(social.following)}</strong></div>
        <div><span>Public location</span><strong>${escapeHTML(publicLocation(data))}</strong></div>
      </div>
      <p class="result-message">${escapeHTML(data.privacy.message)}</p>
      <div class="diagnostic-list">${diagnosticRows.map(([key, value]) => `<div><span>${escapeHTML(key)}</span><b>${escapeHTML(value)}</b></div>`).join('')}</div>
      <div class="result-actions">
        ${launch ? `<a class="button primary" href="${escapeHTML(launch)}" data-player-launch>${escapeHTML(launchText)} <span>→</span></a>` : ''}
        ${placeId ? `<a class="button" href="/game/${encodeURIComponent(placeId)}">Browse game</a>` : ''}
        <button class="button" type="button" data-save-player>Save player</button>
        <button class="button" type="button" data-share-player>Copy share link</button>
      </div>
    </article>`;

  $('[data-save-player]', target)?.addEventListener('click', () => {
    upsertStore(STORAGE.players, {
      id: data.user.id,
      username: data.user.username,
      displayName: data.user.displayName,
      avatarUrl: data.user.avatarUrl,
      profileUrl: data.user.profileUrl,
      joinUrl: data.joins?.follow?.app,
    }, (item) => item.id);
    toast('Player saved locally');
  });
  $('[data-share-player]', target)?.addEventListener('click', () => copyText(playerShareUrl(data.user.username), 'Player link copied'));
}

async function runPlayerSearch(username, updatePath = false) {
  const input = String(username || '').trim();
  if (!input) return;
  const form = $('#player-form');
  const target = $('#player-state');
  setBusy(form, true, 'Searching…');
  renderLoading(target, `Checking @${input}`, 'Resolving account, public presence, social counts, and launch options.');
  try {
    const data = await request('/api/search', { username: input });
    renderPlayer(data);
    if (updatePath) history.replaceState({}, '', `/player/${encodeURIComponent(data.user.username)}`);
  } catch (error) {
    renderError(target, error);
  } finally {
    setBusy(form, false);
  }
}

$('#player-form').addEventListener('submit', (event) => {
  event.preventDefault();
  runPlayerSearch($('#player-username').value, true);
});

function chooseServer(mode) {
  const available = state.servers.filter((server) => !server.isFull);
  if (!available.length) return null;
  if (mode === 'small') return [...available].sort((a, b) => a.playing - b.playing)[0];
  if (mode === 'large') return [...available].sort((a, b) => b.playing - a.playing)[0];
  return available[Math.floor(Math.random() * available.length)];
}

function rememberServer(server) {
  if (!state.game || !server) return;
  upsertStore(STORAGE.recent, {
    placeId: state.game.placeId,
    serverId: server.id,
    gameName: state.game.name,
    iconUrl: state.game.iconUrl,
    playing: server.playing,
    maxPlayers: server.maxPlayers,
    joinUrl: server.joins.app,
    visitedAt: new Date().toISOString(),
  }, (item) => `${item.placeId}:${item.serverId}`, 12);
}

function serverCard(server) {
  return `<article class="server-card${state.sharedServerId === server.id ? ' highlighted' : ''}">
    <div class="server-card-head"><span>${server.playing}/${server.maxPlayers}</span><b>${server.capacity}% full</b></div>
    <div class="capacity"><i style="width:${Math.min(server.capacity, 100)}%"></i></div>
    <dl><div><dt>Ping</dt><dd>${server.ping == null ? '—' : `${server.ping} ms`}</dd></div><div><dt>FPS</dt><dd>${server.fps == null ? '—' : Math.round(server.fps)}</dd></div><div><dt>Instance</dt><dd title="${escapeHTML(server.id)}">${escapeHTML(server.id.slice(0, 8))}…</dd></div></dl>
    <div class="server-actions"><a href="${escapeHTML(server.joins.app)}" data-join-server="${escapeHTML(server.id)}">Join</a><button type="button" data-copy-server="${escapeHTML(server.id)}">Share</button></div>
  </article>`;
}

function renderServerPage(data, append = false) {
  state.game = data.game;
  state.nextCursor = data.nextPageCursor;
  state.servers = append ? [...state.servers, ...data.servers.filter((next) => !state.servers.some((old) => old.id === next.id))] : data.servers;
  const target = $('#server-state');
  const recent = readStore(STORAGE.recent)[0];
  const sharedBanner = state.sharedServerId ? `<div class="shared-server"><div><span>SHARED INSTANCE</span><strong>${escapeHTML(state.sharedServerId)}</strong></div><a href="roblox://placeId=${encodeURIComponent(data.game.placeId)}&gameInstanceId=${encodeURIComponent(state.sharedServerId)}" data-direct-shared>Open shared server →</a></div>` : '';

  target.innerHTML = `
    <article class="game-result">
      <div class="game-summary">
        <img src="${escapeHTML(data.game.iconUrl || '/favicon.svg')}" alt="${escapeHTML(data.game.name)} icon" />
        <div><span class="panel-code">PUBLIC EXPERIENCE</span><h4>${escapeHTML(data.game.name)}</h4><p>By ${escapeHTML(data.game.creator || 'Unknown creator')}</p></div>
        <div class="game-stats"><div><span>Playing</span><b>${data.game.playing == null ? '—' : compact.format(data.game.playing)}</b></div><div><span>Visits</span><b>${data.game.visits == null ? '—' : compact.format(data.game.visits)}</b></div><div><span>Max/server</span><b>${data.game.maxPlayers ?? '—'}</b></div></div>
      </div>
      <div class="quick-actions">
        <button type="button" data-quick="small">Smallest server</button>
        <button type="button" data-quick="large">Largest open</button>
        <button type="button" data-quick="random">Random server</button>
        ${recent ? `<a href="${escapeHTML(recent.joinUrl)}" data-rejoin>Rejoin last</a>` : ''}
        <button type="button" data-save-game>Save game</button>
        <button type="button" data-share-game>Copy game link</button>
      </div>
      ${sharedBanner}
      <div class="server-toolbar"><span>${integer.format(state.servers.length)} public instances loaded</span><a href="${escapeHTML(data.game.gameUrl)}" target="_blank" rel="noreferrer">Open game page ↗</a></div>
      <div class="server-grid">${state.servers.length ? state.servers.map(serverCard).join('') : '<div class="no-results">No public servers matched these filters.</div>'}</div>
      ${state.nextCursor ? '<button class="load-more" type="button" data-load-more>Load next page</button>' : ''}
    </article>`;

  $$('[data-join-server]', target).forEach((link) => link.addEventListener('click', () => {
    const server = state.servers.find((item) => item.id === link.dataset.joinServer);
    rememberServer(server);
  }));
  $$('[data-copy-server]', target).forEach((button) => button.addEventListener('click', () => copyText(serverShareUrl(data.game.placeId, button.dataset.copyServer), 'Server link copied')));
  $$('[data-quick]', target).forEach((button) => button.addEventListener('click', () => {
    const server = chooseServer(button.dataset.quick);
    if (!server) return toast('No open server is available in this page');
    rememberServer(server);
    location.href = server.joins.app;
  }));
  $('[data-rejoin]', target)?.addEventListener('click', () => toast('Opening your last saved server'));
  $('[data-save-game]', target)?.addEventListener('click', () => {
    upsertStore(STORAGE.games, {
      placeId: data.game.placeId,
      universeId: data.game.universeId,
      name: data.game.name,
      creator: data.game.creator,
      iconUrl: data.game.iconUrl,
      launchUrl: data.game.launchUrl,
    }, (item) => item.placeId);
    toast('Game saved locally');
  });
  $('[data-share-game]', target)?.addEventListener('click', () => copyText(gameShareUrl(data.game.placeId), 'Game link copied'));
  $('[data-load-more]', target)?.addEventListener('click', () => runServerSearch(data.game.placeId, true));
}

async function runServerSearch(place, append = false) {
  const input = String(place || '').trim();
  if (!input) return;
  const form = $('#server-form');
  const target = $('#server-state');
  setBusy(form, true, append ? 'Loading…' : 'Browsing…');
  if (!append) renderLoading(target, 'Loading public servers', 'Fetching game details and the current public server page.');
  try {
    const data = await request('/api/game', {
      place: input,
      sortOrder: $('#server-sort').value,
      excludeFull: $('#exclude-full').checked,
      cursor: append ? state.nextCursor : null,
    });
    renderServerPage(data, append);
    if (!append) history.replaceState({}, '', `/game/${encodeURIComponent(data.game.placeId)}`);
  } catch (error) {
    renderError(target, error);
  } finally {
    setBusy(form, false);
  }
}

$('#server-form').addEventListener('submit', (event) => {
  event.preventDefault();
  state.sharedServerId = null;
  runServerSearch($('#game-place').value);
});

function profileCompareCard(user, label) {
  return `<article class="compare-profile"><span>${label}</span><img src="${escapeHTML(user.avatarUrl || '/favicon.svg')}" alt="${escapeHTML(user.displayName)} avatar"/><h4>${escapeHTML(user.displayName)}</h4><a href="${escapeHTML(user.profileUrl)}" target="_blank" rel="noreferrer">@${escapeHTML(user.username)}</a><dl><div><dt>Friends</dt><dd>${user.social?.friends ?? '—'}</dd></div><div><dt>Followers</dt><dd>${user.social?.followers == null ? '—' : compact.format(user.social.followers)}</dd></div><div><dt>Joined</dt><dd>${escapeHTML(formatDate(user.created))}</dd></div></dl></article>`;
}

function renderComparison(data) {
  const target = $('#compare-state');
  target.innerHTML = `<article class="compare-result">
    <div class="relationship-banner ${data.areFriends ? 'connected' : ''}"><span>${data.areFriends ? 'FRIENDS' : 'NOT FRIENDS'}</span><strong>${data.mutualCount} mutual public friend${data.mutualCount === 1 ? '' : 's'}</strong></div>
    <div class="compare-profiles">${profileCompareCard(data.userA, 'A')}${profileCompareCard(data.userB, 'B')}</div>
    <div class="mutual-section"><div class="subhead"><h4>Mutual friends</h4><span>${data.mutualCount}</span></div><div class="mutual-grid">${data.mutualFriends.length ? data.mutualFriends.map((friend) => `<a href="${escapeHTML(friend.profileUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHTML(friend.avatarUrl || '/favicon.svg')}" alt=""/><span>${escapeHTML(friend.displayName)}</span><small>@${escapeHTML(friend.username)}</small></a>`).join('') : '<p class="no-results">No mutual public friends were returned.</p>'}</div></div>
  </article>`;
}

$('#compare-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const target = $('#compare-state');
  setBusy(form, true, 'Comparing…');
  renderLoading(target, 'Comparing accounts', 'Loading public friend lists and account statistics.');
  try {
    const data = await request('/api/compare', { usernameA: $('#compare-a').value, usernameB: $('#compare-b').value });
    renderComparison(data);
  } catch (error) {
    renderError(target, error);
  } finally {
    setBusy(form, false);
  }
});

function savedEmpty(text) {
  return `<div class="saved-empty">${escapeHTML(text)}</div>`;
}

function renderLibrary() {
  const players = readStore(STORAGE.players);
  const games = readStore(STORAGE.games);
  const recent = readStore(STORAGE.recent);
  $('#player-count').textContent = players.length;
  $('#game-count').textContent = games.length;
  $('#recent-count').textContent = recent.length;

  $('#saved-players').innerHTML = players.length ? players.map((item) => `<article class="saved-item"><img src="${escapeHTML(item.avatarUrl || '/favicon.svg')}" alt=""/><div><strong>${escapeHTML(item.displayName)}</strong><span>@${escapeHTML(item.username)}</span></div><a href="${escapeHTML(item.joinUrl || playerShareUrl(item.username))}">Join</a><button data-remove-player="${item.id}" aria-label="Remove">×</button></article>`).join('') : savedEmpty('Saved players appear here.');
  $('#saved-games').innerHTML = games.length ? games.map((item) => `<article class="saved-item"><img src="${escapeHTML(item.iconUrl || '/favicon.svg')}" alt=""/><div><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.creator || `Place ${item.placeId}`)}</span></div><a href="/game/${encodeURIComponent(item.placeId)}">Browse</a><button data-remove-game="${escapeHTML(item.placeId)}" aria-label="Remove">×</button></article>`).join('') : savedEmpty('Saved games appear here.');
  $('#recent-servers').innerHTML = recent.length ? recent.map((item) => `<article class="saved-item"><img src="${escapeHTML(item.iconUrl || '/favicon.svg')}" alt=""/><div><strong>${escapeHTML(item.gameName)}</strong><span>${item.playing}/${item.maxPlayers} players · ${escapeHTML(formatDate(item.visitedAt))}</span></div><a href="${escapeHTML(item.joinUrl)}">Rejoin</a><button data-remove-server="${escapeHTML(item.placeId)}:${escapeHTML(item.serverId)}" aria-label="Remove">×</button></article>`).join('') : savedEmpty('Joined servers appear here.');

  $$('[data-remove-player]').forEach((button) => button.addEventListener('click', () => writeStore(STORAGE.players, players.filter((item) => String(item.id) !== button.dataset.removePlayer))));
  $$('[data-remove-game]').forEach((button) => button.addEventListener('click', () => writeStore(STORAGE.games, games.filter((item) => String(item.placeId) !== button.dataset.removeGame))));
  $$('[data-remove-server]').forEach((button) => button.addEventListener('click', () => writeStore(STORAGE.recent, recent.filter((item) => `${item.placeId}:${item.serverId}` !== button.dataset.removeServer))));
}

$('#clear-library').addEventListener('click', () => {
  if (!confirm('Clear all locally saved RoJoiner players, games, and recent servers?')) return;
  Object.values(STORAGE).forEach((key) => localStorage.removeItem(key));
  renderLibrary();
  toast('Local library cleared');
});

function parseInitialRoute() {
  const parts = location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'player' && parts[1]) {
    setTab('players');
    $('#player-username').value = parts[1];
    runPlayerSearch(parts[1]);
    return;
  }
  if (parts[0] === 'game' && parts[1]) {
    setTab('servers');
    $('#game-place').value = parts[1];
    runServerSearch(parts[1]);
    return;
  }
  if (parts[0] === 'server' && parts[1] && parts[2]) {
    state.sharedServerId = parts[2];
    setTab('servers');
    $('#game-place').value = parts[1];
    runServerSearch(parts[1]);
  }
}

renderLibrary();
parseInitialRoute();
