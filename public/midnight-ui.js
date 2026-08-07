const siteHeader = document.querySelector('.site-header');

function syncHeader() {
  siteHeader?.classList.toggle('scrolled', window.scrollY > 24);
}

window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

function activateTool(name) {
  const tab = document.querySelector(`.tool-tab[data-tab="${name}"]`);
  if (!tab) return;
  tab.click();
  document.querySelector('#toolkit')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const tools = [
  ['players', 'Players'],
  ['servers', 'Servers'],
  ['compare', 'Compare'],
  ['network', 'Network'],
  ['library', 'Library'],
  ['friends', 'Firefox'],
];

let floating = document.querySelector('.floating-tool-nav');
if (!floating) {
  floating = document.createElement('div');
  floating.className = 'floating-tool-nav';
  floating.setAttribute('aria-label', 'Quick tool navigation');
  floating.innerHTML = tools
    .filter(([name]) => document.querySelector(`.tool-tab[data-tab="${name}"]`))
    .map(([name, label]) => `<button type="button" data-floating-tool="${name}">${label}</button>`)
    .join('');
  document.body.append(floating);
}

floating.querySelectorAll('[data-floating-tool]').forEach((button) => {
  button.addEventListener('click', () => activateTool(button.dataset.floatingTool));
});

function syncFloatingNav() {
  const active = document.querySelector('.tool-tab.active')?.dataset.tab || 'players';
  floating.querySelectorAll('[data-floating-tool]').forEach((button) => {
    button.classList.toggle('active', button.dataset.floatingTool === active);
  });
}

const tabObserver = new MutationObserver(syncFloatingNav);
document.querySelectorAll('.tool-tab').forEach((tab) => {
  tabObserver.observe(tab, { attributes: true, attributeFilter: ['class'] });
});
syncFloatingNav();

const revealNodes = document.querySelectorAll('.editorial-reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px' });

  revealNodes.forEach((node) => revealObserver.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add('visible'));
}
