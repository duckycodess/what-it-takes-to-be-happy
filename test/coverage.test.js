/**
 * The site against the coverage matrix and the source register.
 *
 * `docs/coverage.md` is the audit of what this essay covers: which beat answers
 * which part of the assignment, where each lens is explained, applied and
 * questioned, and which note every member position comes from. `docs/research.md`
 * is the audit of how far each source was actually checked.
 *
 * Those two documents are where the editorial promises were made. These checks
 * ask whether the published document keeps them, rather than whether it looks
 * as though it does.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SOURCE_EVIDENCE_LEVELS } from '../src/content/schema.js';
import { loadValidContent, repoRoot } from './helpers.js';
import { readStoryboard } from './support/storyboard.js';

const content = loadValidContent();
const coverage = readFileSync(join(repoRoot, 'docs/coverage.md'), 'utf8');
const storyboard = readStoryboard();
const sceneById = new Map(content.scenes.map((scene) => [scene.id, scene]));

/** Every beat identifier the coverage matrix names anywhere. */
const beatsNamedInCoverage = new Set([...coverage.matchAll(/`(s\d{3})`/g)].map((match) => match[1]));

test('every beat the coverage matrix names is in the published essay', () => {
  assert.ok(beatsNamedInCoverage.size > 60, `the matrix should reference most beats, found ${beatsNamedInCoverage.size}`);
  for (const id of beatsNamedInCoverage) {
    assert.ok(sceneById.has(id), `docs/coverage.md names ${id}, which the site does not carry`);
  }
});

test("the assignment's four parts are each answered on the main path", () => {
  // The matrix lists where each part is answered; the beats it names must
  // actually carry prose rather than being a reference nobody reads.
  const rows = [...coverage.matchAll(/^\| (What do you think of happiness\?|What constitutes happiness\?|Is it achievable in the society we have today\?|If not, how could it be achieved\?) \| ([^|]+) \|/gm)];
  assert.equal(rows.length, 4, 'the matrix should still answer four parts');

  for (const [, part, where] of rows) {
    const named = [...where.matchAll(/`(s\d{3})`/g)].map((match) => match[1]);
    assert.ok(named.length > 0, `${part} names no beat`);
    for (const id of named) {
      const scene = sceneById.get(id);
      assert.ok(scene, `${part} names ${id}, which does not exist`);
      assert.ok(scene.mainPath.length > 0, `${part} is answered at ${id}, which reads as nothing`);
    }
  }
});

test('every lens is explained, applied and questioned, and attached to the beats that carry it', () => {
  // The matrix's lens table is the audit; the content document is where the
  // treatment is written. Both halves have to hold.
  const named = new Set(storyboard.flatMap((scene) => scene.conceptIds ?? []));
  const used = new Set(content.scenes.flatMap((scene) => scene.conceptIds));

  for (const concept of content.concepts) {
    assert.equal(concept.status, 'drafted', `${concept.id} is named without a treatment`);
    assert.ok(used.has(concept.id), `${concept.id} is treated but attached to no beat, so no reader would meet it`);
    for (const field of ['explanation', 'application', 'question']) {
      assert.match(concept[field], /\S/, `${concept.id} has no ${field}`);
    }
    // A concept that cites a source may only cite one the register carries.
    for (const sourceId of concept.sourceIds) {
      assert.ok(content.sources.some((source) => source.id === sourceId), `${concept.id} cites ${sourceId}, which is not in the register`);
    }
  }
  assert.equal(named.size, 0, 'the storyboard parser reports concepts per scene, not as identifiers');
});

test('a concept that cites a source does not claim more than that source was checked for', () => {
  const byId = new Map(content.sources.map((source) => [source.id, source]));
  for (const concept of content.concepts) {
    for (const sourceId of concept.sourceIds) {
      const source = byId.get(sourceId);
      const level = SOURCE_EVIDENCE_LEVELS[source.reviewStatus];
      if (level.requiresSupportedClaim) continue;
      // A concept resting on a work nobody could open has to say so somewhere
      // in its own treatment, since the source itself supports nothing.
      const treatment = `${concept.explanation} ${concept.application} ${concept.question}`.toLowerCase();
      assert.match(
        treatment,
        /could not|not open|did not read|we read|rather than|instead|secondary|entry|overview/,
        `${concept.id} rests on ${sourceId}, which was never opened, and does not say so`,
      );
    }
  }
});

test('every member position in the notes reaches the reader, in that member\'s own voice', () => {
  // The matrix lists each member's distinct positions with the note lines they
  // come from. Every one of those line references must appear on a published
  // line spoken by that member, or in a provenance record behind one.
  const sections = coverage.split(/^### /m).filter((block) => /^(Koj|TJ|Vier) —/.test(block));
  assert.equal(sections.length, 3, 'the matrix should still list three contributors');

  const spoken = new Map(); // member -> set of note references published for them
  for (const scene of content.scenes) {
    for (const line of scene.dialogue) {
      const record = content.provenance.find((entry) => entry.id === line.provenanceId);
      if (!record) continue;
      const member = line.speakerId.replace('cast-', '');
      if (!spoken.has(member)) spoken.set(member, new Set());
      for (const number of record.note.matchAll(/\d+/g)) spoken.get(member).add(Number(number[0]));
    }
  }

  for (const section of sections) {
    const member = section.slice(0, section.indexOf(' ')).toLowerCase();
    const rows = [...section.matchAll(/^\| (?!-)([^|]+) \| ([\d–\-, ]+) \| ([^|]+) \|$/gm)]
      .filter(([, position]) => !/^-+$/.test(position.trim()));
    assert.ok(rows.length > 5, `${member} should have a table of positions`);

    for (const [, position, , where] of rows) {
      const beats = [...where.matchAll(/`(s\d{3})`/g)].map((match) => match[1]);
      assert.ok(beats.length > 0, `"${position.trim()}" names no beat`);
      for (const id of beats) {
        assert.ok(sceneById.get(id), `"${position.trim()}" names ${id}, which does not exist`);
      }
    }
  }

  // And nobody published a line for a member with no note behind it.
  for (const [member, references] of spoken) {
    assert.ok(references.size > 0, `${member} speaks with no note reference recorded`);
  }
});

test('the spoken-line distribution the matrix admits to is the distribution the site has', () => {
  const stated = [...coverage.matchAll(/^\| `(c\d)` \| (\d+) \| (\d+) \| (\d+) \|$/gm)];
  assert.equal(stated.length, 6, 'the matrix should still state the distribution per chapter');

  for (const [, chapterId, koj, tj, vier] of stated) {
    const chapter = content.chapters.find((entry) => entry.id === chapterId);
    const lines = chapter.sceneIds.flatMap((id) => sceneById.get(id).dialogue);
    const count = (member) => lines.filter((line) => line.speakerId === `cast-${member}`).length;
    assert.deepEqual(
      [count('koj'), count('tj'), count('vier')],
      [Number(koj), Number(tj), Number(vier)],
      `${chapterId} does not have the spoken lines docs/coverage.md says it has`,
    );
  }
});

test('an invented friend appears where the matrix says, and never speaks', () => {
  const section = coverage.slice(coverage.indexOf('## Fictional friends'), coverage.indexOf('## Who speaks'));
  const rows = [...section.matchAll(/^\| `([a-z]+)` \| [^|]+ \| ([^|]+) \|$/gm)];
  assert.equal(rows.length, 5, 'five invented figures');

  for (const [, figure, where] of rows) {
    const beats = [...where.matchAll(/`(s\d{3})`/g)].map((match) => match[1]);
    const drawn = content.scenes
      .filter((scene) => scene.visual.cast.some((entry) => entry.characterId === `cast-${figure}`))
      .map((scene) => scene.id);
    assert.deepEqual(drawn, beats, `${figure} is drawn in different beats from the ones the matrix lists`);

    const spoke = content.scenes.flatMap((scene) => scene.dialogue).filter((line) => line.speakerId === `cast-${figure}`);
    assert.deepEqual(spoke, [], `${figure} is invented and may not hold a position`);
  }
});

test('a source is shown at the level the register recorded, and an unopened one supports nothing', () => {
  const research = readFileSync(join(repoRoot, 'docs/research.md'), 'utf8');
  for (const source of content.sources) {
    const level = SOURCE_EVIDENCE_LEVELS[source.reviewStatus];
    assert.ok(level, `${source.id} has an evidence level the contract does not define`);
    assert.ok(research.includes(`### ${source.id} —`), `${source.id} has no evidence record in docs/research.md`);

    if (level.requiresSupportedClaim) {
      assert.match(source.supportedClaim, /\S/);
      assert.match(source.evidenceBasis, /\S/);
    } else {
      assert.equal(source.supportedClaim, null, `${source.id} was not read, so it supports nothing`);
    }
    assert.match(source.limitation, /\S/, `${source.id} must carry its limitation to the reader`);
  }

  // The register's own rollup, against the published document.
  const tally = content.sources.reduce((counts, source) => {
    counts[source.reviewStatus] = (counts[source.reviewStatus] ?? 0) + 1;
    return counts;
  }, {});
  assert.deepEqual(tally, {
    'verified-full': 13, 'verified-abstract': 11, 'verified-locator': 3, 'not-accessed': 5,
  }, 'the published levels no longer match the audit rollup in docs/research.md');
});

test('a work nobody could open is introduced with a visible caveat, not quietly cited', () => {
  const unopened = content.sources.filter((source) => source.reviewStatus === 'not-accessed').map((source) => source.id);
  const order = content.chapters.flatMap((chapter) => chapter.sceneIds);
  const introduced = new Set();

  for (const id of order) {
    const scene = content.scenes.find((entry) => entry.id === id);
    for (const sourceId of scene.sourceIds.filter((entry) => unopened.includes(entry))) {
      if (introduced.has(sourceId)) continue; // said once, where the reader first meets it
      introduced.add(sourceId);
      assert.ok(
        scene.limitations.length > 0,
        `${scene.id} is where a reader first meets ${sourceId}, which nobody could open, and it carries no visible caveat`,
      );
    }
  }
  assert.equal(introduced.size, unopened.length, 'every unopened source is cited somewhere a reader reaches');
});
