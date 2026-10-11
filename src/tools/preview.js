#!/usr/bin/env node
/**
 * Local static preview of the built site.
 *
 *   npm run build && npm run preview          # http://localhost:4173
 *   npm run preview -- --port 5000
 *
 * This serves `dist/` exactly as a static host would, which is also what
 * makes it a check: a normal build publishes the hosted site and nothing
 * else, so `/offline.html` is a 404 here exactly as it is on the deployment.
 * It is a development convenience only — nothing in the essay needs a server.
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, normalize, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(repoRoot, 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function readPort() {
  const flag = process.argv.indexOf('--port');
  const value = flag >= 0 ? process.argv[flag + 1] : process.env.PORT;
  const port = Number.parseInt(value ?? '4173', 10);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return port;
}

/** Resolves a request path inside `dist/`, refusing anything that escapes it. */
async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const candidate = join(DIST, normalize(decoded).replace(/^(\.\.[/\\])+/, ''));
  if (candidate !== DIST && !candidate.startsWith(DIST + '/')) return null;

  try {
    const info = await stat(candidate);
    if (info.isDirectory()) return resolveFile(join(decoded, 'index.html'));
    return candidate;
  } catch {
    return null;
  }
}

export function createPreviewServer() {
  return createServer(async (request, response) => {
    const file = await resolveFile(request.url ?? '/');
    if (!file) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found\n');
      return;
    }
    response.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    createReadStream(file).pipe(response);
  });
}

async function main() {
  try {
    await stat(join(DIST, 'index.html'));
  } catch {
    console.error('dist/index.html does not exist yet. Run `npm run build` first.');
    process.exit(1);
  }

  const port = readPort();
  // Loopback only: this is a developer convenience, not something to expose on
  // the local network.
  createPreviewServer().listen(port, '127.0.0.1', () => {
    console.log(`Preview of dist/ at http://localhost:${port}`);
    console.log('This is the hosted site. The single-file export is retained tooling and is not '
      + 'published: `npm run export:offline` writes dist/offline.html when it is wanted, and the '
      + 'next `npm run build` clears it out again.');
  });
}

// Run only when invoked directly, so tests can import these functions.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
