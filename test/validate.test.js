/**
 * The validator, proved by breaking things.
 *
 * A validator that only ever sees a correct document proves nothing. Each
 * check below takes the real content document, breaks exactly one thing in a
 * way a careless edit or a drifting transfer would, and asserts the error that
 * names it. The guarantees are the ones everything downstream leans on: the
 * approved structure, citations that resolve, source identities and audit
 * levels that were not quietly changed, and drawings that were really
 * delivered with alternative text.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { validateContent, formatErrors } from '../src/content/validate.js';
import { loadValidContent, clone, codes, codesAt } from './helpers.js';

/** The real document with exactly one thing broken, and the errors it earns. */
const broken = (mutate) => {
  const doc = loadValidContent();
  mutate(doc);
  return validateContent(doc).errors;
};

const scene = (doc, id) => doc.scenes.find((entry) => entry.id === id);

test('the authored document is valid', () => {
  const { valid, errors } = validateContent(loadValidContent());
  assert.equal(valid, true, formatErrors(errors));
  assert.deepEqual(errors, []);
});

test('a document of the wrong shape is rejected before anything else', () => {
  for (const value of [null, 'content', 42, []]) {
    assert.equal(validateContent(value).valid, false);
  }
  assert.ok(codes(broken((doc) => { doc.schema = 'happiness-essay-content/v2'; })).includes('UNKNOWN_SCHEMA'));
  assert.ok(codes(broken((doc) => { delete doc.source; })).includes('MISSING_SOURCE'));
  assert.ok(codes(broken((doc) => { delete doc.source.handoff; })).includes('MISSING_SOURCE'));
});

/* --- Structure ---------------------------------------------------------- */

test('the approved part and chapter counts are fixed', () => {
  assert.ok(codes(broken((doc) => { doc.scenes.pop(); })).includes('SCENE_COUNT'));
  assert.ok(codes(broken((doc) => { doc.chapters.pop(); })).includes('CHAPTER_COUNT'));
});

test('the landing must open the first part of the first chapter', () => {
  // The approved essay sets no fixed chapter anchors -- a chapter starts
  // wherever its first part is -- so what has to hold is that Begin opens
  // the part a reader would otherwise reach first.
  const result = broken((doc) => {
    const chapter = doc.chapters[0];
    chapter.sceneIds = [...chapter.sceneIds.slice(1), chapter.sceneIds[0]];
  });
  assert.ok(codes(result).includes('ANCHOR_MISMATCH'));
});

test('scenes must stay in their authored reading order', () => {
  const result = broken((doc) => {
    const chapter = doc.chapters[0];
    chapter.sceneIds = [...chapter.sceneIds].reverse();
  });
  // Reversing a chapter moves its anchor and breaks the authored order; both
  // are reported, because either alone would be a real change to the argument.
  assert.ok(codes(result).includes('READING_ORDER'));
});

test('a scene in no chapter is unreachable, and one in two chapters is ambiguous', () => {
  assert.ok(codes(broken((doc) => {
    doc.chapters[0].sceneIds = doc.chapters[0].sceneIds.filter((id) => id !== 's202');
  })).includes('SCENE_UNREACHABLE'));

  assert.ok(codes(broken((doc) => {
    doc.chapters[1].sceneIds.push('s201');
  })).includes('SCENE_ASSIGNED_TWICE'));
});

test('a scene that names a chapter which does not list it is reported', () => {
  assert.ok(codes(broken((doc) => { scene(doc, 's202').chapterId = 'c5'; })).includes('CHAPTER_MISMATCH'));
});

test('identifiers keep their historical form', () => {
  assert.ok(codesAt(broken((doc) => { doc.scenes[0].id = 'opening'; }), '.scenes[0].id').includes('INVALID_ID'));
  assert.ok(codes(broken((doc) => { doc.scenes[1].id = 's201'; })).includes('DUPLICATE_ID'));
});

/* --- Reader copy -------------------------------------------------------- */

test('a block is narration or one of the three named speakers', () => {
  assert.ok(codes(broken((doc) => { scene(doc, 's201').blocks[1].speaker = 'Bob'; })).includes('UNKNOWN_SPEAKER'));
  assert.ok(codes(broken((doc) => { scene(doc, 's201').blocks[0].speaker = 'Narrator'; })).includes('NARRATOR_IS_UNLABELLED'));
  assert.ok(codes(broken((doc) => { scene(doc, 's201').blocks[0].kind = 'caption'; })).includes('UNKNOWN_KIND'));
});

test('an empty scene or an empty block is rejected', () => {
  assert.ok(codes(broken((doc) => { scene(doc, 's202').blocks = []; })).includes('EMPTY_SCENE'));
  assert.ok(codes(broken((doc) => { scene(doc, 's202').blocks[0].parts = []; })).includes('EMPTY_BLOCK'));
  assert.ok(codes(broken((doc) => { scene(doc, 's202').blocks[0].parts = [{ citation: 1 }]; })).includes('CITATION_ONLY'));
});

test('a part is text or a citation, never both', () => {
  assert.ok(codes(broken((doc) => {
    scene(doc, 's204').blocks[0].parts[0] = { text: 'both', citation: 1 };
  })).includes('AMBIGUOUS_PART'));
});

/* --- Citations and sources ---------------------------------------------- */

test('a citation with no register entry is reported, and so is an entry nothing cites', () => {
  assert.ok(codes(broken((doc) => {
    scene(doc, 's204').blocks[0].parts.push({ citation: 99 });
  })).includes('DANGLING_CITATION'));

  assert.ok(codes(broken((doc) => {
    for (const entry of doc.scenes) {
      for (const block of entry.blocks) {
        block.parts = block.parts.filter((part) => part.citation !== 26);
      }
    }
  })).includes('UNCITED_SOURCE'));
});

test('register entries are numbered by first appearance', () => {
  const result = broken((doc) => {
    const sources = doc.sourcesPage.sources;
    [sources[0], sources[1]] = [sources[1], sources[0]];
  });
  assert.ok(codes(result).includes('OUT_OF_ORDER'));
});

test('a source keeps its R identity, its destination and its audit level', () => {
  assert.ok(codes(broken((doc) => { doc.sourcesPage.sources[0].sourceId = 'Kahneman'; })).includes('INVALID_SOURCE_ID'));
  assert.ok(codes(broken((doc) => { doc.sourcesPage.sources[0].url = 'pnas.org'; })).includes('INVALID_URL'));
  assert.ok(codes(broken((doc) => { doc.sourcesPage.sources[1].sourceId = 'R02'; })).includes('DUPLICATE_SOURCE_ID'));

  // An abstract is not a full reading, and an invented level would let one
  // read as the other.
  assert.ok(codes(broken((doc) => {
    doc.sourcesPage.sources[7].auditStatus = 'verified-everything';
  })).includes('UNKNOWN_AUDIT_STATUS'));
});

test('a citation label and its accessible name must match its number', () => {
  assert.ok(codes(broken((doc) => { doc.sourcesPage.sources[0].label = '1'; })).includes('LABEL_MISMATCH'));
  assert.ok(codes(broken((doc) => { doc.sourcesPage.sources[0].accessibleName = 'Reference 1'; })).includes('NAME_MISMATCH'));
});

test('an entry without its access note is rejected', () => {
  assert.ok(codes(broken((doc) => { doc.sourcesPage.sources[9].note = []; })).includes('MISSING_TEXT'));
});

/* --- Artwork ------------------------------------------------------------ */

test('a scene cannot show a drawing that was never delivered', () => {
  assert.ok(codes(broken((doc) => { scene(doc, 's201').visual.views[0].ref = 'A99'; })).includes('UNKNOWN_ASSET'));
  assert.ok(codes(broken((doc) => { scene(doc, 's201').visual.views[0].image = 4; })).includes('UNKNOWN_IMAGE'));
});

test('a text scene carries no decorative substitute', () => {
  assert.ok(codes(broken((doc) => {
    scene(doc, 's202').visual.views = [{ ref: 'A01', image: 0, label: null }];
  })).includes('TEXT_SCENE_HAS_ART'));
});

test('a pair shows two labelled drawings and is never optional', () => {
  assert.ok(codes(broken((doc) => { scene(doc, 's208').visual.views.pop(); })).includes('PAIR_NEEDS_TWO'));
  assert.ok(codes(broken((doc) => { scene(doc, 's208').visual.views[1].label = null; })).includes('PAIR_NEEDS_LABELS'));
  assert.ok(codes(broken((doc) => {
    scene(doc, 's208').visual.control = { labels: ['Chosen effort', 'Required work'] };
  })).includes('PAIR_IS_NOT_OPTIONAL'));
});

test('an optional comparison needs two drawn states with the approved labels', () => {
  assert.ok(codes(broken((doc) => {
    scene(doc, 's213').visual.control.labels = ['Connection'];
  })).includes('INVALID_CONTROL'));
  assert.ok(codes(broken((doc) => {
    scene(doc, 's213').visual.control.labels = ['Connection', 'Something else'];
  })).includes('CONTROL_LABEL_MISMATCH'));
});

test('a drawing cannot follow a block the scene does not have', () => {
  assert.ok(codes(broken((doc) => { scene(doc, 's201').visual.afterBlock = 99; })).includes('PLACEMENT_PAST_END'));
  assert.ok(codes(broken((doc) => { scene(doc, 's201').visual.afterBlock = -1; })).includes('INVALID_PLACEMENT'));
});

test('a delivered asset must carry alternative text, dimensions and a checksum', () => {
  assert.ok(codes(broken((doc) => { doc.assets[0].images[0].alt = ''; })).includes('MISSING_ALT'));
  assert.ok(codes(broken((doc) => { doc.assets[0].images[0].width = 0; })).includes('INVALID_DIMENSION'));
  assert.ok(codes(broken((doc) => { doc.assets[0].images[0].sha256 = 'abc'; })).includes('INVALID_CHECKSUM'));
});

test('an asset cannot serve a file from another asset folder', () => {
  assert.ok(codes(broken((doc) => {
    doc.assets[1].images[0].path = 'assets/generated/rewrite-opening-v1/opening.png';
  })).includes('FOREIGN_ASSET'));
});

test('both manifest generations are named, and an unknown one is refused', () => {
  const doc = loadValidContent();
  const generations = new Set(doc.assets.map((asset) => asset.manifestGeneration));
  assert.deepEqual([...generations].sort(), ['a01', 'a02-a18']);
  assert.ok(codes(broken((entry) => { entry.assets[0].manifestGeneration = 'skipped'; })).includes('UNKNOWN_GENERATION'));
});

test('a label anchor outside its image box is rejected', () => {
  assert.ok(codes(broken((doc) => { doc.assets[0].labels[0].x = 1.4; })).includes('INVALID_ANCHOR'));
});

/* --- Landing and interface ---------------------------------------------- */

test('the landing opens the first scene and carries the approved strings', () => {
  assert.ok(codes(broken((doc) => { doc.landing.beginSceneId = 's204'; })).includes('ANCHOR_MISMATCH'));
  assert.ok(codes(broken((doc) => { doc.landing.beginSceneId = 's999'; })).includes('UNKNOWN_SCENE'));
  assert.ok(codes(broken((doc) => { doc.landing.title = ''; })).includes('MISSING_TEXT'));
});

test('the landing has no field for a subtitle, a byline or a reading time', () => {
  const doc = loadValidContent();
  for (const field of ['subtitle', 'summary', 'byline', 'readingTimeEstimate', 'progress']) {
    assert.equal(doc.landing[field], undefined, `the landing still carries ${field}`);
  }
  // Adding one does not make it render; nothing reads it. The check that
  // matters is that the renderer has no such copy to show, which
  // test/render.test.js asserts against the markup.
});

test('every approved interface string is required', () => {
  for (const key of ['begin', 'sources', 'chapters', 'closeChapters', 'hideChapters', 'showChapters',
    'continuous', 'partView', 'skip', 'back', 'next', 'readAgain', 'backToReading']) {
    assert.ok(codes(broken((doc) => { doc.interface[key] = ''; })).includes('MISSING_TEXT'), `interface.${key}`);
  }
});

test('the measurement rule is required alongside the number', () => {
  assert.ok(codes(broken((doc) => { delete doc.measure.rule; })).includes('MISSING_RULE'));
  assert.ok(codes(broken((doc) => { delete doc.measure; })).includes('MISSING_MEASURE'));
});

test('errors are collected rather than thrown at the first one', () => {
  const errors = broken((doc) => {
    doc.scenes[0].title = '';
    doc.scenes[1].title = '';
    doc.landing.title = '';
  });
  assert.ok(errors.length >= 3);
  assert.match(formatErrors(errors), /\.scenes\[0\]\.title {2}MISSING_TEXT/);
});

test('a deep copy of the document validates the same way', () => {
  assert.deepEqual(validateContent(clone(loadValidContent())).errors, []);
});
