/**
 * What the document's order means, now that it is a transfer.
 *
 * The earlier build was an editable manuscript, and this file proved that
 * beats could be moved around freely because everything linked by identifier
 * rather than by array position. The approved script changed that premise: the
 * scene order *is* the argument, and moving a scene is a change to the essay
 * rather than a presentational edit. `test/validate.test.js` proves each of
 * those moves is now reported.
 *
 * What survives from the old premise is the part that is still true. Links
 * are still by identifier, registers with no authored order may still be
 * stored in any order, and the reader's source numbers are still derived from
 * where a claim first appears rather than stored as a hand-maintained list.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { validateContent } from '../src/content/validate.js';
import { loadValidContent, byId, codes } from './helpers.js';

const readingOrder = (doc) => doc.chapters.flatMap((chapter) => chapter.sceneIds);

test('register numbers are the ones the register already had', () => {
  const doc = loadValidContent();
  const sceneById = new Map(doc.scenes.map((scene) => [scene.id, scene]));

  const firstSeen = [];
  for (const id of readingOrder(doc)) {
    for (const block of sceneById.get(id).blocks) {
      for (const part of block.parts) {
        if (part.citation && !firstSeen.includes(part.citation)) firstSeen.push(part.citation);
      }
    }
  }

  // The superseded script numbered by first appearance. The approved essay
  // does not renumber: its `source_numbering` rule is to retain the existing
  // 1-26 numbers and R identities, so a link anybody has to `[9]` still means
  // the work it always meant. The new reading order therefore introduces them
  // slightly out of sequence -- [7] arrives before [4] -- and that is the
  // approved decision rather than a number assigned by hand.
  assert.deepEqual([...firstSeen].sort((a, b) => a - b),
    Array.from({ length: 29 }, (unused, index) => index + 1),
    'every register entry is cited exactly once somewhere');
  assert.notDeepEqual(firstSeen, [...firstSeen].sort((a, b) => a - b),
    'if first appearance has become ascending again, the retention rule has been lost');

  // The register itself is still stored and shown in number order.
  assert.deepEqual(doc.sourcesPage.sources.map((source) => source.number),
    Array.from({ length: 29 }, (unused, index) => index + 1));
});

test('a drawing is found by its brief reference, not by where it is stored', () => {
  const doc = loadValidContent();
  // `assets` has no authored order: it is a registry of what was delivered.
  doc.assets.reverse();
  assert.deepEqual(validateContent(doc).errors, []);

  const scene = doc.scenes.find((entry) => entry.visual.views.length > 0);
  const asset = doc.assets.find((entry) => entry.ref === scene.visual.views[0].ref);
  assert.equal(asset.ref, scene.visual.views[0].ref);
  assert.ok(asset.images[scene.visual.views[0].image], 'the drawing it names is one the asset carries');
});

test('the authored part order is the contract, and changing it is reported', () => {
  // Moving a part into the next chapter without telling the part about it.
  // The chapter a passage reads under is part of the argument, so a part that
  // disagrees with the chapter listing it is reported rather than published.
  const moved = loadValidContent();
  const from = byId(moved.chapters, 'c5');
  const to = byId(moved.chapters, 'c6');
  const last = from.sceneIds.at(-1);
  from.sceneIds = from.sceneIds.filter((id) => id !== last);
  to.sceneIds.unshift(last);

  const reported = codes(validateContent(moved).errors);
  assert.ok(reported.includes('CHAPTER_MISMATCH'),
    `moving a part between chapters should be reported, got ${reported.join(', ')}`);
  assert.deepEqual(readingOrder(moved), loadValidContent().scenes.map((scene) => scene.id),
    'the sentences still read in the same order, which is why this needs its own check');

  const stored = loadValidContent();
  stored.scenes.reverse();
  assert.ok(codes(validateContent(stored).errors).includes('READING_ORDER'));
});

test('the reading order is the stored scene order, with every scene reached once', () => {
  const doc = loadValidContent();
  assert.deepEqual(readingOrder(doc), doc.scenes.map((scene) => scene.id));
  assert.equal(new Set(readingOrder(doc)).size, 31);
});
