const tabs = document.querySelector('.tool-tabs');
const workspace = document.querySelector('.workspace');
const libraryTab = tabs?.querySelector('[data-tab="library"]');
const libraryPanel = workspace?.querySelector('[data-panel="library"]');

if (tabs && workspace && !tabs.querySelector('[data-tab="network"]')) {
  const tab = document.createElement('button');
  tab.className = 'tool-tab';
  tab.dataset.tab = 'network';
  tab.type = 'button';
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-selected', 'false');
  tab.textContent = 'Network';
  tabs.insertBefore(tab, libraryTab || null);

  const panel = document.createElement('section');
  panel.className = 'tool-panel network-panel';
  panel.dataset.panel = 'network';
  panel.setAttribute('role', 'tabpanel');
  panel.hidden = true;
  panel.innerHTML = `
    <div class="panel-intro">
      <div><span class="panel-code">PUBLIC / NETWORK</span><h3>Browse public friend connections.</h3></div>
      <p>Open one public friend list at a time, filter the results, and pivot manually into another account. RoJoiner does not monitor people or crawl hidden relationships.</p>
    </div>
    <div class="network-notice">This explorer uses only public Roblox friend-list responses. It does not show hidden presence, private servers, deleted profiles, or relationships Roblox does not return.</div>
    <form id="network-form" class="tool-form network-toolbar">
      <div class="field-block"><label for="network-username">Roblox username</label><div class="input-shell"><span>@</span><input id="network-username" maxlength="20" autocomplete="off" placeholder="builderman" required /></div></div>
      <button class="submit-button" type="submit"><span>Browse network</span><b>→</b></button>
    </form>
    <div id="network-history" class="network-history" aria-label="Recently browsed networks"></div>
    <div id="network-state" class="tool-state" aria-live="polite"><div class="empty-state"><span>00</span><div><strong>No network selected.</strong><p>Enter a username to browse the account's public friends.</p></div></div></div>`;
  workspace.insertBefore(panel, libraryPanel || null);

  function activateNetwork() {
    document.querySelectorAll('.tool-tab').forEach((button) => {
      const active = button.dataset.tab === 'network';
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });

    document.querySelectorAll('.tool-panel').forEach((node) => {
      const active = node.dataset.panel === 'network';
      node.classList.toggle('active', active);
      node.hidden = !active;
    });
  }

  tab.addEventListener('click', activateNetwork);

  const state = panel.querySelector('#network-state');
  const form = panel.querySelector('#network-form');
  const input = panel.querySelector('#network-username');
  const historyNode = panel.querySelector('#network-history');
  const browsingHistory = [];

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function initials(value) {
    return String(value || 'R').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'R';
  }

  function avatar(url, name, className) {
    const fallback = `<span>${escapeHTML(initials(name))}</span>`;
    if (!url) return `<div class="${className}">${fallback}</div>`;
    return `<div class="${className}"><img data-network-avatar src="${escapeHTML(url)}" alt="" />${fallback}</div>`;
  }

  function bindAvatarFallbacks(scope) {
    scope.querySelectorAll('[data-network-avatar]').forEach((image) => {
      image.addEventListener('error', () => image.remove(), { once: true });
    });
  }

  function renderHistory() {
    historyNode.innerHTML = browsingHistory.map((item, index) => `
      <button type="button" class="${index === browsingHistory.length - 1 ? 'current' : ''}" data-network-history="${index}">@${escapeHTML(item.username)}</button>`).join('');

    historyNode.querySelectorAll('[data-network-history]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = browsingHistory[Number(button.dataset.networkHistory)];
        if (item) browse(item.username, false);
      });
    });
  }

  function setBusy(busy) {
    const button = form.querySelector('button[type="submit"]');
    const label = button.querySelector('span');
    if (!button.dataset.label) button.dataset.label = label.textContent;
    button.disabled = busy;
    label.textContent = busy ? 'Loading…' : button.dataset.label;
  }

  function renderCards(friends) {
    const grid = state.querySelector('#network-grid');
    if (!grid) return;

    grid.innerHTML = friends.length ? friends.map((friend) => `
      <article class="network-card" data-network-card data-search="${escapeHTML(`${friend.displayName} ${friend.username}`.toLowerCase())}">
        ${avatar(friend.avatarUrl, friend.displayName, 'network-card-avatar')}
        <div class="network-card-copy"><strong>${escapeHTML(friend.displayName)}</strong><small>@${escapeHTML(friend.username)}</small></div>
        <div class="network-card-actions"><button type="button" data-network-pivot="${escapeHTML(friend.username)}">Browse</button><a href="${escapeHTML(friend.profileUrl)}" target="_blank" rel="noreferrer">Profile</a></div>
      </article>`).join('') : '<div class="network-empty">No public friend profiles were returned.</div>';

    bindAvatarFallbacks(grid);
    grid.querySelectorAll('[data-network-pivot]').forEach((button) => {
      button.addEventListener('click', () => browse(button.dataset.networkPivot));
    });
  }

  function render(data) {
    const unavailable = data.unavailableCount > 0
      ? ` ${data.unavailableCount} unavailable or non-resolvable record${data.unavailableCount === 1 ? '' : 's'} were omitted.`
      : '';
    const limited = data.limited ? ` Results are limited to ${data.limit}.` : '';

    state.innerHTML = `<article class="network-result">
      <div class="network-summary">
        ${avatar(data.root.avatarUrl, data.root.displayName, 'network-summary-avatar')}
        <div class="network-summary-copy"><span>PUBLIC FRIEND NETWORK</span><h4>${escapeHTML(data.root.displayName)}</h4><a href="${escapeHTML(data.root.profileUrl)}" target="_blank" rel="noreferrer">@${escapeHTML(data.root.username)} ↗</a></div>
        <div class="network-summary-count"><strong>${Number(data.root.friendCount || 0).toLocaleString()}</strong><small>reported friends</small></div>
      </div>
      <div class="network-controls"><input id="network-filter" type="search" placeholder="Filter ${data.shownCount} visible profiles…" autocomplete="off" /><span id="network-visible-count">${data.shownCount} shown</span></div>
      <div id="network-grid" class="network-grid"></div>
      <p class="network-footnote">${escapeHTML(data.privacy.message + unavailable + limited)}</p>
    </article>`;

    bindAvatarFallbacks(state);
    renderCards(data.friends);

    const filter = state.querySelector('#network-filter');
    const count = state.querySelector('#network-visible-count');
    filter?.addEventListener('input', () => {
      const query = filter.value.trim().toLowerCase();
      let visible = 0;

      state.querySelectorAll('[data-network-card]').forEach((card) => {
        const match = !query || card.dataset.search.includes(query);
        card.hidden = !match;
        if (match) visible += 1;
      });

      count.textContent = `${visible} shown`;
    });
  }

  async function browse(username, addHistory = true) {
    const value = String(username || '').trim();
    if (!value) return;

    activateNetwork();
    input.value = value;
    setBusy(true);
    state.innerHTML = `<div class="loading-block"><span class="loading-line"></span><div><strong>Loading @${escapeHTML(value)}</strong><p>Fetching the public friend list and profile cards.</p></div></div>`;

    try {
      const response = await fetch('/api/network', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: value }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message || 'The public friend network could not be loaded.');

      if (addHistory && browsingHistory.at(-1)?.id !== payload.root.id) {
        browsingHistory.push({ id: payload.root.id, username: payload.root.username });
        if (browsingHistory.length > 10) browsingHistory.shift();
      }

      renderHistory();
      render(payload);
    } catch (error) {
      state.innerHTML = `<div class="error-block"><span>NETWORK_ERROR</span><div><strong>Could not load this network.</strong><p>${escapeHTML(error.message)}</p></div></div>`;
    } finally {
      setBusy(false);
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    browse(input.value);
  });
}
