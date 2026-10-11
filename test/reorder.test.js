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

test('register numbers follow first appearance in the reading order', () => {
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

  // The approved script says numbering follows first appearance. Reading the
  // essay through and writing down each new number as it arrives must produce
  // 1 to 26 in order; anything else means a number was assigned by hand.
  assert.deepEqual(firstSeen, doc.sourcesPage.sources.map((source) => source.number));
  assert.deepEqual(firstSeen, Array.from({ length: 26 }, (unused, index) => index + 1));
});

test('a drawing is found by its brief reference, not by where it is stored', () => {
  const doc = loadValidContent();
  // `assets` has no authored order: it is a registry of what was delivered.
  doc.assets.reverse();
  assert.deepEqual(validateContent(doc).errors, []);

  const scene = byId(doc.scenes, 's088');
  const asset = doc.assets.find((entry) => entry.ref === scene.visual.views[0].ref);
  assert.equal(asset.ref, 'A01');
});

test('the authored scene order is now the contract, and changing it is reported', () => {
  const moved = loadValidContent();
  const from = byId(moved.chapters, 'c5');
  const to = byId(moved.chapters, 'c6');
  from.sceneIds = from.sceneIds.filter((id) => id !== 's113');
  to.sceneIds.unshift('s113');
  byId(moved.scenes, 's113').chapterId = 'c6';

  // Every identifier agrees and the sentences still read in the same order,
  // because s113 was last in its chapter and is now first in the next one.
  // It is still a different essay: chapter 6 is anchored at s114 in the
  // approved script, and the chapter a scene reads under is part of the
  // argument. That is what the anchor check is for.
  const reported = codes(validateContent(moved).errors);
  assert.ok(reported.includes('ANCHOR_MISMATCH'));
  assert.deepEqual(readingOrder(moved), loadValidContent().scenes.map((scene) => scene.id));

  const stored = loadValidContent();
  stored.scenes.reverse();
  assert.ok(codes(validateContent(stored).errors).includes('READING_ORDER'));
});

test('the reading order is the stored scene order, with every scene reached once', () => {
  const doc = loadValidContent();
  assert.deepEqual(readingOrder(doc), doc.scenes.map((scene) => scene.id));
  assert.equal(new Set(readingOrder(doc)).size, 45);
});
