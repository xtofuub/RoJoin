import { readFile } from 'node:fs/promises';

const behaviorModules = [
  'public/compare-ui.js',
  'public/network-ui.js',
  'public/friends-ui.js',
  'public/midnight-ui.js',
];

for (const file of behaviorModules) {
  const source = await readFile(file, 'utf8');
  const createsStyleElement = /createElement\(\s*['"]style['"]\s*\)/i.test(source);
  const embedsStyleTag = /<style(?:\s|>)/i.test(source);

  if (createsStyleElement || embedsStyleTag) {
    throw new Error(`${file} injects visual styles. Keep feature modules behavior-only and place styles in public/styles.css.`);
  }
}

const stylesheet = await readFile('public/styles.css', 'utf8');
const requiredTokens = [
  '--bg: #050505',
  '--accent: #ff6b50',
  '.hero-title',
  '.tool-panel',
  '.compare-profile',
  '.network-card',
  '.companion-download-card',
];

for (const token of requiredTokens) {
  if (!stylesheet.includes(token)) {
    throw new Error(`The consolidated stylesheet is missing required design token or component: ${token}`);
  }
}

const page = await readFile('public/index.html', 'utf8');
for (const marker of ['class="hero-title"', 'class="editorial-benefits shell"', 'class="reference-footer"']) {
  if (!page.includes(marker)) {
    throw new Error(`The native editorial page structure is missing ${marker}.`);
  }
}

console.log('Editorial design architecture validated.');
