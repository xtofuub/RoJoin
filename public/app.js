const form = document.querySelector('#search-form');
const usernameInput = document.querySelector('#username');
const searchButton = document.querySelector('.search-button');
const clearButton = document.querySelector('.clear-input');
const state = document.querySelector('#search-state');
const template = document.querySelector('#result-template');
const cursorGlow = document.querySelector('.cursor-glow');

const escapeText = (value) => String(value ?? '');
const compactNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function setLoading(loading) {
  searchButton.disabled = loading;
  usernameInput.disabled = loading;
  searchButton.classList.toggle('loading', loading);
  searchButton.querySelector('.button-label').textContent = loading ? 'Scanning' : 'Find player';
}

function renderLoading(username) {
  state.innerHTML = `
    <div class="loading-state">
      <div>
        <div class="radar" aria-hidden="true"><span></span><span></span><span></span><i></i></div>
        <strong>Looking up @${escapeText(username)}…</strong>
        <p>Resolving identity, public presence, and game details.</p>
      </div>
    </div>`;
}

function renderError(message, code = 'SEARCH_FAILED') {
  state.innerHTML = `
    <div class="search-error">
      <span>${escapeText(code).replaceAll('_', ' ')}</span>
      <h3>Search stopped.</h3>
      <p>${escapeText(message)}</p>
    </div>`;
}

function locationLabel(data) {
  if (data.game?.name) return data.game.name;
  if (data.presence?.lastLocation) return data.presence.lastLocation;
  return data.presence?.label || 'Unknown';
}

function statusLabel(data) {
  if (data.status === 'JOINABLE') return 'EXACT SERVER FOUND';
  if (data.status === 'IN_GAME_HIDDEN') return 'IN GAME / SERVER HIDDEN';
  if (data.status === 'OFFLINE') return 'CURRENTLY OFFLINE';
  return data.presence?.label?.toUpperCase() || 'PUBLIC STATUS';
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

  avatar.src = data.user.avatarUrl || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#171717"/><text x="50" y="60" text-anchor="middle" fill="#666" font-family="Arial" font-size="42">R</text></svg>`)}`;
  avatar.alt = `${data.user.displayName}'s Roblox avatar`;
  dot.classList.toggle('joinable', data.status === 'JOINABLE');
  dot.classList.toggle('ingame', data.presence.type === 2 && data.status !== 'JOINABLE');
  status.textContent = statusLabel(data);
  status.style.color = data.status === 'JOINABLE' ? 'var(--green)' : data.status === 'OFFLINE' ? '#737373' : 'var(--coral)';
  display.textContent = data.user.displayName;
  username.textContent = `@${data.user.username}`;
  username.href = data.user.profileUrl;
  location.textContent = locationLabel(data);
  if (data.game?.playing != null) location.title = `${compactNumber.format(data.game.playing)} players active`;
  place.textContent = data.presence.placeId || data.presence.rootPlaceId || 'Hidden';
  server.textContent = data.presence.gameId ? `${data.presence.gameId.slice(0, 8)}…` : 'Hidden';
  server.title = data.presence.gameId || 'Roblox did not expose the server ID';
  message.textContent = data.privacy.message;
  profile.href = data.user.profileUrl;

  const placeId = data.presence.placeId || data.presence.rootPlaceId;
  if (placeId) {
    game.href = `https://www.roblox.com/games/${encodeURIComponent(placeId)}`;
  } else {
    game.remove();
  }

  if (data.joins?.exact?.app) {
    exactJoin.href = data.joins.exact.app;
  } else {
    exactJoin.classList.add('disabled');
    exactJoin.querySelector('span').textContent = data.presence.type === 2 ? 'Exact server hidden' : 'Player not joinable';
    exactJoin.removeAttribute('href');
  }

  state.replaceChildren(card);
}

async function runSearch(rawUsername) {
  const username = rawUsername.trim();
  if (!username) {
    renderError('Enter a Roblox username first.', 'INVALID_USERNAME');
    usernameInput.focus();
    return;
  }

  setLoading(true);
  renderLoading(username);

  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || 'The search failed.');
    renderResult(payload);
  } catch (error) {
    renderError(error.message, 'LOOKUP_FAILED');
  } finally {
    setLoading(false);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  runSearch(usernameInput.value);
});

usernameInput.addEventListener('input', () => {
  clearButton.classList.toggle('visible', Boolean(usernameInput.value));
});

clearButton.addEventListener('click', () => {
  usernameInput.value = '';
  clearButton.classList.remove('visible');
  usernameInput.focus();
});

document.addEventListener('pointermove', (event) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
  observer.observe(element);
});
