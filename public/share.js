const originalReplaceState = history.replaceState.bind(history);

function normalizeInternalUrl(value) {
  const raw = String(value || '');
  let match = raw.match(/^\/player\/([^/?#]+)/);
  if (match) return `/?player=${encodeURIComponent(decodeURIComponent(match[1]))}`;
  match = raw.match(/^\/game\/(\d+)/);
  if (match) return `/?game=${encodeURIComponent(match[1])}`;
  match = raw.match(/^\/server\/(\d+)\/([^/?#]+)/);
  if (match) return `/?server=${encodeURIComponent(`${match[1]}:${decodeURIComponent(match[2])}`)}`;
  return value;
}

history.replaceState = (state, title, url) => originalReplaceState(state, title, normalizeInternalUrl(url));

async function copy(value, message) {
  try {
    await navigator.clipboard.writeText(value);
    const toast = document.querySelector('#toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2200);
    }
  } catch {
    window.prompt('Copy this link:', value);
  }
}

function currentPlaceId() {
  const gamePage = document.querySelector('.server-toolbar a[href*="roblox.com/games/"]');
  return gamePage?.href.match(/\/games\/(\d+)/)?.[1] || new URLSearchParams(location.search).get('game');
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('a, button');
  if (!target) return;

  if (target.matches('[data-share-player]')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const username = document.querySelector('.result-username')?.textContent?.replace(/^@/, '').trim();
    if (username) copy(`${location.origin}/?player=${encodeURIComponent(username)}`, 'Player link copied');
    return;
  }

  if (target.matches('[data-share-game]')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const placeId = currentPlaceId();
    if (placeId) copy(`${location.origin}/?game=${encodeURIComponent(placeId)}`, 'Game link copied');
    return;
  }

  if (target.matches('[data-copy-server]')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const placeId = currentPlaceId();
    const serverId = target.dataset.copyServer;
    if (placeId && serverId) copy(`${location.origin}/?server=${encodeURIComponent(`${placeId}:${serverId}`)}`, 'Server link copied');
    return;
  }

  if (target.matches('a[href^="/player/"], a[href^="/game/"], a[href^="/server/"]')) {
    event.preventDefault();
    location.href = normalizeInternalUrl(target.getAttribute('href'));
  }
}, true);

function activateTab(name) {
  document.querySelector(`.tool-tab[data-tab="${name}"]`)?.click();
}

function submitForm(form) {
  requestAnimationFrame(() => form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}

function showSharedServer(placeId, serverId) {
  const target = document.querySelector('#server-state');
  if (!target) return;
  const observer = new MutationObserver(() => {
    const result = target.querySelector('.game-result');
    if (!result || target.querySelector('[data-query-shared]')) return;
    const banner = document.createElement('div');
    banner.className = 'shared-server';
    banner.dataset.queryShared = 'true';
    banner.innerHTML = `<div><span>SHARED INSTANCE</span><strong>${serverId}</strong></div><a href="roblox://placeId=${encodeURIComponent(placeId)}&gameInstanceId=${encodeURIComponent(serverId)}">Open shared server →</a>`;
    result.prepend(banner);
    observer.disconnect();
  });
  observer.observe(target, { childList: true, subtree: true });
}

setTimeout(() => {
  const params = new URLSearchParams(location.search);
  const player = params.get('player');
  const game = params.get('game');
  const server = params.get('server');

  if (player) {
    activateTab('players');
    const input = document.querySelector('#player-username');
    if (input) input.value = player;
    submitForm(document.querySelector('#player-form'));
    return;
  }

  if (game) {
    activateTab('servers');
    const input = document.querySelector('#game-place');
    if (input) input.value = game;
    submitForm(document.querySelector('#server-form'));
    return;
  }

  if (server) {
    const separator = server.indexOf(':');
    if (separator > 0) {
      const placeId = server.slice(0, separator);
      const serverId = server.slice(separator + 1);
      activateTab('servers');
      const input = document.querySelector('#game-place');
      if (input) input.value = placeId;
      showSharedServer(placeId, serverId);
      submitForm(document.querySelector('#server-form'));
    }
  }
}, 0);
