const style = document.createElement('style');
style.textContent = `
  .compare-result {
    --compare-card: #0d0d0d;
  }

  .relationship-banner {
    min-height: 52px;
    padding: 0 0 18px;
    border: 0;
    border-bottom: 1px solid var(--line);
  }

  .relationship-banner span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    letter-spacing: .08em;
  }

  .relationship-banner span::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }

  .relationship-banner strong {
    color: var(--muted);
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 400;
    letter-spacing: .03em;
  }

  .compare-profiles {
    position: relative;
    gap: 1px;
    margin: 18px 0 38px;
    padding: 1px;
    border: 0;
    background: var(--line);
  }

  .compare-profiles::after {
    content: "VS";
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 3;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    transform: translate(-50%, -50%);
    border: 1px solid var(--line);
    border-radius: 50%;
    color: var(--accent);
    background: var(--bg);
    font-family: var(--mono);
    font-size: 9px;
  }

  .compare-profile.compare-profile-enhanced {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    grid-template-rows: auto auto auto;
    column-gap: 18px;
    justify-items: stretch;
    padding: 24px;
    border: 0;
    background: var(--compare-card);
    text-align: left;
  }

  .compare-profile-label {
    position: static !important;
    grid-column: 1 / -1;
    margin-bottom: 18px;
    color: var(--dim) !important;
    font-family: var(--mono);
    font-size: 9px !important;
    letter-spacing: .09em;
  }

  .compare-avatar {
    grid-column: 1;
    grid-row: 2;
    position: relative;
    width: 72px;
    height: 72px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: #171717;
  }

  .compare-avatar img {
    width: 100% !important;
    height: 100% !important;
    border: 0 !important;
    object-fit: cover;
  }

  .compare-avatar-fallback,
  .mutual-avatar-fallback {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--text);
    background: #181818;
    font-size: 18px;
    font-weight: 650;
    letter-spacing: -.04em;
  }

  .compare-avatar img:not([data-broken]) + .compare-avatar-fallback,
  .mutual-avatar img:not([data-broken]) + .mutual-avatar-fallback {
    display: none;
  }

  .compare-profile-copy {
    grid-column: 2;
    grid-row: 2;
    min-width: 0;
    align-self: center;
  }

  .compare-profile-copy h4 {
    margin: 0 0 5px;
    overflow: hidden;
    font-size: 22px;
    line-height: 1.05;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .compare-profile-copy a {
    color: var(--accent);
    font-family: var(--mono);
    font-size: 10px;
  }

  .compare-profile dl {
    grid-column: 1 / -1;
    grid-row: 3;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    width: 100%;
    margin: 22px 0 0;
    border: 1px solid var(--soft-line);
  }

  .compare-profile dl div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
    padding: 12px;
    border: 0;
    border-right: 1px solid var(--soft-line);
  }

  .compare-profile dl div:last-child {
    border-right: 0;
  }

  .compare-profile dt {
    color: var(--dim);
    font-family: var(--mono);
    font-size: 8px;
    text-transform: uppercase;
  }

  .compare-profile dd {
    max-width: 100%;
    overflow: hidden;
    color: var(--text);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mutual-section .subhead {
    min-height: 48px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .mutual-section .subhead h4 {
    font-size: 13px;
    letter-spacing: -.01em;
  }

  .mutual-section .subhead span {
    min-width: 28px;
    height: 24px;
    display: inline-grid;
    place-items: center;
    padding: 0 8px;
    border: 1px solid var(--line);
    color: var(--accent);
    background: #0a0a0a;
  }

  .mutual-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px;
    padding-top: 14px;
  }

  .mutual-grid .mutual-card {
    min-width: 0;
    min-height: 68px;
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr) 18px;
    grid-template-rows: auto;
    column-gap: 12px;
    align-items: center;
    padding: 10px;
    border: 1px solid var(--soft-line);
    background: var(--compare-card);
    transition: border-color .16s ease, background .16s ease, transform .16s ease;
  }

  .mutual-grid .mutual-card:hover {
    border-color: #4b4944;
    background: #121212;
    transform: translateY(-1px);
  }

  .mutual-avatar {
    position: relative;
    width: 46px;
    height: 46px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: #171717;
  }

  .mutual-avatar img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
  }

  .mutual-avatar-fallback {
    font-size: 13px;
  }

  .mutual-card-copy {
    min-width: 0;
  }

  .mutual-card-copy strong,
  .mutual-card-copy small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mutual-card-copy strong {
    color: var(--text);
    font-size: 12px;
    font-weight: 550;
  }

  .mutual-card-copy small {
    margin-top: 4px;
    color: var(--muted);
    font-family: var(--mono);
    font-size: 9px;
  }

  .mutual-card-arrow {
    color: var(--dim);
    font-size: 15px;
    transition: color .16s ease, transform .16s ease;
  }

  .mutual-card:hover .mutual-card-arrow {
    color: var(--accent);
    transform: translateX(2px);
  }

  .mutual-empty {
    grid-column: 1 / -1;
    min-height: 104px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--line);
    color: var(--muted);
    font-size: 11px;
  }

  @media (max-width: 760px) {
    .compare-profiles {
      grid-template-columns: 1fr;
    }

    .compare-profiles::after {
      top: 50%;
    }

    .compare-profile.compare-profile-enhanced {
      padding: 20px;
    }

    .mutual-grid {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.append(style);

function initials(value) {
  const words = String(value || 'R').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'R';
}

function makeAvatar(image, name, className) {
  const shell = document.createElement('div');
  shell.className = className;
  const fallback = document.createElement('span');
  fallback.className = `${className}-fallback`;
  fallback.textContent = initials(name);
  image.addEventListener('error', () => image.setAttribute('data-broken', 'true'), { once: true });
  if (image.complete && image.naturalWidth === 0) image.setAttribute('data-broken', 'true');
  shell.append(image, fallback);
  return shell;
}

function enhanceProfile(card, index) {
  if (card.dataset.enhanced === 'true') return;
  const label = card.querySelector(':scope > span');
  const image = card.querySelector(':scope > img');
  const heading = card.querySelector(':scope > h4');
  const link = card.querySelector(':scope > a');
  const stats = card.querySelector(':scope > dl');
  if (!label || !image || !heading || !link || !stats) return;

  label.className = 'compare-profile-label';
  label.textContent = `PLAYER ${index + 1}`;

  const copy = document.createElement('div');
  copy.className = 'compare-profile-copy';
  copy.append(heading, link);

  const avatar = makeAvatar(image, heading.textContent, 'compare-avatar');
  card.replaceChildren(label, avatar, copy, stats);
  card.classList.add('compare-profile-enhanced');
  card.dataset.enhanced = 'true';
}

function enhanceMutual(card, index) {
  if (card.dataset.enhanced === 'true') return;
  const image = card.querySelector('img');
  const display = card.querySelector('span');
  const username = card.querySelector('small');
  if (!image || !display || !username) return;

  const rawUsername = username.textContent.replace(/^@/, '').trim();
  const displayName = display.textContent.trim() || rawUsername || `Roblox user ${index + 1}`;
  const safeUsername = rawUsername || 'Open profile';

  const avatar = makeAvatar(image, displayName, 'mutual-avatar');
  const copy = document.createElement('div');
  copy.className = 'mutual-card-copy';
  const strong = document.createElement('strong');
  strong.textContent = displayName;
  const small = document.createElement('small');
  small.textContent = rawUsername ? `@${safeUsername}` : safeUsername;
  copy.append(strong, small);

  const arrow = document.createElement('span');
  arrow.className = 'mutual-card-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';

  card.replaceChildren(avatar, copy, arrow);
  card.classList.add('mutual-card');
  card.setAttribute('aria-label', `Open ${displayName}'s Roblox profile`);
  card.dataset.enhanced = 'true';
}

function enhanceComparison(root) {
  const result = root.querySelector('.compare-result');
  if (!result || result.dataset.enhanced === 'true') return;

  [...result.querySelectorAll('.compare-profile')].forEach(enhanceProfile);

  const mutualGrid = result.querySelector('.mutual-grid');
  const cards = mutualGrid ? [...mutualGrid.querySelectorAll(':scope > a')] : [];
  cards.forEach(enhanceMutual);

  const count = cards.length;
  const countBadge = result.querySelector('.mutual-section .subhead span');
  if (countBadge) countBadge.textContent = String(count);

  const relationshipSummary = result.querySelector('.relationship-banner strong');
  if (relationshipSummary) {
    relationshipSummary.textContent = `${count} mutual public friend${count === 1 ? '' : 's'}`;
  }

  if (mutualGrid && count === 0) {
    mutualGrid.innerHTML = '<div class="mutual-empty">No mutual public friends were returned.</div>';
  }

  result.dataset.enhanced = 'true';
}

const compareState = document.querySelector('#compare-state');
if (compareState) {
  const observer = new MutationObserver(() => enhanceComparison(compareState));
  observer.observe(compareState, { childList: true, subtree: true });
  enhanceComparison(compareState);
}
