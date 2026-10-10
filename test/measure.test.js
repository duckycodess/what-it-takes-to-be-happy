/**
 * What the landing promises, measured from what the reader actually reads.
 *
 * The estimate on the landing is the one number in this essay a visitor acts
 * on before reading a word of it, so it is counted rather than chosen. The
 * corpus is the prose a reader walks through: the landing introduction, the
 * fourteen chapter bridges, and every beat's narration, dialogue and visible
 * caveats in `mainPath` order. Captions, citations, concept names and optional
 * panels are not in it, because nobody has to read them to reach the end.
 *
 * `./tools/count-main-path.sh --published` runs the same count from the
 * command line and prints the same two numbers.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadValidContent } from './helpers.js';
import { readStoryboard } from './support/storyboard.js';

const WORDS_PER_MINUTE = { slow: 200, fast: 250 };

const words = (text) => text.trim().split(/\s+/).filter(Boolean).length;

function measure(content) {
  let total = 0;
  for (const chapter of content.chapters) total += words(chapter.opening) + words(chapter.closing);
  for (const scene of content.scenes) {
    for (const step of scene.mainPath) {
      if (step.kind === 'narration') total += words(scene.narration[step.index]);
      else if (step.kind === 'limitations') total += words(scene.limitations[step.index]);
      else total += words(scene.dialogue[step.index].text);
    }
  }
  return total;
}

test('the reading estimate on the landing is the measured main path, not a guess', () => {
  const content = loadValidContent();
  const counted = measure(content);
  const slow = Math.ceil(counted / WORDS_PER_MINUTE.slow);
  const fast = Math.ceil(counted / WORDS_PER_MINUTE.fast);

  assert.equal(
    content.project.readingTimeEstimate,
    `${fast} to ${slow} minutes`,
    `the main path measures ${counted} words, which is ${fast} to ${slow} minutes at 250 and 200 words a minute`,
  );
});

test('the published corpus is the storyboard corpus, plus the bridges and minus the landing split', () => {
  const content = loadValidContent();
  const storyboard = readStoryboard();

  const authored = storyboard.reduce((total, scene) => total + scene.blocks.reduce((n, block) => n + words(block.text), 0), 0);
  const bridges = content.chapters.reduce((total, chapter) => total + words(chapter.opening) + words(chapter.closing), 0);
  // The landing carries s001's question and its names-and-time sentence, so
  // the first beat does not, and the count does not include them twice.
  const split = storyboard[0].blocks
    .filter((block) => !/^Three of us tried/.test(block.text))
    .reduce((total, block) => total + words(block.text), 0);

  assert.equal(measure(content), authored - split + bridges, 'the published corpus is not what the storyboard plus the bridges comes to');
  assert.ok(bridges < authored / 20, 'the bridges are connective tissue, not a chapter of their own');
});

test('nothing essential is reachable only through an optional panel', () => {
  const content = loadValidContent();
  const byId = new Map(content.details.map((detail) => [detail.id, detail]));
  const onBeats = new Set(content.scenes.flatMap((scene) => scene.sourceIds));

  for (const scene of content.scenes) {
    for (const detailId of scene.detailIds) {
      const detail = byId.get(detailId);
      assert.ok(detail, `${scene.id} names a panel that does not exist`);
      // A beat that carries a panel must already read without it: it has its
      // own main path, and its own sources are on the beat rather than inside.
      assert.ok(scene.mainPath.length > 0, `${scene.id} would be empty with its panel closed`);
      // A panel may name a source its own beat does not — the reanalysis panel
      // names both papers — but no source may be reachable only from inside a
      // panel, because a reader who never opens one would never meet it.
      for (const sourceId of detail.sourceIds) {
        assert.ok(onBeats.has(sourceId), `${sourceId} is cited only inside a panel`);
      }
    }
  }

  // And a panel is never the only route to its own text: the interaction that
  // opens it may only reveal a detail the beat already lists.
  for (const interaction of content.interactions) {
    const owner = content.scenes.find((scene) => scene.interactionIds.includes(interaction.id));
    assert.ok(owner, `${interaction.id} belongs to no beat`);
    assert.ok(owner.detailIds.includes(interaction.detailId));
  }
});
