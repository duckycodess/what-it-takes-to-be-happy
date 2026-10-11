/**
 * The site against the coverage matrix.
 *
 * `docs/coverage.md` is the audit of what this essay covers: where each part
 * of the assignment is answered, which scenes each chapter holds, who speaks
 * in it, which source supports which claim, and which drawing appears where.
 * That is where the editorial promises were made.
 *
 * A matrix is worth nothing if it drifts from the thing it describes, and it
 * drifts silently: nobody re-reads a table of 31 rows. So every figure in it
 * is recomputed here from `content/content.json`, and a row that no longer
 * matches the published document fails rather than quietly misdescribing it.
 *
 * `test/register.test.js` is the other half, and checks the published source
 * entries against the audit in `docs/research.md`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { loadValidContent, repoRoot } from './helpers.js';

const content = loadValidContent();
const coverage = readFileSync(join(repoRoot, 'docs/coverage.md'), 'utf8');

const sceneById = new Map(content.scenes.map((scene) => [scene.id, scene]));
const readingOrder = content.chapters.flatMap((chapter) => chapter.sceneIds);

/** The section under a `## ` heading, up to the next one. */
function section(heading) {
  const start = coverage.indexOf(`## ${heading}`);
  assert.ok(start > 0, `docs/coverage.md no longer has a "${heading}" section`);
  const rest = coverage.slice(start + heading.length + 3);
  const end = rest.indexOf('\n## ');
  return end < 0 ? rest : rest.slice(0, end);
}

/**
 * A section's table rows, as arrays of trimmed cells, without the header.
 *
 * The header is the line immediately above the `| --- |` separator, so it is
 * found rather than guessed: a table whose columns were renamed still has its
 * body read correctly, and a header is never counted as content.
 */
function rows(text) {
  const lines = text.split('\n');
  const body = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!/^\|.*\|$/.test(line)) continue;
    if (/^\|[\s-]+\|[\s|-]*$/.test(line)) continue;
    if (/^\|[\s-]+\|[\s|-]*$/.test((lines[index + 1] ?? '').trim())) continue; // the header
    body.push(line.slice(1, -1).split(' | ').map((cell) => cell.trim()));
  }
  return body;
}

const ids = (cell) => [...cell.matchAll(/`(s\d{3})`/g)].map((match) => match[1]);
const bare = (cell) => cell.replace(/`/g, '').trim();

/** Scenes a brief reference is actually drawn in, in reading order. */
function scenesUsing(ref) {
  return readingOrder.filter((id) => sceneById.get(id).visual.views.some((view) => view.ref === ref));
}

test('every scene the matrix names is in the published essay', () => {
  const named = new Set([...coverage.matchAll(/`(s\d{3})`/g)].map((match) => match[1]));
  assert.equal(named.size, 31, `the matrix should name every scene, found ${named.size}`);
  for (const id of named) {
    assert.ok(sceneById.has(id), `docs/coverage.md names ${id}, which the site does not carry`);
  }
});

test("the assignment's four parts are each answered on the main reading path", () => {
  const table = rows(section("The assignment's four parts"));
  assert.equal(table.length, 4, 'the matrix should still answer four parts');

  for (const [part, where, answer] of table) {
    assert.match(part, /\?$/, `"${part}" is not a question`);
    const named = ids(where);
    assert.ok(named.length > 0, `${part} names no scene`);
    for (const id of named) {
      const scene = sceneById.get(id);
      assert.ok(scene, `${part} names ${id}, which does not exist`);
      // The scene it points at has to read as something: a row that answered
      // the assignment at an empty scene would be an answer in name only.
      assert.ok(scene.blocks.length > 0, `${part} is answered at ${id}, which reads as nothing`);
    }
    assert.ok(answer.length > 40, `${part} has no answer written beside it`);
  }
});

test('the chapter table is the chapters the document has', () => {
  const table = rows(section('The eight chapters'));
  assert.equal(table.length, 8);

  table.forEach(([id, title, range, count, koj, tj, vier], index) => {
    const chapter = content.chapters[index];
    assert.equal(bare(id), chapter.id);
    assert.equal(title, chapter.title);
    assert.deepEqual(ids(range), [chapter.sceneIds[0], chapter.sceneIds.at(-1)]);
    assert.equal(Number(count), chapter.sceneIds.length);

    const blocks = chapter.sceneIds.flatMap((sceneId) => sceneById.get(sceneId).blocks);
    const spoken = (speaker) => blocks.filter((block) => block.speaker === speaker).length;
    assert.deepEqual(
      [Number(koj), Number(tj), Number(vier)],
      [spoken('Koj'), spoken('TJ'), spoken('Vier')],
      `${chapter.id} does not have the spoken lines docs/coverage.md says it has`,
    );
  });

  const narration = content.scenes.flatMap((scene) => scene.blocks).filter((block) => block.kind === 'narration');
  assert.ok(
    coverage.includes(`The remaining ${narration.length} blocks are narration`),
    `the matrix states a narration count that is not ${narration.length}`,
  );
});

test('the scene index is every scene, in reading order, with its real layout', () => {
  const table = rows(section('Scenes'));
  assert.equal(table.length, 31);

  table.forEach(([id, title, layout], index) => {
    const scene = sceneById.get(readingOrder[index]);
    assert.equal(bare(id), scene.id, 'the index is in reading order');
    assert.equal(title, scene.title, `${scene.id} is listed under a different title`);
    assert.equal(layout, scene.visual.layout, `${scene.id} is listed with the wrong layout`);
  });
});

test('every source row names the entry, its register identity and where it is cited', () => {
  const table = rows(section('Research'));
  assert.equal(table.length, 26);

  const citedIn = new Map();
  for (const id of readingOrder) {
    for (const block of sceneById.get(id).blocks) {
      for (const part of block.parts) {
        if (!part.citation) continue;
        if (!citedIn.has(part.citation)) citedIn.set(part.citation, []);
        if (!citedIn.get(part.citation).includes(id)) citedIn.get(part.citation).push(id);
      }
    }
  }

  table.forEach(([number, register, where, level], index) => {
    const source = content.sourcesPage.sources[index];
    assert.equal(number, `[${source.number}]`);
    assert.equal(bare(register), source.sourceId, `entry ${source.number} is listed under another identity`);
    assert.equal(bare(level), source.auditStatus, `${source.sourceId} is listed at another audit level`);
    assert.deepEqual(
      ids(where), citedIn.get(source.number),
      `${source.sourceId} is listed as cited somewhere it is not`,
    );
  });
});

test('every artwork row is an inspected asset, used where the matrix says', () => {
  const table = rows(section('Artwork'));
  assert.equal(table.length, content.assets.length);
  assert.equal(table.length, 20);

  table.forEach(([ref, id, where, cutouts, labels], index) => {
    const asset = content.assets[index];
    assert.equal(bare(ref), asset.ref);
    assert.equal(bare(id), asset.id);
    assert.equal(Number(cutouts), asset.images.length, `${asset.ref} has a different number of cutouts`);

    const expected = scenesUsing(asset.ref);
    const listed = ids(where);
    if (where.includes('`landing`')) {
      assert.ok(
        content.landing.visual.views.some((view) => view.ref === asset.ref),
        `${asset.ref} is listed on the landing but is not drawn there`,
      );
    }
    assert.deepEqual(listed, expected, `${asset.ref} is listed in scenes it is not drawn in`);

    const names = asset.labels.map((label) => label.text);
    assert.equal(labels, names.length > 0 ? names.join(', ') : '—', `${asset.ref} carries different labels`);
  });
});

test('an invented figure appears where the matrix says, and never speaks', () => {
  const table = rows(section('Fictional figures'));
  assert.equal(table.length, 5, 'five kinds of invented figure');

  for (const [figure, where, what] of table) {
    const named = ids(where);
    assert.ok(named.length > 0, `${figure} is listed as drawn nowhere`);
    for (const id of named) {
      const scene = sceneById.get(id);
      assert.ok(scene, `${figure} is listed in ${id}, which does not exist`);
      assert.ok(scene.visual.views.length > 0, `${figure} is listed in ${id}, which carries no drawing`);
    }
    assert.ok(what.length > 20, `${figure} is listed without saying what it illustrates`);
  }

  // The approved essay has one opening TJ line. Other member positions
  // remain attributed prose; no invented figure receives dialogue.
  const speakers = new Set(content.scenes
    .flatMap((scene) => scene.blocks)
    .map((block) => block.speaker)
    .filter(Boolean));
  assert.deepEqual([...speakers].sort(), ['TJ']);
});

test('the optional comparisons are the two the document has, with their approved labels', () => {
  const table = rows(section('Optional interactions'));
  const optional = content.scenes.filter((scene) => scene.visual.control !== null);
  assert.equal(table.length, optional.length);
  assert.equal(table.length, 2);

  table.forEach(([id, control, states], index) => {
    const scene = optional[index];
    assert.equal(bare(id), scene.id);
    assert.match(control, /aria-pressed/, 'the control is described as the accessible control it is');
    assert.deepEqual(
      states.split(',').map((state) => bare(state)),
      scene.visual.control.labels,
      `${scene.id} is listed with labels the document does not use`,
    );
  });

  // And the claim the section ends on: nothing essential is behind a control.
  assert.ok(coverage.includes('Nothing essential is reachable only by interacting.'));
  for (const scene of optional) {
    assert.ok(scene.blocks.length > 1, `${scene.id} would read as nothing without its comparison`);
  }
});

test('the matrix describes this build, not the superseded one', () => {
  // The 87-beat argument used s001-s087 and a vocabulary of beats, concepts,
  // provenance records and detail panels. A matrix still carrying any of that
  // is describing a site that no longer exists.
  assert.ok(!/`s0[0-8][0-7]`/.test(coverage.replace(/`s08[89]`/g, '')), 'a superseded beat identifier survives');
  for (const term of ['conceptId', 'detailIds', 'mainPath', 'provenanceId', 'reading-time']) {
    assert.ok(!coverage.includes(term), `the matrix still refers to ${term}`);
  }
  assert.ok(coverage.includes('docs/storyboard.md') || coverage.includes('storyboard.md'),
    'the superseded build is recorded as historical rather than deleted');
});
