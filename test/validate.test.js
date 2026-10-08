import test from 'node:test';
import assert from 'node:assert/strict';

import { validateContent } from '../src/content/validate.js';
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

test('the fixture states no contributor position and no audited claim', () => {
  const doc = loadValidContent();
  for (const scene of doc.scenes) {
    for (const line of scene.dialogue) {
      assert.equal(line.stance, 'fictional-illustration', `${line.id} would attribute a position to a contributor`);
    }
  }
  for (const source of doc.sources) {
    assert.equal(source.reviewStatus, 'unreviewed');
    assert.equal(source.citation, null);
    assert.equal(source.supportedClaim, null);
  }
  for (const concept of doc.concepts) {
    assert.equal(concept.status, 'planned');
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
    'UNVERIFIED_SOURCE_CLAIM',
    'UNDRAFTED_CONCEPT_TEXT',
    'INTERACTION_DETAIL_NOT_IN_SCENE',
    'ENTRY_CLAIMED_TWICE',
    'UNUSED_ENTRY',
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

test('a source may record a citation and a supported claim only once it is verified', () => {
  const doc = loadValidContent();
  const source = byId(doc.sources, 'R02');
  source.supportedClaim = 'A claim written before the paper was read.';
  assert.ok(codes(validateContent(clone(doc)).errors).includes('UNVERIFIED_SOURCE_CLAIM'));

  const verified = clone(doc);
  const verifiedSource = byId(verified.sources, 'R02');
  verifiedSource.reviewStatus = 'verified';
  verifiedSource.citation = 'Example citation recorded after reading the passage.';
  verifiedSource.supportedClaim = 'The exact statement the passage supports.';
  assert.deepEqual(validateContent(verified).errors, []);
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
