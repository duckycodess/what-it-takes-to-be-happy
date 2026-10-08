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

test('the shipped content document is explicitly marked non-final', () => {
  const doc = loadValidContent();
  assert.equal(doc.status.final, false);
  assert.match(doc.status.notice, /\S/);
  assert.equal(doc.project.readingTimeEstimate, null, 'a reading time may only be recorded once real prose can be measured');
});

test('the fixture states no contributor position and no undrafted concept treatment', () => {
  const doc = loadValidContent();
  for (const scene of doc.scenes) {
    for (const line of scene.dialogue) {
      assert.equal(line.stance, 'fictional-illustration', `${line.id} would attribute a position to a contributor`);
    }
  }
  for (const concept of doc.concepts) {
    assert.equal(concept.status, 'planned');
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
  const chapter = byId(doc.chapters, 'ch-what-counts');
  chapter.sceneIds = chapter.sceneIds.filter((id) => id !== 'sc-three-readings');
  const { errors } = validateContent(doc);
  assert.ok(codes(errors).includes('SCENE_ORPHANED'));
});

test('a chapter that orders a scene belonging to another chapter is reported', () => {
  const doc = loadValidContent();
  byId(doc.chapters, 'ch-meaningful-or-not').sceneIds.push('sc-three-readings');
  const { errors } = validateContent(doc);
  assert.ok(codes(errors).includes('SCENE_CLAIMED_TWICE'));
});

test('an unknown speaker is reported against the dialogue line', () => {
  const doc = loadValidContent();
  byId(doc.scenes, 'sc-chosen-difficulty').dialogue[0].speakerId = 'cast-nobody';
  const { errors } = validateContent(doc);
  assert.ok(codesAt(errors, 'scenes[2].dialogue[0].speakerId').includes('UNKNOWN_REFERENCE'));
});

test('an expression a character does not have is reported with the available list', () => {
  const doc = loadValidContent();
  byId(doc.scenes, 'sc-ordinary-afternoon').visual.cast[0].expressionId = 'ex-smug';
  const { errors } = validateContent(doc);
  const reported = errors.find((error) => error.code === 'UNKNOWN_EXPRESSION');
  assert.ok(reported, 'expected UNKNOWN_EXPRESSION');
  assert.match(reported.message, /ex-joy/, 'the error should list what the character can express');
});

test('a scene whose essential narration is empty is reported', () => {
  const doc = loadValidContent();
  byId(doc.scenes, 'sc-rest-without-a-reason').narration = ['  '];
  const { errors } = validateContent(doc);
  assert.ok(codes(errors).includes('EMPTY_ESSENTIAL_SCENE'));
});

test('a line spoken as a contributor position needs recorded provenance', () => {
  const doc = loadValidContent();
  const line = byId(doc.scenes, 'sc-chosen-difficulty').dialogue[0];
  line.stance = 'member-endorsed';
  line.speakerId = 'cast-tj';

  const broken = validateContent(clone(doc));
  assert.ok(codes(broken.errors).includes('UNSUPPORTED_MEMBER_POSITION'));

  // The same line becomes valid once a provenance record backs it, so the
  // contract supports real member dialogue without inventing any here.
  const supported = clone(doc);
  supported.provenance.push({
    id: 'pv-example-endorsement',
    appliesTo: 'dl-bob-tired-and-pleased',
    note: 'Authoring record, not published.',
    sourceNote: 'docs/notes/example.md',
  });
  byId(supported.scenes, 'sc-chosen-difficulty').dialogue[0].provenanceId = 'pv-example-endorsement';
  assert.deepEqual(validateContent(supported).errors, []);
});

test('an optional reveal may not be the only route to its detail', () => {
  const doc = loadValidContent();
  const scene = byId(doc.scenes, 'sc-three-readings');
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
  const reported = codesAt(validateContent(doc).errors, 'sources[5].evidenceBasis');
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
  const scene = byId(drawn.scenes, 'sc-ordinary-afternoon');
  assert.equal(typeof scene.visual.artId, 'string', 'the fixture should exercise a drawn beat');

  // Declaring no drawing is a legitimate state: the written description is the
  // text alternative, the print illustration, and the reduced-motion equivalent.
  const undrawn = loadValidContent();
  const fallback = byId(undrawn.scenes, 'sc-ordinary-afternoon').visual;
  fallback.artId = null;
  fallback.artState = null;
  assert.deepEqual(validateContent(undrawn).errors, []);
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
  byId(doc.scenes, 'sc-three-readings').visual.artId = 'art-a-drawing-nobody-made';
  const reported = codesAt(validateContent(doc).errors, 'scenes[1].visual.artId');
  assert.ok(reported.includes('UNKNOWN_ART_REFERENCE'), `got ${reported.join(', ')}`);
});

test('a condition layer may only be asked of a composition that has one', () => {
  const doc = loadValidContent();
  const visual = byId(doc.scenes, 'sc-ordinary-afternoon').visual;
  visual.artId = 'art-figure-row';
  visual.artState = 'revealed';
  const reported = codesAt(validateContent(doc).errors, 'scenes[0].visual.artState');
  assert.ok(reported.includes('ART_STATE_UNAVAILABLE'), `got ${reported.join(', ')}`);

  // And a beat with no drawing cannot claim a settled state either.
  const undrawn = loadValidContent();
  const other = byId(undrawn.scenes, 'sc-ordinary-afternoon').visual;
  other.artId = null;
  assert.ok(codes(validateContent(undrawn).errors).includes('ART_STATE_UNAVAILABLE'));
});

test('a composition is never handed more figures than it can place', () => {
  const doc = loadValidContent();
  const visual = byId(doc.scenes, 'sc-ordinary-afternoon').visual;
  visual.artId = 'art-two-instruments';
  visual.artState = 'revealed';
  const reported = codesAt(validateContent(doc).errors, 'scenes[0].visual.cast');
  assert.ok(reported.includes('ART_FIGURE_COUNT'), `got ${reported.join(', ')}`);
});

test('a contributor may not be drawn as an invented friend, or the reverse', () => {
  const doc = loadValidContent();
  byId(doc.cast, 'cast-tj').artId = 'bob';
  const reported = codesAt(validateContent(doc).errors, 'cast[0].artId');
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
  const reported = codesAt(validateContent(doc).errors, 'cast[1].expressions[0].artId');
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
