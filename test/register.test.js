/**
 * The published Sources & Credits page against the editorial source register.
 *
 * `docs/research.md` is where the audit was actually carried out: which of the
 * project's R identifiers was opened, how far, and at which address. The
 * reader's page is a selection from it. If an entry's destination or audit
 * level drifts apart from the register, one of the two is lying to the reader,
 * and the one the reader sees is the one that does the damage.
 *
 * The approved script carries 26 numbered references. The register holds 32.
 * The six that stay behind are the five nobody could open and R18, which the
 * rewritten argument no longer cites. A work nobody opened never becomes a
 * reader-facing authority, so the gap is checked here rather than assumed.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SOURCE_AUDIT_LEVELS, SOURCE_AUDIT_STATUSES, SOURCE_COUNT } from '../src/content/schema.js';
import { loadValidContent, repoRoot } from './helpers.js';

/**
 * Parses the register's table into `{ R01: { url, auditStatus, qualifier } }`.
 *
 * A status cell may carry a parenthetical such as `(alternate host)` or
 * `(Chapter 3)`. That qualifier is part of the audit record and is kept, but
 * the level itself is the bare code before it.
 */
function readRegister() {
  const markdown = readFileSync(join(repoRoot, 'docs/research.md'), 'utf8');
  const rows = markdown.matchAll(/^\|\s*(R\d+)\s*\|\s*\[[^\]]*\]\(([^)\s]+)\)\s*\|[^|]*\|\s*`([a-z-]+)`([^|]*)\|/gm);
  const register = {};
  for (const [, id, url, auditStatus, qualifier] of rows) {
    register[id] = { url, auditStatus, qualifier: qualifier.trim() };
  }
  return register;
}

const register = readRegister();
const content = loadValidContent();

/** Everything in the register that was never opened. */
const neverOpened = Object.entries(register)
  .filter(([, entry]) => entry.auditStatus === 'not-accessed')
  .map(([id]) => id);

test('the register still parses, and every level in it is one the audit defines', () => {
  const ids = Object.keys(register);
  assert.equal(ids.length, 35, `expected the full source pool, found ${ids.length}`);
  for (const [id, entry] of Object.entries(register)) {
    // `not-accessed` is a level of the register, not of the reader's page:
    // the content contract has no name for it because nothing it describes
    // may be published as a source.
    assert.ok(
      SOURCE_AUDIT_LEVELS.includes(entry.auditStatus) || entry.auditStatus === 'not-accessed',
      `${id} is recorded as ${entry.auditStatus}, which the audit does not define`,
    );
  }
});

test('every entry a reader is shown matches its register record exactly', () => {
  const sources = content.sourcesPage.sources;
  assert.equal(sources.length, SOURCE_COUNT);

  for (const source of sources) {
    const entry = register[source.sourceId];
    assert.ok(entry, `${source.sourceId} is cited as source ${source.number} but is not in docs/research.md`);
    assert.equal(
      source.auditStatus, entry.auditStatus,
      `${source.sourceId}: the page and the register disagree about how far it was checked`,
    );
    assert.equal(
      source.url, entry.url,
      `${source.sourceId}: the page and the register point at different destinations`,
    );
  }
});

test('a work nobody could open never becomes a reader-facing source', () => {
  assert.deepEqual(neverOpened, ['R11', 'R14', 'R21', 'R22', 'R30']);
  const published = new Set(content.sourcesPage.sources.map((source) => source.sourceId));
  for (const id of neverOpened) {
    assert.equal(published.has(id), false, `${id} was never opened and may not be cited`);
  }
});

test('the six register entries the rewrite leaves behind are accounted for', () => {
  const published = new Set(content.sourcesPage.sources.map((source) => source.sourceId));
  const held = Object.keys(register).filter((id) => !published.has(id));
  assert.deepEqual(
    held, ['R11', 'R14', 'R18', 'R21', 'R22', 'R30'],
    'the register keeps its full audit; only these stay off the reader\'s page',
  );
  // R18 was opened, so its absence is editorial rather than evidential: the
  // approved 45-scene argument no longer makes the claim it supported. It
  // stays audited in the register, which is where that history belongs.
  assert.equal(register.R18.auditStatus, 'verified-abstract');
});

test('each published level carries the access label the reader actually sees', () => {
  for (const source of content.sourcesPage.sources) {
    const level = SOURCE_AUDIT_STATUSES[source.auditStatus];
    assert.ok(level, `${source.sourceId} has a level the contract does not define`);
    assert.match(level.label, /\S/);
    // The owner's reader amendment reduced each entry to its formatted
    // citation; the audit level is still recorded against it.
    assert.deepEqual(source.note, [], `${source.sourceId} still shows an access note`);
  }
});

test('every published source has an evidence record, not just a table row', () => {
  const research = readFileSync(join(repoRoot, 'docs/research.md'), 'utf8');
  for (const source of content.sourcesPage.sources) {
    assert.ok(
      research.includes(`### ${source.sourceId} —`),
      `${source.sourceId} has no evidence record in docs/research.md`,
    );
  }
});

test('the published audit rollup is the one the register supports', () => {
  const tally = content.sourcesPage.sources.reduce((counts, source) => {
    counts[source.auditStatus] = (counts[source.auditStatus] ?? 0) + 1;
    return counts;
  }, {});
  assert.deepEqual(
    tally,
    { 'verified-full': 13, 'verified-abstract': 10, 'verified-locator': 3, 'verified-excerpt': 3 },
    'the published levels no longer match the audit in docs/research.md',
  );
  assert.equal(Object.values(tally).reduce((a, b) => a + b, 0), SOURCE_COUNT);
});
