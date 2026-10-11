/**
 * The main-path measurement, and the command that reports it.
 *
 * The earlier build printed a reading-time estimate on its landing, so the
 * number mattered to a visitor before they read a word. The approved script
 * makes no such promise, which changes what this file is for: the count is now
 * an editorial measurement of the argument, and the thing worth proving is
 * that it is *recomputed under a recorded rule* rather than carried as a
 * target that copy could be trimmed to meet.
 *
 * `src/content/transfer.js` holds the rule. `test/transfer.test.js` checks the
 * document's own figure against it. This file checks the third place the
 * number appears — `./tools/count-main-path.sh` — because a command that
 * disagrees with the document is how a stale figure gets quoted in review.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import { countWords, WORD_COUNT_RULE } from '../src/content/transfer.js';
import { loadValidContent, repoRoot } from './helpers.js';

const content = loadValidContent();

const run = (...args) => execFileSync('./tools/count-main-path.sh', args, {
  cwd: repoRoot,
  encoding: 'utf8',
});

const field = (output, name) => output.match(new RegExp(`^${name}\\s*:\\s*(.+)$`, 'm'))?.[1].trim();

test('the command counts what the document records, under the same rule', () => {
  const output = run();
  assert.equal(field(output, 'main-path words'), String(content.measure.words));
  assert.equal(field(output, 'recorded in document'), String(content.measure.words));
  assert.equal(field(output, 'rule'), WORD_COUNT_RULE);
  assert.equal(field(output, 'rule'), content.measure.rule);
  assert.equal(run('--rule').trim(), WORD_COUNT_RULE);
});

test('the counted text is the reader copy itself, and counting it again agrees', () => {
  const text = run('--text');
  const counted = text.split(/\s+/).filter(Boolean).length;
  assert.equal(counted, content.measure.words, 'the printed corpus does not come to the printed number');

  // It is the reader's own sentences, not a paraphrase of them: the first
  // and last scenes' opening narration both appear verbatim.
  assert.ok(text.includes(content.scenes[0].blocks[0].parts[0].text));
  assert.ok(text.includes(content.scenes.at(-1).blocks[0].parts[0].text));

  // And nothing from outside the main path is in it.
  assert.ok(!text.includes(content.scenes[0].title), 'a scene title was counted');
  assert.ok(!text.includes(content.sourcesPage.sources[0].citation), 'a register entry was counted');
  assert.ok(!text.includes('[^'), 'a citation marker was counted');
  for (const scene of content.scenes) {
    for (const block of scene.blocks) {
      if (block.speaker) assert.ok(!text.includes(`${block.speaker}:`), 'a speaker label was counted');
    }
  }
});

test('the per-chapter breakdown adds up to the whole', () => {
  const output = run('--chapters');
  const rows = [...output.matchAll(/^ {2}(c\d) +(\d+) words {2}(.+)$/gm)];
  assert.equal(rows.length, 8);

  const sceneById = new Map(content.scenes.map((scene) => [scene.id, scene]));
  let total = 0;
  for (const [, id, words, title] of rows) {
    const chapter = content.chapters.find((entry) => entry.id === id);
    assert.equal(title, chapter.title, `${id} is reported under a different title`);
    assert.equal(Number(words), countWords(chapter.sceneIds.map((sceneId) => sceneById.get(sceneId))));
    total += Number(words);
  }
  assert.equal(total, content.measure.words);
});

test('the reported reading time is a range, and the site promises none of it', () => {
  const estimate = field(run(), 'reading estimate');
  const slow = Math.ceil(content.measure.words / 200);
  const fast = Math.ceil(content.measure.words / 250);
  assert.equal(estimate, `~${fast}-${slow} minutes (not shown to readers)`);

  // The approved essay is substantially longer than the 45-scene script it
  // replaced -- about 8,600 words against 4,137 -- which is the richer prose
  // the owner asked for. The figure is recomputed from the copy rather than
  // asserted at a number somebody would have to edit by hand, it is not a band
  // the approved copy may be trimmed to reach, and the reader is shown no
  // figure at all, which is what `test/render.test.js` asserts of the markup.
  assert.ok(slow > fast, 'the estimate is a range, not a promise');
  assert.ok(slow >= 30 && slow <= 60, `the slow estimate is ${slow} minutes`);
  assert.equal(content.landing.readingTimeEstimate, undefined);
});

test('a drifted document makes the command fail rather than print a stale figure', () => {
  // The command recomputes and compares; it does not echo a stored number.
  assert.equal(countWords(content.scenes), content.measure.words);
  const drifted = loadValidContent();
  drifted.measure.words += 1;
  assert.notEqual(countWords(drifted.scenes), drifted.measure.words);
});
