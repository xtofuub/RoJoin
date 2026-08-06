const form = document.querySelector('#search-form');
const usernameInput = document.querySelector('#username');
const placeInput = document.querySelector('#place');
const searchButton = document.querySelector('.search-button');
const clearButton = document.querySelector('.clear-input');
const state = document.querySelector('#search-state');
const template = document.querySelector('#result-template');

const escapeText = (value) => String(value ?? '');
const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function setLoading(loading) {
  searchButton.disabled = loading;
  usernameInput.disabled = loading;
  placeInput.disabled = loading;
  searchButton.classList.toggle('loading', loading);
  searchButton.querySelector('.button-label').textContent = loading ? 'Searching' : 'Find player';
}

function renderLoading(username, scansGame) {
  state.innerHTML = `
    <div class="loading-state">
      <div>
        <strong>${scansGame ? 'Scanning public servers…' : `Checking @${escapeText(username)}…`}</strong>
        <p>${scansGame ? 'Comparing public server player thumbnails. Large games can take longer.' : 'Resolving the account and reading the public presence response.'}</p>
      </div>
    </div>`;
}

function renderError(message, code = 'SEARCH_FAILED') {
  state.innerHTML = `
    <div class="search-error">
      <span>${escapeText(code).replaceAll('_', ' ')}</span>
      <div>
        <h3>Search stopped.</h3>
        <p>${escapeText(message)}</p>
      </div>
    </div>`;
}

function locationLabel(data) {
  if (data.game?.name) return data.game.name;
  if (data.status === 'NO_PUBLIC_SERVER') return 'Not exposed';
  if (data.presence?.lastLocation && data.presence.lastLocation !== 'Website') return data.presence.lastLocation;
  return data.presence?.label || 'Unknown';
}

function statusLabel(data) {
  const labels = {
    JOINABLE: data.source === 'PUBLIC_SERVER_SCAN' ? 'MATCH FOUND IN PUBLIC SERVER' : 'EXACT SERVER FOUND',
    IN_GAME_HIDDEN: 'GAME VISIBLE / SERVER HIDDEN',
    NO_PUBLIC_SERVER: 'NO PUBLIC SERVER EXPOSED',
    NOT_FOUND_IN_GAME: 'NOT FOUND IN SCANNED SERVERS',
    SCAN_UNAVAILABLE: 'PUBLIC SCAN UNAVAILABLE',
  };
  return labels[data.status] || data.presence?.label?.toUpperCase() || 'PUBLIC STATUS';
}

function renderResult(data) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector('.result-card');
  const avatar = fragment.querySelector('.result-avatar');
  const dot = fragment.querySelector('.presence-dot');
  const status = fragment.querySelector('.result-status');
  const display = fragment.querySelector('.result-display');
  const username = fragment.querySelector('.result-username');
  const location = fragment.querySelector('.result-location');
  const place = fragment.querySelector('.result-place');
  const server = fragment.querySelector('.result-server');
  const message = fragment.querySelector('.result-message');
  const exactJoin = fragment.querySelector('.exact-join');
  const profile = fragment.querySelector('.profile-button');
  const game = fragment.querySelector('.game-button');

  avatar.src = data.user.avatarUrl || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#171717"/><text x="50" y="60" text-anchor="middle" fill="#777" font-family="Arial" font-size="42">R</text></svg>`)}`;
  avatar.alt = `${data.user.displayName}'s Roblox avatar`;

  dot.classList.toggle('joinable', data.status === 'JOINABLE');
  dot.classList.toggle('ingame', data.presence?.type === 2 && data.status !== 'JOINABLE');

  status.textContent = statusLabel(data);
  status.style.color = data.status === 'JOINABLE'
    ? 'var(--green)'
    : ['IN_GAME_HIDDEN', 'NOT_FOUND_IN_GAME'].includes(data.status)
      ? 'var(--accent)'
      : 'var(--muted)';

  display.textContent = data.user.displayName;
  username.textContent = `@${data.user.username}`;
  username.href = data.user.profileUrl;
  location.textContent = locationLabel(data);
  if (data.game?.playing != null) location.title = `${compactNumber.format(data.game.playing)} players active`;

  const placeId = data.presence?.placeId || data.presence?.rootPlaceId || data.scan?.placeId || null;
  place.textContent = placeId || 'Not exposed';
  server.textContent = data.presence?.gameId ? `${data.presence.gameId.slice(0, 8)}…` : 'Not exposed';
  server.title = data.presence?.gameId || 'No exact public server ID was returned';
  message.textContent = data.privacy.message;
  profile.href = data.user.profileUrl;

  if (placeId) {
    game.href = `https://www.roblox.com/games/${encodeURIComponent(placeId)}`;
  } else {
    game.remove();
  }

  if (data.joins?.exact?.app) {
    exactJoin.href = data.joins.exact.app;
  } else {
    exactJoin.classList.add('disabled');
    exactJoin.querySelector('span').textContent = data.status === 'NOT_FOUND_IN_GAME'
      ? 'Player not found'
      : data.status === 'SCAN_UNAVAILABLE'
        ? 'Scan unavailable'
        : 'Exact server not exposed';
    exactJoin.removeAttribute('href');
  }

  state.replaceChildren(card);
}

async function runSearch(rawUsername, rawPlace) {
  const username = rawUsername.trim();
  const place = rawPlace.trim();

  if (!username) {
    renderError('Enter a Roblox username first.', 'INVALID_USERNAME');
    usernameInput.focus();
    return;
  }

  setLoading(true);
  renderLoading(username, Boolean(place));

  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, place }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.error?.message || 'The search failed.');
      error.code = payload?.error?.code || 'LOOKUP_FAILED';
      throw error;
    }
    renderResult(payload);
  } catch (error) {
    renderError(error.message, error.code || 'LOOKUP_FAILED');
  } finally {
    setLoading(false);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  runSearch(usernameInput.value, placeInput.value);
});

usernameInput.addEventListener('input', () => {
  clearButton.classList.toggle('visible', Boolean(usernameInput.value));
});

clearButton.addEventListener('click', () => {
  usernameInput.value = '';
  clearButton.classList.remove('visible');
  usernameInput.focus();
});

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 3, 2) * 55}ms`;
  observer.observe(element);
});
