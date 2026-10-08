/**
 * Packaging checks. These run the real build command, so they also cover the
 * preview server against the files a static host would actually serve.
 *
 * Everything here lives in one file on purpose: it is the only suite that
 * writes to `dist/`, and test files otherwise run concurrently.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

import { buildOutputs, auditOutputs } from '../src/build/build.js';
import { auditOfflineHtml } from '../src/build/verify.js';
import { createPreviewServer } from '../src/tools/preview.js';
import { loadValidContent, repoRoot } from './helpers.js';

const DIST = join(repoRoot, 'dist');

const runBuild = (args = []) =>
  execFileSync(process.execPath, ['src/build/build.js', ...args], { cwd: repoRoot, encoding: 'utf8' });

function hashTree(directory) {
  const entries = {};
  const walk = (current) => {
    for (const name of readdirSync(current).sort()) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else entries[relative(directory, full)] = createHash('sha256').update(readFileSync(full)).digest('hex');
    }
  };
  walk(directory);
  return entries;
}

/** Visible text only: no markup, no embedded styles, scripts, or data URIs. */
function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test('the build produces outputs that pass every packaging check', async () => {
  const content = loadValidContent();
  const outputs = await buildOutputs(content);
  assert.doesNotThrow(() => auditOutputs(outputs, content));
  assert.deepEqual(auditOfflineHtml(outputs.offline), []);
});

test('the offline file embeds the font and the illustration rather than fetching them', async () => {
  const { offline } = await buildOutputs(loadValidContent());
  assert.match(offline, /@font-face[\s\S]{0,200}url\(data:font\/ttf;base64,/);
  assert.match(offline, /<img src="data:image\/png;base64,/);
  assert.ok(offline.length > 1_000_000, 'the embedded binaries should dominate the file size');
});

test('the hosted page and the offline file read identically', async () => {
  const { hosted, offline } = await buildOutputs(loadValidContent());
  assert.equal(visibleText(offline), visibleText(hosted));
});

test('an output that reaches outside itself fails the build instead of shipping', async () => {
  const content = loadValidContent();
  const outputs = await buildOutputs(content);
  const broken = { ...outputs, offline: outputs.offline.replace('</head>', '<link rel="stylesheet" href="https://example.org/x.css"></head>') };
  assert.throws(() => auditOutputs(broken, content), /depends on resources it does not carry/);
});

test('an output that drops essential content fails the build instead of shipping', async () => {
  const content = loadValidContent();
  const outputs = await buildOutputs(content);
  const narration = content.scenes[0].narration[0];
  const broken = { ...outputs, hosted: outputs.hosted.replace(narration, '') };
  assert.throws(() => auditOutputs(broken, content), /does not carry the complete content/);
});

test('building twice from the same commit produces byte-identical output', () => {
  runBuild();
  const first = hashTree(DIST);
  runBuild();
  const second = hashTree(DIST);
  assert.deepEqual(second, first);
  assert.ok(Object.keys(first).length >= 7, 'expected the hosted files, the assets, and the offline file');
});

test('the offline export writes only the single file and leaves the hosted output alone', () => {
  runBuild();
  const before = hashTree(DIST);
  const output = runBuild(['--only=offline']);
  const after = hashTree(DIST);

  assert.match(output, /Offline export only/);
  assert.deepEqual(after, before, 'an offline export changes nothing else in dist/');
  assert.ok(existsSync(join(DIST, 'index.html')), 'the hosted entry point survives an offline export');
});

test('the preview server serves the built site and refuses to escape it', async () => {
  runBuild();
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.equal(page.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.match(await page.text(), /<h1 id="landing-title">/);

    const styles = await fetch(`${base}/styles.css`);
    assert.equal(styles.status, 200);
    assert.equal(styles.headers.get('content-type'), 'text/css; charset=utf-8');

    const font = await fetch(`${base}/assets/fonts/DejaVuSans.ttf`);
    assert.equal(font.status, 200);
    assert.equal(font.headers.get('content-type'), 'font/ttf');

    assert.equal((await fetch(`${base}/offline.html`)).status, 200);
    assert.equal((await fetch(`${base}/nothing-here`)).status, 404);
    assert.equal((await fetch(`${base}/%2e%2e/%2e%2e/package.json`)).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
