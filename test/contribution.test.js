import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { transfer, APPROVED_ESSAY, POLISH_AMENDMENT, READER_AMENDMENT, CONTRIBUTION_AMENDMENT } from '../src/content/transfer.js';
import { readManifests } from '../src/tools/transfer.js';
import { loadValidContent, repoRoot } from './helpers.js';

const read = (path) => readFileSync(join(repoRoot, path), 'utf8');
const amendmentJson = read(CONTRIBUTION_AMENDMENT.path);
const amendment = JSON.parse(amendmentJson);
const inputs = {
  markdown: read(APPROVED_ESSAY.markdown.path),
  handoffJson: read(APPROVED_ESSAY.handoff.path),
  sourceMap: JSON.parse(read('docs/redesign/source-map.json')),
  manifests: await readManifests(repoRoot),
  amendmentJson: read(POLISH_AMENDMENT.path),
  readerAmendmentJson: read(READER_AMENDMENT.path),
};
const before = transfer(inputs);
const after = loadValidContent();
const permitted = new Set(['s201', 's202', 's203', 's211']);

test('the teammate contribution changes only the four intended cards', () => {
  assert.deepEqual(after.chapters, before.chapters, 'existing chapter order and scene addresses stay');
  assert.deepEqual(after.relocations, before.relocations, 'old shared addresses still work');
  assert.deepEqual(after.interface, before.interface, 'the controls retain their copy');
  assert.deepEqual(after.landing, before.landing, 'the title page is unchanged');
  let untouched = 0;
  for (const scene of after.scenes) {
    const original = before.scenes.find((entry) => entry.id === scene.id);
    if (!permitted.has(scene.id)) {
      assert.deepEqual(scene, original, scene.id + ' unexpectedly changed');
      untouched += 1;
    } else {
      assert.notDeepEqual(scene, original);
    }
  }
  assert.equal(untouched, 27);
  assert.deepEqual(after.scenes[2].blocks.at(-1), before.scenes[2].blocks.at(-1), 'Court Vision still leads into the good-day/good-life distinction');
  assert.deepEqual(after.sourcesPage.sources.slice(0, 26), before.sourcesPage.sources, 'existing citations keep their identities and numbers');
});

test('the submitted dialogue survives, and artwork directions do not become narration', () => {
  const originals = amendment.inputs.map((input) => read(input.path));
  const dialogue = after.scenes.flatMap((scene) => scene.blocks.filter((block) => block.kind === 'dialogue'));
  assert.equal(dialogue.length, 5);
  for (const block of dialogue) {
    const text = block.parts.map((part) => part.text).join('');
    assert.ok(originals.some((original) => original.includes(text)), block.speaker + ' has invented dialogue');
  }
  const second = after.scenes.find((scene) => scene.id === 's202');
  assert.ok(!second.blocks.some((block) => block.parts.some((part) => part.text?.startsWith('TJ enjoys a game, Koj works'))), 'the picture description should not interrupt TJ’s definition');
  assert.deepEqual(after.scenes.filter((scene) => permitted.has(scene.id)).map((scene) => scene.title),
    ['Stakes of the Game', '(For) Three Points!!', 'Court Vision', 'Checking all the boxes']);
});

test('the contribution preserves the input files and pins its new sources and pictures', () => {
  const hash = (data) => createHash('sha256').update(data).digest('hex');
  assert.equal(hash(amendmentJson), CONTRIBUTION_AMENDMENT.sha256);
  assert.deepEqual(after.source.contributionAmendment, CONTRIBUTION_AMENDMENT);
  for (const input of amendment.inputs) {
    assert.equal(hash(readFileSync(join(repoRoot, input.path))), input.sha256, input.path);
  }
  assert.deepEqual(after.sourcesPage.sources.slice(26), amendment.sources);
  assert.deepEqual(after.scenes.filter((scene) => ['s201', 's211'].includes(scene.id)).map((scene) => scene.visual.views[0].ref), ['B15', 'B16']);
  assert.throws(() => transfer({ ...inputs, contributionAmendmentJson: amendmentJson + ' ' }), /contribution amendment changed/);
});
