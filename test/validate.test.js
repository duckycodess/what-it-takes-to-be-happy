import test from 'node:test';
import assert from 'node:assert/strict';

import { validateContent } from '../src/content/validate.js';
import { SOURCE_EVIDENCE_LEVELS, SOURCE_REVIEW_STATUSES } from '../src/content/schema.js';
import { loadValidContent, readJson, clone, byId, codes, codesAt } from './helpers.js';

test('the authored content document satisfies the contract', () => {
  const result = validateContent(loadValidContent());
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test('the shipped content document is the finished essay, with a measured reading time', () => {
  const doc = loadValidContent();
  assert.equal(doc.status.final, true);
  assert.equal(doc.status.notice, null, 'a finished essay has no draft notice to show');
  assert.match(doc.project.readingTimeEstimate, /^\d+ to \d+ minutes$/, 'the estimate is a measured range, not a guess');
});

test('every contributor position traces to a note, and every concept is treated in full', () => {
  const doc = loadValidContent();
  const records = new Map(doc.provenance.map((record) => [record.id, record]));
  const members = new Set(doc.cast.filter((entry) => entry.role === 'member').map((entry) => entry.id));

  let endorsed = 0;
  for (const scene of doc.scenes) {
    for (const line of scene.dialogue) {
      if (line.stance !== 'member-endorsed') continue;
      endorsed += 1;
      assert.ok(members.has(line.speakerId), `${line.id} speaks a member position but is not spoken by a member`);
      const record = records.get(line.provenanceId);
      assert.ok(record, `${line.id} has no provenance record`);
      assert.equal(record.appliesTo, line.id);
      assert.match(record.sourceNote, /^docs\/notes\//, `${line.id} must name the note it comes from`);
    }
  }
  assert.ok(endorsed > 70, `expected the group's positions on the main path, found ${endorsed} lines`);

  // "Explain, apply, and question" is the agreed treatment, and naming a lens
  // as decoration is what it exists to prevent.
  for (const concept of doc.concepts) {
    assert.equal(concept.status, 'drafted', `${concept.id} is named but not treated`);
    for (const field of ['explanation', 'application', 'question']) {
      assert.ok(concept[field].length > 40, `${concept.id}.${field} is too short to be a treatment`);
    }
  }
});

test('no source claims more than the evidence level it reached', () => {
  const doc = loadValidContent();
  for (const source of doc.sources) {
    const level = SOURCE_EVIDENCE_LEVELS[source.reviewStatus];
    assert.ok(level, `${source.id} has an unknown evidence level`);
    if (level.requiresSupportedClaim) {
      assert.match(source.supportedClaim, /\S/, `${source.id} should state what it supports`);
    } else {
      assert.equal(source.supportedClaim, null, `${source.id} was not read, so it may not support a claim`);
    }
  }

  // The fixture is the only place the contract is exercised end to end, so it
  // carries one source at each level that the audit actually produced.
  const levels = new Set(doc.sources.map((source) => source.reviewStatus));
  for (const level of ['verified-full', 'verified-abstract', 'verified-locator', 'not-accessed']) {
    assert.ok(levels.has(level), `the fixture should exercise the ${level} evidence level`);
  }
});

test('every evidence level is fully defined', () => {
  for (const status of SOURCE_REVIEW_STATUSES) {
    const level = SOURCE_EVIDENCE_LEVELS[status];
    assert.match(level.label, /\S/, `${status} needs a reader-visible label`);
    assert.equal(typeof level.requiresRecord, 'boolean');
    assert.equal(typeof level.requiresSupportedClaim, 'boolean');
    // A level that demands a claim must also say what that claim rests on.
    assert.equal(level.requiresSupportedClaim, typeof level.claimLabel === 'string', `${status} claim label disagrees with its rule`);
    if (level.requiresSupportedClaim) assert.ok(level.requiresRecord, `${status} cannot support a claim without a record`);
  }
});

test('a deliberately broken document reports every located problem at once', () => {
  const { errors, valid } = validateContent(readJson('test/fixtures/invalid-content.json'));
  assert.equal(valid, false);

  const reported = new Set(codes(errors));
  for (const code of [
    'DUPLICATE_ID',
    'INVALID_ID',
    'INVALID_ENUM',
    'MISSING_FIELD',
    'UNKNOWN_FIELD',
    'EMPTY_STRING',
    'UNKNOWN_REFERENCE',
    'EMPTY_ESSENTIAL_SCENE',
    'SCENE_ORPHANED',
    'SCENE_CLAIMED_TWICE',
    'SCENE_CHAPTER_MISMATCH',
    'UNSUPPORTED_MEMBER_POSITION',
    'UNSUPPORTED_SOURCE_CLAIM',
    'UNVERIFIED_SOURCE_RECORD',
    'INVALID_SOURCE_URL',
    'UNDRAFTED_CONCEPT_TEXT',
    'INTERACTION_DETAIL_NOT_IN_SCENE',
    'ENTRY_CLAIMED_TWICE',
    'UNUSED_ENTRY',
    'UNKNOWN_ART_REFERENCE',
    'ART_ROLE_MISMATCH',
    'ART_STATE_UNAVAILABLE',
    'ART_FIGURE_COUNT',
    'ART_ABSENCE_UNDECLARED',
    'ART_ABSENCE_DECLARED',
    'MAIN_PATH_INDEX',
    'MAIN_PATH_OUT_OF_RANGE',
    'MAIN_PATH_DUPLICATE',
    'MAIN_PATH_INCOMPLETE',
    'INVALID_CHAPTER_NUMBER',
    'DUPLICATE_CHAPTER_NUMBER',
  ]) {
    assert.ok(reported.has(code), `expected the broken fixture to report ${code}`);
  }

  for (const error of errors) {
    assert.match(error.path, /\S/, 'every error locates itself');
    assert.ok(error.message.length > 20, `error ${error.code} should explain what to do`);
  }
});

test('duplicate identifiers are rejected wherever they appear', () => {
  const doc = loadValidContent();
  doc.scenes[1].id = doc.scenes[0].id;
  const { errors } = validateContent(doc);
  assert.ok(codesAt(errors, 'scenes[1].id').includes('DUPLICATE_ID'));
});

test('a scene missing from its chapter order is reported, not silently dropped', () => {
  const doc = loadValidContent();
  const chapter = byId(doc.chapters, 'c1');
  chapter.sceneIds = chapter.sceneIds.filter((id) => id !== 's007');
  const { errors } = validateContent(doc);
  assert.ok(codes(errors).includes('SCENE_ORPHANED'));
});

test('a chapter that orders a scene belonging to another chapter is reported', () => {
  const doc = loadValidContent();
  byId(doc.chapters, 'c2').sceneIds.push('s007');
  const { errors } = validateContent(doc);
  assert.ok(codes(errors).includes('SCENE_CLAIMED_TWICE'));
});

test('an unknown speaker is reported against the dialogue line', () => {
  const doc = loadValidContent();
  byId(doc.scenes, 's005').dialogue[0].speakerId = 'cast-nobody';
  const index = doc.scenes.findIndex((scene) => scene.id === 's005');
  const { errors } = validateContent(doc);
  assert.ok(codesAt(errors, `scenes[${index}].dialogue[0].speakerId`).includes('UNKNOWN_REFERENCE'));
});

test('an expression a character does not have is reported with the available list', () => {
  const doc = loadValidContent();
  byId(doc.scenes, 's002').visual.cast[0].expressionId = 'ex-smug';
  const { errors } = validateContent(doc);
  const reported = errors.find((error) => error.code === 'UNKNOWN_EXPRESSION');
  assert.ok(reported, 'expected UNKNOWN_EXPRESSION');
  assert.match(reported.message, /ex-joy/, 'the error should list what the character can express');
});

test('a beat with nothing on the main path is reported', () => {
  const doc = loadValidContent();
  const scene = byId(doc.scenes, 's003');
  assert.equal(scene.dialogue.length + scene.limitations.length, 0, 'this beat is narration only');
  scene.narration = ['  '];
  scene.mainPath = [{ kind: 'narration', index: 0 }];
  assert.ok(codes(validateContent(doc).errors).includes('EMPTY_ESSENTIAL_SCENE'));

  // A beat whose main path is spoken lines is not empty: dialogue is on the
  // main path and is in print, in the continuous view, and with no scripting.
  const spoken = loadValidContent();
  const talking = byId(spoken.scenes, 's005');
  assert.equal(talking.narration.length, 0, 'this beat is dialogue only');
  assert.deepEqual(validateContent(spoken).errors, []);
});

test('a line spoken as a contributor position needs recorded provenance', () => {
  const doc = loadValidContent();
  const line = byId(doc.scenes, 's005').dialogue[0];
  assert.equal(line.stance, 'member-endorsed');
  const record = line.provenanceId;
  line.provenanceId = null;

  const broken = validateContent(clone(doc));
  assert.ok(codes(broken.errors).includes('UNSUPPORTED_MEMBER_POSITION'), 'a position with nothing recording it is an invented position');

  // Pointing it back at its record makes it a supported position again.
  const supported = clone(doc);
  byId(supported.scenes, 's005').dialogue[0].provenanceId = record;
  assert.deepEqual(validateContent(supported).errors, []);

  // And a line whose record does not exist is reported rather than trusted.
  const dangling = clone(doc);
  byId(dangling.scenes, 's005').dialogue[0].provenanceId = 'pv-nothing-like-this';
  assert.ok(codes(validateContent(dangling).errors).includes('UNKNOWN_REFERENCE'));
});

test('an optional reveal may not be the only route to its detail', () => {
  const doc = loadValidContent();
  const scene = byId(doc.scenes, 's007');
  scene.detailIds = [];
  const { errors } = validateContent(doc);
  assert.ok(codes(errors).includes('INTERACTION_DETAIL_NOT_IN_SCENE'));
});

test('a work that was never opened may not state what it supports', () => {
  const doc = loadValidContent();
  byId(doc.sources, 'R11').supportedClaim = 'A claim drawn from a thread nobody could open.';
  assert.ok(codes(validateContent(doc).errors).includes('UNSUPPORTED_SOURCE_CLAIM'));
});

test('an unreviewed source may not carry an evidence record', () => {
  const doc = loadValidContent();
  const source = byId(doc.sources, 'R17');
  source.reviewStatus = 'unreviewed';
  const index = doc.sources.findIndex((entry) => entry.id === 'R17');
  const reported = codesAt(validateContent(doc).errors, `sources[${index}].evidenceBasis`);
  assert.ok(reported.includes('UNVERIFIED_SOURCE_RECORD'), `got ${reported.join(', ')}`);
});

test('raising a source to a level it cannot support is reported', () => {
  const doc = loadValidContent();
  // A locator record promoted to a full read still has nothing from inside the
  // work; dropping the evidence basis is what the validator can see.
  const source = byId(doc.sources, 'R15');
  source.reviewStatus = 'verified-full';
  source.evidenceBasis = null;
  const { errors } = validateContent(doc);
  assert.ok(errors.some((error) => error.code === 'NOT_A_STRING' && error.path.endsWith('.evidenceBasis')));
});

test('a source destination must be a web address a reader can open', () => {
  for (const url of ['www.example.org/x', 'docs/research.md', 'javascript:alert(1)', 'file:///etc/passwd']) {
    const doc = loadValidContent();
    byId(doc.sources, 'R01').url = url;
    const reported = codesAt(validateContent(doc).errors, 'sources[0].url');
    assert.ok(reported.includes('INVALID_SOURCE_URL'), `${url} should be rejected, got ${reported.join(', ')}`);
  }

  const doc = loadValidContent();
  byId(doc.sources, 'R01').url = 'http://example.org/a-plain-http-destination';
  assert.deepEqual(validateContent(doc).errors, []);
});

/* ---- The artwork a scene asks for -------------------------------------- */

test('a beat may name a drawing or declare that it has none, and nothing else', () => {
  const drawn = loadValidContent();
  const scene = byId(drawn.scenes, 's002');
  assert.equal(typeof scene.visual.artId, 'string', 'the fixture should exercise a drawn beat');

  // Declaring no drawing is a legitimate state: the written description is the
  // text alternative, the print illustration, and the reduced-motion equivalent.
  const undrawn = loadValidContent();
  const fallback = byId(undrawn.scenes, 's002').visual;
  fallback.artId = null;
  fallback.artState = null;
  fallback.artAbsence = 'text-only';
  assert.deepEqual(validateContent(undrawn).errors, []);
});

test('an undrawn beat has to say which kind of undrawn it is', () => {
  const silent = loadValidContent();
  const visual = byId(silent.scenes, 's002').visual;
  visual.artId = null;
  visual.artState = null;
  visual.artAbsence = null;
  assert.ok(codesAt(validateContent(silent).errors, `scenes[${silent.scenes.findIndex((scene) => scene.id === 's002')}].visual.artAbsence`).includes('ART_ABSENCE_UNDECLARED'));

  // And a beat that does have a drawing may not also record a reason for not
  // having one; the two statements would contradict each other.
  const drawn = loadValidContent();
  byId(drawn.scenes, 's002').visual.artAbsence = 'text-only';
  assert.ok(codesAt(validateContent(drawn).errors, `scenes[${drawn.scenes.findIndex((scene) => scene.id === 's002')}].visual.artAbsence`).includes('ART_ABSENCE_DECLARED'));
});

test('finished content may not contain a beat whose drawing is still pending', () => {
  const draft = loadValidContent();
  draft.status.final = false;
  draft.status.notice = 'A draft, with one beat still to be drawn.';
  const visual = byId(draft.scenes, 's002').visual;
  visual.artId = null;
  visual.artState = null;
  visual.artAbsence = 'pending';
  assert.deepEqual(validateContent(draft).errors, [], 'a draft may carry a drawing nobody has made yet');

  const final = clone(draft);
  final.status.final = true;
  assert.ok(codesAt(validateContent(final).errors, `scenes[${final.scenes.findIndex((scene) => scene.id === 's002')}].visual.artAbsence`).includes('PENDING_ART_IN_FINAL_CONTENT'));

  // An intentionally text-only beat is a different statement and stays legal.
  const settled = clone(final);
  byId(settled.scenes, 's002').visual.artAbsence = 'text-only';
  assert.ok(!codes(validateContent(settled).errors).includes('PENDING_ART_IN_FINAL_CONTENT'));
});

/* ---- The order a beat is actually read in ------------------------------ */

test('the main path places every essential block of a beat exactly once', () => {
  const doc = loadValidContent();
  for (const scene of doc.scenes) {
    const expected = scene.narration.length + scene.dialogue.length + scene.limitations.length;
    assert.equal(scene.mainPath.length, expected, `${scene.id} does not place all of its essential blocks`);
  }

  const missing = loadValidContent();
  const scene = byId(missing.scenes, 's010');
  scene.mainPath = scene.mainPath.filter((entry) => entry.kind !== 'limitations');
  assert.ok(codes(validateContent(missing).errors).includes('MAIN_PATH_INCOMPLETE'));
});

test('a main path cannot read a block twice, or read one that is not there', () => {
  const twice = loadValidContent();
  byId(twice.scenes, 's002').mainPath.push({ kind: 'narration', index: 0 });
  assert.ok(codes(validateContent(twice).errors).includes('MAIN_PATH_DUPLICATE'));

  const beyond = loadValidContent();
  byId(beyond.scenes, 's002').mainPath.push({ kind: 'dialogue', index: 0 });
  assert.ok(codes(validateContent(beyond).errors).includes('MAIN_PATH_OUT_OF_RANGE'));

  const nonsense = loadValidContent();
  byId(nonsense.scenes, 's002').mainPath[0].index = -1;
  assert.ok(codes(validateContent(nonsense).errors).includes('MAIN_PATH_INDEX'));

  const unknownKind = loadValidContent();
  byId(unknownKind.scenes, 's002').mainPath[0].kind = 'aside';
  const reported = codes(validateContent(unknownKind).errors);
  assert.ok(reported.includes('INVALID_ENUM'));
  assert.ok(reported.includes('MAIN_PATH_INCOMPLETE'), 'the block it was meant to place is now unread');
});

test('a chapter the reader counts carries its own number', () => {
  const doc = loadValidContent();
  doc.chapters[0].number = 0;
  assert.ok(codesAt(validateContent(doc).errors, 'chapters[0].number').includes('INVALID_CHAPTER_NUMBER'));

  const repeated = loadValidContent();
  repeated.chapters[2].number = repeated.chapters[1].number;
  assert.ok(codesAt(validateContent(repeated).errors, 'chapters[2].number').includes('DUPLICATE_CHAPTER_NUMBER'));

  // An unnumbered chapter is the declared state for an opening that is not one
  // of the questions the essay counts.
  const unnumbered = loadValidContent();
  unnumbered.chapters[0].number = null;
  assert.deepEqual(validateContent(unnumbered).errors, []);
});

test('the landing illustration obeys the same rules as every other drawing', () => {
  const doc = loadValidContent();
  assert.ok(doc.project.visual, 'the landing drawing is part of the content document');

  const unknown = loadValidContent();
  unknown.project.visual.artId = 'art-a-landing-nobody-made';
  assert.ok(codesAt(validateContent(unknown).errors, 'project.visual.artId').includes('UNKNOWN_ART_REFERENCE'));

  const crowded = loadValidContent();
  crowded.project.visual.artId = 'art-two-instruments';
  assert.ok(codesAt(validateContent(crowded).errors, 'project.visual.cast').includes('ART_FIGURE_COUNT'));

  // And it cannot put somebody on the landing who is not in the cast, or give
  // them a state they do not have.
  const invented = loadValidContent();
  invented.project.visual.cast[0].characterId = 'cast-nobody';
  assert.ok(codes(validateContent(invented).errors).includes('UNKNOWN_REFERENCE'));

  const impossible = loadValidContent();
  impossible.project.visual.cast[0].expressionId = 'ex-smug';
  assert.ok(codes(validateContent(impossible).errors).includes('UNKNOWN_EXPRESSION'));
});

test('a scene asking for a drawing that does not exist is reported', () => {
  const doc = loadValidContent();
  byId(doc.scenes, 's007').visual.artId = 'art-a-drawing-nobody-made';
  const reported = codesAt(validateContent(doc).errors, `scenes[${doc.scenes.findIndex((scene) => scene.id === 's007')}].visual.artId`);
  assert.ok(reported.includes('UNKNOWN_ART_REFERENCE'), `got ${reported.join(', ')}`);
});

test('a condition layer may only be asked of a composition that has one', () => {
  const doc = loadValidContent();
  const visual = byId(doc.scenes, 's002').visual;
  visual.artId = 'art-figure-row';
  visual.artState = 'revealed';
  const reported = codesAt(validateContent(doc).errors, `scenes[${doc.scenes.findIndex((scene) => scene.id === 's002')}].visual.artState`);
  assert.ok(reported.includes('ART_STATE_UNAVAILABLE'), `got ${reported.join(', ')}`);

  // And a beat with no drawing cannot claim a settled state either.
  const undrawn = loadValidContent();
  const other = byId(undrawn.scenes, 's002').visual;
  other.artId = null;
  assert.ok(codes(validateContent(undrawn).errors).includes('ART_STATE_UNAVAILABLE'));
});

test('a composition is never handed more figures than it can place', () => {
  const doc = loadValidContent();
  const visual = byId(doc.scenes, 's002').visual;
  visual.artId = 'art-two-instruments';
  visual.artState = 'revealed';
  const reported = codesAt(validateContent(doc).errors, `scenes[${doc.scenes.findIndex((scene) => scene.id === 's002')}].visual.cast`);
  assert.ok(reported.includes('ART_FIGURE_COUNT'), `got ${reported.join(', ')}`);
});

test('a contributor may not be drawn as an invented friend, or the reverse', () => {
  const doc = loadValidContent();
  byId(doc.cast, 'cast-tj').artId = 'bob';
  const reported = codesAt(validateContent(doc).errors, 'cast[0].artId');  // cast-tj is first
  assert.ok(reported.includes('ART_ROLE_MISMATCH'), `got ${reported.join(', ')}`);

  const friend = loadValidContent();
  byId(friend.cast, 'cast-bob').artId = 'tj';
  assert.ok(codes(validateContent(friend).errors).includes('ART_ROLE_MISMATCH'));

  // The unnamed outline belongs to the drawings, not to anyone in the cast.
  const unnamed = loadValidContent();
  byId(unnamed.cast, 'cast-bob').artId = 'unnamed';
  assert.ok(codes(validateContent(unnamed).errors).includes('ART_ROLE_MISMATCH'));
});

test('an expression must name a state the artwork can actually draw', () => {
  const doc = loadValidContent();
  byId(doc.cast, 'cast-koj').expressions[0].artId = 'delighted';
  const reported = codesAt(validateContent(doc).errors, 'cast[1].expressions[0].artId');  // cast-koj is second
  assert.ok(reported.includes('UNKNOWN_ART_REFERENCE'), `got ${reported.join(', ')}`);
});

test('a misspelled field is reported instead of being ignored', () => {
  const doc = loadValidContent();
  doc.scenes[0].naration = ['typo'];
  const { errors } = validateContent(doc);
  assert.ok(codesAt(errors, 'scenes[0].naration').includes('UNKNOWN_FIELD'));
});

test('non-object and non-JSON-shaped input is rejected without throwing', () => {
  for (const input of [null, 'a string', 42, []]) {
    const { valid, errors } = validateContent(input);
    assert.equal(valid, false);
    assert.ok(errors.length > 0);
  }
});
