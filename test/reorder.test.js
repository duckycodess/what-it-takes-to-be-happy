/**
 * Stable identifiers must let a later editorial delta move beats around
 * without depending on where anything sits in an array.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { validateContent } from '../src/content/validate.js';
import { loadValidContent, byId } from './helpers.js';

test('reversing the stored order of scenes and chapters changes nothing', () => {
  const doc = loadValidContent();
  doc.scenes.reverse();
  doc.chapters.reverse();
  doc.sources.reverse();
  assert.deepEqual(validateContent(doc).errors, []);
});

test('reordering beats inside a chapter by identifier stays valid', () => {
  const doc = loadValidContent();
  const chapter = byId(doc.chapters, 'c1');
  chapter.sceneIds = [...chapter.sceneIds].reverse();
  assert.deepEqual(validateContent(doc).errors, []);
});

test('moving a beat to another chapter requires only its identifiers to agree', () => {
  const doc = loadValidContent();
  const from = byId(doc.chapters, 'c5');
  const to = byId(doc.chapters, 'c6');

  from.sceneIds = from.sceneIds.filter((id) => id !== 's065');
  to.sceneIds.unshift('s065');
  byId(doc.scenes, 's065').chapterId = 'c6';

  assert.deepEqual(validateContent(doc).errors, []);
});

test('moving a beat but forgetting its chapterId is reported', () => {
  const doc = loadValidContent();
  const from = byId(doc.chapters, 'c5');
  const to = byId(doc.chapters, 'c6');

  from.sceneIds = from.sceneIds.filter((id) => id !== 's065');
  to.sceneIds.unshift('s065');

  const { errors } = validateContent(doc);
  assert.deepEqual(
    errors.map((error) => error.code),
    ['SCENE_CHAPTER_MISMATCH'],
  );
});
