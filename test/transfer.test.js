/**
 * The website against the editorial storyboard, sentence by sentence.
 *
 * `docs/storyboard.md` is where the essay was written and audited.
 * `content/content.json` is what the site is built from. Two documents holding
 * the same prose will drift unless something compares them, and a drift here
 * is not a formatting problem: it is the site saying something the group did
 * not write, or quietly losing a caveat that the audit put on the main path.
 *
 * Two differences are deliberate, and both are listed here rather than
 * tolerated by a loose comparison:
 *
 *  - The landing. `s001`'s blockquote holds the question, an introduction, and
 *    a sentence of names and reading time. On the site the question is the
 *    landing heading, the names are the landing byline, and the reading time is
 *    measured rather than retyped, so the beat carries the introduction alone.
 *  - The fourteen chapter bridges. They are authored for the site from the
 *    storyboard's transition notes, and are not storyboard prose. The test
 *    below checks exactly that: no bridge may be a storyboard blockquote, and
 *    every bridge must carry a provenance record saying where it came from.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadValidContent } from './helpers.js';
import { readStoryboard, storyboardChapters } from './support/storyboard.js';

const content = loadValidContent();
const storyboard = readStoryboard();
const sceneById = new Map(content.scenes.map((scene) => [scene.id, scene]));

/** A beat's essential blocks in the order a reader meets them. */
const mainPath = (scene) =>
  scene.mainPath.map((entry) => {
    if (entry.kind === 'narration') return { kind: 'narration', text: scene.narration[entry.index] };
    if (entry.kind === 'limitations') return { kind: 'limitations', text: scene.limitations[entry.index] };
    const line = scene.dialogue[entry.index];
    return { kind: 'dialogue', text: line.text, speaker: line.speakerId.replace('cast-', ''), stance: line.stance };
  });

/** The storyboard paragraphs the landing carries instead of the first beat. */
const LANDING_SPLIT = [
  'What does it take to be happy?',
  'TJ. Koj. Vier. Roughly 35 to 44 minutes, depending on how long you look at things. Next and Back are yours.',
];

test('the site holds every authored beat, in the storyboard order, under the right chapter', () => {
  assert.equal(storyboard.length, 87, 'the storyboard should still hold 87 authored beats');
  assert.deepEqual(content.scenes.map((scene) => scene.id), storyboard.map((scene) => scene.id));

  const chapters = storyboardChapters(storyboard);
  assert.deepEqual(content.chapters.map((chapter) => chapter.id), chapters.map((chapter) => chapter.id));
  for (const chapter of chapters) {
    const published = content.chapters.find((entry) => entry.id === chapter.id);
    assert.deepEqual(published.sceneIds, chapter.sceneIds, `${chapter.id} is ordered differently on the site`);
    assert.equal(published.title, chapter.title, `${chapter.id} is titled differently on the site`);
    for (const sceneId of chapter.sceneIds) {
      assert.equal(sceneById.get(sceneId).chapterId, chapter.id);
    }
  }
});

test('every main-path paragraph, line and caveat is transferred in the authored order', () => {
  let compared = 0;
  for (const authored of storyboard) {
    const scene = sceneById.get(authored.id);
    assert.equal(scene.title, authored.title, `${authored.id} is titled differently on the site`);

    const expected = authored.blocks
      .filter((block) => !(authored.id === 's001' && LANDING_SPLIT.includes(block.text)))
      .map((block) => (block.kind === 'dialogue'
        ? { kind: 'dialogue', text: block.text, speaker: block.speaker, stance: 'member-endorsed' }
        : { kind: block.kind, text: block.text }));

    assert.deepEqual(mainPath(scene), expected, `${authored.id} does not read the way it was written`);
    compared += expected.length;
  }
  // The storyboard's own count, minus the two paragraphs the landing carries.
  assert.equal(compared, 235, `expected every authored block to be compared, compared ${compared}`);
});

test('the landing carries the question, the names and the time, and the first beat does not repeat them', () => {
  const landing = storyboard[0];
  assert.equal(landing.id, 's001');

  // The question is the landing heading, word for word.
  assert.equal(content.project.question, LANDING_SPLIT[0]);
  // The names are the landing byline, in the order the sentence gives them.
  assert.deepEqual(
    content.cast.filter((entry) => entry.role === 'member').map((entry) => entry.displayName),
    ['TJ', 'Koj', 'Vier'],
  );
  // The reading time is measured rather than retyped, so the site does not
  // promise a range it has not counted. That it matches what was counted is
  // checked in test/measure.test.js.
  assert.match(content.project.readingTimeEstimate, /^\d+ to \d+ minutes$/);

  const beat = sceneById.get('s001');
  for (const repeated of LANDING_SPLIT) {
    assert.ok(!beat.narration.includes(repeated), 'the first beat must not repeat what the landing already said');
  }
  assert.equal(beat.narration.length, 1);
  assert.match(beat.narration[0], /^Three of us tried to answer that for a class\./);
});

test('the chapter bridges are authored for the site and say so, rather than passing as quoted prose', () => {
  const quoted = new Set(storyboard.flatMap((scene) => scene.blocks.map((block) => block.text)));
  const records = new Map(content.provenance.map((record) => [record.appliesTo, record]));

  for (const chapter of content.chapters) {
    for (const bridge of [chapter.opening, chapter.closing]) {
      assert.match(bridge, /\S/);
      assert.ok(!quoted.has(bridge), `${chapter.id} presents a storyboard blockquote as a bridge`);
    }
    const record = records.get(chapter.id);
    assert.ok(record, `${chapter.id} has no provenance record for its bridges`);
    assert.equal(record.sourceNote, 'docs/storyboard.md');
  }
  assert.equal(content.chapters.length * 2, 14, 'fourteen bridges, two per chapter');
});

test('who is drawn in a beat, and how they are feeling, is what the storyboard cast line says', () => {
  const expressionName = new Map();
  for (const character of content.cast) {
    for (const expression of character.expressions) expressionName.set(`${character.id}/${expression.id}`, expression.artId);
  }

  for (const authored of storyboard) {
    const scene = sceneById.get(authored.id);
    if (scene.visual.artAbsence === 'text-only') {
      assert.deepEqual(scene.visual.cast, [], `${authored.id} is text-only and places nobody`);
      continue;
    }
    assert.deepEqual(
      scene.visual.cast.map((entry) => entry.characterId.replace('cast-', '')),
      authored.cast.map((entry) => entry.figure),
      `${authored.id} draws different figures from the ones the storyboard places`,
    );

    for (const [index, entry] of scene.visual.cast.entries()) {
      const drawn = expressionName.get(`${entry.characterId}/${entry.expressionId}`);
      const states = authored.cast[index].expressions;
      if (states.length === 0) continue; // the two cast lines that give states as prose
      assert.ok(states.includes(drawn), `${authored.id}: ${entry.characterId} is drawn ${drawn}, which the storyboard does not give it`);
    }
  }
});

test('every member line is spoken by its author, and no invented figure is given a position', () => {
  const role = new Map(content.cast.map((entry) => [entry.id, entry.role]));
  for (const authored of storyboard) {
    const scene = sceneById.get(authored.id);
    const spoken = authored.blocks.filter((block) => block.kind === 'dialogue');
    assert.equal(scene.dialogue.length, spoken.length, `${authored.id} has a different number of lines`);

    for (const [index, line] of scene.dialogue.entries()) {
      assert.equal(line.speakerId, `cast-${spoken[index].speaker}`);
      assert.equal(role.get(line.speakerId), 'member', `${line.id} attributes a position to an invented figure`);
      assert.equal(line.stance, 'member-endorsed');
      const record = content.provenance.find((entry) => entry.id === line.provenanceId);
      assert.ok(record, `${line.id} has no provenance record`);
      assert.ok(
        record.note.includes(spoken[index].notes),
        `${line.id} records "${record.note}", which does not name the notes at ${spoken[index].notes}`,
      );
    }
  }
});

test('each beat cites the sources the storyboard gives it, and the last beat hands over to the register', () => {
  for (const authored of storyboard) {
    const scene = sceneById.get(authored.id);
    if (authored.id === 's087') {
      // The source note is followed immediately by the register itself, so it
      // points at it rather than reprinting thirty-two entries above it.
      assert.deepEqual(scene.sourceIds, []);
      assert.equal(scene.detailIds.length, 1);
      continue;
    }
    assert.deepEqual(scene.sourceIds, authored.sources, `${authored.id} cites different sources from the storyboard`);
  }

  // And every audited source is reachable: either cited on a beat or in the
  // register, which carries all of them.
  const cited = new Set(content.scenes.flatMap((scene) => scene.sourceIds));
  assert.equal(content.sources.length, 32);
  for (const source of content.sources) {
    if (['R11', 'R14', 'R22'].includes(source.id)) continue; // cited on their beats too
    assert.ok(cited.has(source.id) || source.reviewStatus === 'not-accessed', `${source.id} is in the register and on no beat`);
  }
});

test('no scaffolding prose survived the transfer', () => {
  const everything = JSON.stringify(content);
  for (const phrase of ['Placeholder', 'placeholder', 'fixture', 'stand-in', 'TODO', 'Lorem']) {
    assert.ok(!everything.includes(phrase), `the content document still contains "${phrase}"`);
  }
  assert.equal(content.status.final, true);
});
