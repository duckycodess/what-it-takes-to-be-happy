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
  const chapter = byId(doc.chapters, 'ch-what-counts');
  chapter.sceneIds = [...chapter.sceneIds].reverse();
  assert.deepEqual(validateContent(doc).errors, []);
});

test('moving a beat to another chapter requires only its identifiers to agree', () => {
  const doc = loadValidContent();
  const from = byId(doc.chapters, 'ch-room-for-happiness');
  const to = byId(doc.chapters, 'ch-what-could-change');

  from.sceneIds = from.sceneIds.filter((id) => id !== 'sc-what-enough-means');
  to.sceneIds.unshift('sc-what-enough-means');
  byId(doc.scenes, 'sc-what-enough-means').chapterId = 'ch-what-could-change';

  assert.deepEqual(validateContent(doc).errors, []);
});

test('moving a beat but forgetting its chapterId is reported', () => {
  const doc = loadValidContent();
  const from = byId(doc.chapters, 'ch-room-for-happiness');
  const to = byId(doc.chapters, 'ch-what-could-change');

  from.sceneIds = from.sceneIds.filter((id) => id !== 'sc-what-enough-means');
  to.sceneIds.unshift('sc-what-enough-means');

  const { errors } = validateContent(doc);
  assert.deepEqual(
    errors.map((error) => error.code),
    ['SCENE_CHAPTER_MISMATCH'],
  );
});
