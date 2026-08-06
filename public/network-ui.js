const networkStyle = document.createElement('style');
networkStyle.textContent = `
  .network-panel .panel-intro { margin-bottom: 28px; }
  .network-notice { max-width: 720px; margin: 0 0 22px; padding: 13px 15px; border-left: 2px solid var(--accent); color: var(--muted); background: #0d0d0d; font-size: 10px; line-height: 1.65; }
  .network-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: end; }
  .network-toolbar .input-shell { min-height: 50px; }
  .network-history { display: flex; gap: 8px; align-items: center; min-height: 38px; margin: 18px 0 0; overflow-x: auto; scrollbar-width: thin; }
  .network-history button { flex: 0 0 auto; min-height: 32px; padding: 0 10px; border: 1px solid var(--soft-line); color: var(--muted); background: transparent; font-family: var(--mono); font-size: 9px; cursor: pointer; }
  .network-history button:hover, .network-history button.current { border-color: var(--accent); color: var(--text); }
  .network-result { margin-top: 26px; }
  .network-summary { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; gap: 17px; align-items: center; padding: 18px; border: 1px solid var(--line); background: #0d0d0d; }
  .network-summary-avatar { position: relative; width: 72px; height: 72px; overflow: hidden; border: 1px solid var(--line); background: #171717; }
  .network-summary-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .network-summary-avatar span { position: absolute; inset: 0; z-index: -1; display: grid; place-items: center; color: var(--text); font-size: 20px; font-weight: 650; }
  .network-summary-copy { min-width: 0; }
  .network-summary-copy span { color: var(--accent); font-family: var(--mono); font-size: 9px; letter-spacing: .08em; }
  .network-summary-copy h4 { margin: 7px 0 4px; overflow: hidden; font-size: 25px; line-height: 1; letter-spacing: -.04em; text-overflow: ellipsis; white-space: nowrap; }
  .network-summary-copy a { color: var(--muted); font-family: var(--mono); font-size: 10px; }
  .network-summary-count { min-width: 110px; text-align: right; }
  .network-summary-count strong, .network-summary-count small { display: block; }
  .network-summary-count strong { font-size: 30px; letter-spacing: -.05em; }
  .network-summary-count small { margin-top: 5px; color: var(--dim); font-family: var(--mono); font-size: 8px; text-transform: uppercase; }
  .network-controls { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; margin-top: 14px; }
  .network-controls input { min-height: 42px; padding: 0 12px; border: 1px solid var(--soft-line); outline: 0; color: var(--text); background: #0b0b0b; font: inherit; font-size: 11px; }
  .network-controls input:focus { border-color: var(--accent); }
  .network-controls span { color: var(--dim); font-family: var(--mono); font-size: 9px; }
  .network-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; margin-top: 12px; }
  .network-card { min-width: 0; min-height: 74px; display: grid; grid-template-columns: 50px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 11px; border: 1px solid var(--soft-line); background: #0d0d0d; }
  .network-card:hover { border-color: #4b4944; background: #111; }
  .network-card-avatar { position: relative; width: 50px; height: 50px; overflow: hidden; border: 1px solid var(--line); background: #171717; }
  .network-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .network-card-avatar span { position: absolute; inset: 0; z-index: -1; display: grid; place-items: center; color: var(--text); font-size: 13px; font-weight: 650; }
  .network-card-copy { min-width: 0; }
  .network-card-copy strong, .network-card-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .network-card-copy strong { color: var(--text); font-size: 12px; font-weight: 550; }
  .network-card-copy small { margin-top: 5px; color: var(--muted); font-family: var(--mono); font-size: 8px; }
  .network-card-actions { display: grid; gap: 5px; }
  .network-card-actions button, .network-card-actions a { min-width: 58px; min-height: 28px; display: grid; place-items: center; padding: 0 8px; border: 1px solid var(--soft-line); color: var(--muted); background: transparent; font-size: 8px; cursor: pointer; }
  .network-card-actions button:hover { border-color: var(--accent); color: var(--text); }
  .network-empty { grid-column: 1 / -1; min-height: 120px; display: grid; place-items: center; border: 1px dashed var(--line); color: var(--muted); font-size: 11px; }
  .network-footnote { margin: 14px 0 0; color: var(--dim); font-size: 9px; line-height: 1.6; }
  @media (max-width: 680px) {
    .network-toolbar, .network-controls { grid-template-columns: 1fr; }
    .network-summary { grid-template-columns: 58px minmax(0, 1fr); }
    .network-summary-avatar { width: 58px; height: 58px; }
    .network-summary-count { grid-column: 1 / -1; display: flex; align-items: baseline; gap: 8px; text-align: left; }
    .network-grid { grid-template-columns: 1fr; }
  }
`;
document.head.append(networkStyle);

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
  let currentData = null;

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
    return `<div class="${className}"><img src="${escapeHTML(url)}" alt="" onerror="this.remove()" />${fallback}</div>`;
  }

  function renderHistory() {
    historyNode.innerHTML = browsingHistory.map((item, index) => `<button type="button" class="${index === browsingHistory.length - 1 ? 'current' : ''}" data-network-history="${index}">@${escapeHTML(item.username)}</button>`).join('');
    historyNode.querySelectorAll('[data-network-history]').forEach((button) => button.addEventListener('click', () => {
      const item = browsingHistory[Number(button.dataset.networkHistory)];
      if (item) browse(item.username, false);
    }));
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

    grid.querySelectorAll('[data-network-pivot]').forEach((button) => button.addEventListener('click', () => browse(button.dataset.networkPivot)));
  }

  function render(data) {
    currentData = data;
    const unavailable = data.unavailableCount > 0 ? ` ${data.unavailableCount} unavailable or non-resolvable record${data.unavailableCount === 1 ? '' : 's'} were omitted.` : '';
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
