/**
 * The content document and the editorial source register have to agree. The
 * register is where the audit was actually carried out; if a source's evidence
 * level or destination drifts apart from it, one of the two is lying to the
 * reader.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SOURCE_REVIEW_STATUSES } from '../src/content/schema.js';
import { loadValidContent, repoRoot } from './helpers.js';

/** Parses the register's source table into `{ id: { url, reviewStatus } }`. */
function readRegister() {
  const markdown = readFileSync(join(repoRoot, 'docs/research.md'), 'utf8');
  const rows = markdown.matchAll(/^\|\s*(R\d+)\s*\|\s*\[[^\]]*\]\(([^)\s]+)\)\s*\|[^|]*\|\s*`([a-z-]+)`/gm);
  const register = {};
  for (const [, id, url, reviewStatus] of rows) register[id] = { url, reviewStatus };
  return register;
}

test('the register still parses and uses only recognised evidence levels', () => {
  const register = readRegister();
  const ids = Object.keys(register);
  assert.ok(ids.length >= 30, `expected the full source pool, found ${ids.length}`);
  for (const [id, entry] of Object.entries(register)) {
    assert.ok(SOURCE_REVIEW_STATUSES.includes(entry.reviewStatus), `${id} has status ${entry.reviewStatus}, which the contract does not define`);
  }
});

test('every source in the content document matches its register entry', () => {
  const register = readRegister();
  const doc = loadValidContent();

  for (const source of doc.sources) {
    const entry = register[source.id];
    assert.ok(entry, `${source.id} is not in docs/research.md`);
    assert.equal(source.reviewStatus, entry.reviewStatus, `${source.id}: the content document and the register disagree about how far it was checked`);
    assert.equal(source.url, entry.url, `${source.id}: the content document and the register point at different destinations`);
  }
});
