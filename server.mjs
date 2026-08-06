import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import searchHandler from './api/search.js';
import gameHandler from './api/game.js';
import compareHandler from './api/compare.js';

const root = fileURLToPath(new URL('./public', import.meta.url));
const port = Number(process.env.PORT || 3000);
const apiRoutes = new Map([
  ['/api/search', searchHandler],
  ['/api/game', gameHandler],
  ['/api/compare', compareHandler],
]);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

function decorateResponse(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
  };
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 20_000) throw new Error('Body too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const server = http.createServer(async (req, res) => {
  try {
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');

    const url = new URL(req.url, `http://${req.headers.host}`);
    const apiHandler = apiRoutes.get(url.pathname);
    if (apiHandler) {
      decorateResponse(res);
      req.body = req.method === 'POST' ? await readBody(req) : '';
      return apiHandler(req, res);
    }

    const shareRoute = /^\/(player|game|server)\//.test(url.pathname);
    const requestPath = shareRoute || url.pathname === '/' ? '/index.html' : url.pathname;
    const safePath = normalize(requestPath).replace(/^([.][.][/\\])+/, '');
    const filePath = join(root, safePath);

    if (!filePath.startsWith(root)) {
      res.statusCode = 403;
      return res.end('Forbidden');
    }

    let fileStat;
    try {
      fileStat = await stat(filePath);
    } catch {
      res.statusCode = 404;
      return res.end('Not found');
    }

    if (!fileStat.isFile()) {
      res.statusCode = 404;
      return res.end('Not found');
    }

    res.statusCode = 200;
    res.setHeader('content-type', types[extname(filePath)] || 'application/octet-stream');
    res.end(await readFile(filePath));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end('Internal server error');
  }
});

server.listen(port, () => {
  console.log(`RoJoiner running at http://localhost:${port}`);
});
