import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

export default async function handler(_req, res) {
  const files = [
    ['website', new URL('../public/app.js', import.meta.url)],
    ['companion', new URL('../companion/popup.js', import.meta.url)],
  ];
  const results = {};
  for (const [name, url] of files) {
    try {
      const source = await readFile(url, 'utf8');
      new vm.Script(source, { filename: url.pathname });
      results[name] = { ok: true, bytes: source.length };
    } catch (error) {
      results[name] = { ok: false, message: error.message };
    }
  }
  res.status(200).json(results);
}
