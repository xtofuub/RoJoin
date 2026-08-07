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

  const markBroken = () => image.setAttribute('data-broken', 'true');
  image.addEventListener('error', markBroken, { once: true });
  if (image.complete && image.naturalWidth === 0) markBroken();

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
  const usernameLabel = rawUsername ? `@${rawUsername}` : 'Open profile';

  const avatar = makeAvatar(image, displayName, 'mutual-avatar');
  const copy = document.createElement('div');
  copy.className = 'mutual-card-copy';

  const strong = document.createElement('strong');
  strong.textContent = displayName;
  const small = document.createElement('small');
  small.textContent = usernameLabel;
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
