/**
 * Validation for a content document.
 *
 * The document is transferred from the approved essay rather than
 * hand-written, so these checks are not spelling corrections for an editor.
 * They are the guarantees everything downstream depends on: that the 31 parts
 * are present in the approved order under their chapters, that every published
 * address still relocates to a part, that every citation resolves to a
 * register entry whose audit status and R identity were not quietly changed,
 * that every drawing a part asks for was actually delivered with alternative
 * text, and that the interface strings are the approved ones. A build refuses
 * to publish a document that fails any of them.
 *
 * Errors are collected rather than thrown: an editor fixing a document wants
 * the whole list, not the first line of it.
 */

import {
  SCHEMA_ID,
  LAYOUTS,
  SPEAKERS,
  BLOCK_KINDS,
  SCENE_ID_PATTERN,
  PART_KEY_PATTERN,
  FIRST_PART_NUMBER,
  CHAPTER_ID_PATTERN,
  ASSET_REF_PATTERN,
  ASSET_ID_PATTERN,
  SOURCE_URL_PATTERN,
  SOURCE_ID_PATTERN,
  SOURCE_AUDIT_LEVELS,
  MANIFEST_GENERATIONS,
  LABEL_KINDS,
  INTERFACE_KEYS,
  SOURCES_PAGE_KEYS,
  SCENE_COUNT,
  CHAPTER_COUNT,
  SOURCE_COUNT,
  RELOCATION_COUNT,
} from './schema.js';

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value) => typeof value === 'string' && value.trim().length > 0;

class Errors {
  constructor() {
    this.list = [];
  }

  add(path, code, message) {
    this.list.push({ path, code, message });
    return false;
  }

  /** Records a missing or empty string and reports whether one was there. */
  text(path, value, code = 'MISSING_TEXT') {
    return isText(value) ? true : this.add(path, code, 'must be a non-empty string');
  }

  list_(path, value) {
    return Array.isArray(value) ? true : this.add(path, 'NOT_A_LIST', 'must be an array');
  }
}

/* --------------------------------------------------------------------------
 * Reader copy
 * ----------------------------------------------------------------------- */

/**
 * A block is narration or one speaker's line, and its text is a list of parts
 * so a citation can sit mid-paragraph without the paragraph being split into
 * two. Both halves are checked: a part is either text or a citation, never
 * both and never neither, and a dialogue block names one of the three fixed
 * speakers while a narrator block names nobody.
 */
function checkBlock(errors, path, block, cited) {
  if (!isObject(block)) return errors.add(path, 'NOT_AN_OBJECT', 'must be an object');

  if (!BLOCK_KINDS.includes(block.kind)) {
    errors.add(`${path}.kind`, 'UNKNOWN_KIND', `must be one of ${BLOCK_KINDS.join(', ')}`);
  }
  if (block.kind === 'dialogue') {
    if (!SPEAKERS.includes(block.speaker)) {
      errors.add(`${path}.speaker`, 'UNKNOWN_SPEAKER', `must be one of ${SPEAKERS.join(', ')}`);
    }
  } else if (block.speaker !== null) {
    errors.add(`${path}.speaker`, 'NARRATOR_IS_UNLABELLED', 'narration carries no visible speaker label');
  }

  if (!errors.list_(`${path}.parts`, block.parts)) return false;
  if (block.parts.length === 0) {
    return errors.add(`${path}.parts`, 'EMPTY_BLOCK', 'a block must carry text');
  }

  let hasText = false;
  block.parts.forEach((part, index) => {
    const at = `${path}.parts[${index}]`;
    if (!isObject(part)) return errors.add(at, 'NOT_AN_OBJECT', 'must be an object');
    const isCitation = part.citation !== undefined;
    if (isCitation && part.text !== undefined) {
      return errors.add(at, 'AMBIGUOUS_PART', 'a part is either text or a citation, not both');
    }
    if (isCitation) {
      if (!Number.isInteger(part.citation) || part.citation < 1) {
        return errors.add(`${at}.citation`, 'INVALID_CITATION', 'must be a positive whole number');
      }
      cited.add(part.citation);
      return true;
    }
    if (typeof part.text !== 'string' || part.text.length === 0) {
      return errors.add(`${at}.text`, 'MISSING_TEXT', 'must be a non-empty string');
    }
    hasText = true;
    return true;
  });

  if (!hasText) errors.add(`${path}.parts`, 'CITATION_ONLY', 'a block cannot be citation markers alone');
  return true;
}

/* --------------------------------------------------------------------------
 * Artwork
 * ----------------------------------------------------------------------- */

/**
 * A visual names the layout, the drawings it shows and the exact label on
 * each. The contract the approved script sets is enforced here rather than in
 * the renderer: a text part carries no drawing, a pair carries two labelled
 * views, an optional comparison carries two states with the approved labels,
 * and a supporting drawing is exactly one unlabelled cutout.
 */
function checkVisual(errors, path, visual, assetsByRef, options = {}) {
  if (!isObject(visual)) return errors.add(path, 'NOT_AN_OBJECT', 'must be an object');

  if (!LAYOUTS.includes(visual.layout)) {
    errors.add(`${path}.layout`, 'UNKNOWN_LAYOUT', `must be one of ${LAYOUTS.join(', ')}`);
  }
  if (!errors.list_(`${path}.views`, visual.views)) return false;

  visual.views.forEach((view, index) => {
    const at = `${path}.views[${index}]`;
    if (!isObject(view)) return errors.add(at, 'NOT_AN_OBJECT', 'must be an object');
    const asset = assetsByRef.get(view.ref);
    if (!asset) return errors.add(`${at}.ref`, 'UNKNOWN_ASSET', `no delivered asset is registered as ${view.ref}`);
    if (!Number.isInteger(view.image) || !asset.images[view.image]) {
      return errors.add(`${at}.image`, 'UNKNOWN_IMAGE', `${view.ref} has no image at index ${view.image}`);
    }
    if (view.label !== null && !isText(view.label)) {
      return errors.add(`${at}.label`, 'MISSING_TEXT', 'a view label is either absent or a non-empty string');
    }
    return true;
  });

  if (visual.layout === 'text' && visual.views.length > 0) {
    errors.add(`${path}.views`, 'TEXT_SCENE_HAS_ART', 'a text scene carries no drawing');
  }
  if (visual.layout === 'pair') {
    if (visual.views.length !== 2) {
      errors.add(`${path}.views`, 'PAIR_NEEDS_TWO', 'a pair shows exactly two drawings');
    }
    if (visual.views.some((view) => !isText(view.label))) {
      errors.add(`${path}.views`, 'PAIR_NEEDS_LABELS', 'each view of a pair carries its exact approved label');
    }
    if (visual.control !== null) {
      errors.add(`${path}.control`, 'PAIR_IS_NOT_OPTIONAL', 'a pair shows both drawings and has no control');
    }
  }
  if (visual.control !== null) {
    if (!isObject(visual.control) || !Array.isArray(visual.control.labels) || visual.control.labels.length !== 2) {
      errors.add(`${path}.control`, 'INVALID_CONTROL', 'an optional comparison carries exactly two state labels');
    } else if (visual.views.length !== 2) {
      errors.add(`${path}.views`, 'CONTROL_NEEDS_TWO_STATES', 'an optional comparison switches between two drawn states');
    } else if (visual.control.labels.some((label, index) => label !== visual.views[index].label)) {
      errors.add(`${path}.control.labels`, 'CONTROL_LABEL_MISMATCH', 'each control label names its own drawn state');
    }
  }
  if (visual.layout === 'comparison' && visual.control === null) {
    errors.add(`${path}.control`, 'COMPARISON_NEEDS_CONTROL', 'a comparison switches between its two states');
  }
  if (visual.layout === 'support') {
    if (visual.views.length !== 1) {
      errors.add(`${path}.views`, 'SUPPORT_NEEDS_ONE', 'a supporting drawing is one cutout');
    }
    if (visual.control !== null) {
      errors.add(`${path}.control`, 'SUPPORT_IS_NOT_OPTIONAL', 'a supporting drawing has nothing to switch');
    }
  }
  if (!Number.isInteger(visual.afterBlock) || visual.afterBlock < 0) {
    errors.add(`${path}.afterBlock`, 'INVALID_PLACEMENT', 'must be the whole number of blocks the drawing follows');
  } else if (options.anchored !== false && visual.layout !== 'text' && visual.afterBlock < 1) {
    // The approved layout rule is that a drawing supports the passage it
    // follows. One that opened a part would have nothing to support. The
    // landing is the exception and says so: it has no paragraphs, and its
    // opening illustration is the first thing a reader meets.
    errors.add(`${path}.afterBlock`, 'ART_BEFORE_ITS_PASSAGE',
      'a drawing follows the paragraph it belongs to');
  }
  return true;
}

/**
 * A delivered asset: where its files are, what each one says in words, and
 * where its browser labels are anchored.
 *
 * Both manifest generations arrive here with the same fields. A01 was
 * inspected first and records one vertical anchor per width for all its names;
 * A02–A18 record one per anchor. The transfer normalises them, and this check
 * runs over both rather than exempting the older one.
 */
function checkAsset(errors, path, asset) {
  if (!isObject(asset)) return errors.add(path, 'NOT_AN_OBJECT', 'must be an object');

  if (!ASSET_REF_PATTERN.test(asset.ref ?? '')) {
    errors.add(`${path}.ref`, 'INVALID_REF', 'must be an approved brief reference such as A09a');
  }
  if (!ASSET_ID_PATTERN.test(asset.id ?? '')) {
    errors.add(`${path}.id`, 'INVALID_ID', 'must be the generated asset folder name');
  }
  if (!MANIFEST_GENERATIONS.includes(asset.manifestGeneration)) {
    errors.add(`${path}.manifestGeneration`, 'UNKNOWN_GENERATION',
      `must be one of ${MANIFEST_GENERATIONS.join(', ')}; both are handled, neither is skipped`);
  }
  errors.text(`${path}.assetBranch`, asset.assetBranch);

  if (errors.list_(`${path}.images`, asset.images)) {
    if (asset.images.length === 0) errors.add(`${path}.images`, 'NO_IMAGE', 'a delivered asset has at least one selected image');
    asset.images.forEach((image, index) => {
      const at = `${path}.images[${index}]`;
      if (!isObject(image)) return errors.add(at, 'NOT_AN_OBJECT', 'must be an object');
      if (!/^assets\/generated\/[^/]+\/[^/]+\.png$/.test(image.path ?? '')) {
        errors.add(`${at}.path`, 'INVALID_PATH', 'must point at a selected PNG under assets/generated/');
      }
      if (image.path && !image.path.startsWith(`assets/generated/${asset.id}/`)) {
        errors.add(`${at}.path`, 'FOREIGN_ASSET', `must live in this asset's own folder`);
      }
      for (const dimension of ['width', 'height']) {
        if (!Number.isInteger(image[dimension]) || image[dimension] <= 0) {
          errors.add(`${at}.${dimension}`, 'INVALID_DIMENSION', 'must be a positive whole number of pixels');
        }
      }
      if (!/^[0-9a-f]{64}$/.test(image.sha256 ?? '')) {
        errors.add(`${at}.sha256`, 'INVALID_CHECKSUM', 'must be the inspected SHA-256 of the selected file');
      }
      // Alternative text is the approved per-cutout string. A drawing with
      // none would be a drawing a reader who cannot see it is never told about.
      errors.text(`${at}.alt`, image.alt, 'MISSING_ALT');
      return true;
    });
  }

  if (errors.list_(`${path}.labels`, asset.labels)) {
    asset.labels.forEach((label, index) => {
      const at = `${path}.labels[${index}]`;
      if (!isObject(label)) return errors.add(at, 'NOT_AN_OBJECT', 'must be an object');
      if (!LABEL_KINDS.includes(label.kind)) {
        errors.add(`${at}.kind`, 'UNKNOWN_LABEL_KIND', `must be one of ${LABEL_KINDS.join(', ')}`);
      }
      errors.text(`${at}.text`, label.text);
      for (const axis of ['x', 'yDesktop', 'yPhone']) {
        if (typeof label[axis] !== 'number' || label[axis] < 0 || label[axis] > 1) {
          errors.add(`${at}.${axis}`, 'INVALID_ANCHOR', 'must be a fraction of the image box between 0 and 1');
        }
      }
      return true;
    });
  }
  return true;
}

/* --------------------------------------------------------------------------
 * Sources
 * ----------------------------------------------------------------------- */

/** A run of parts that may carry links, as the approved page copy does. */
function checkRichText(errors, path, parts) {
  if (!errors.list_(path, parts)) return false;
  if (parts.length === 0) return errors.add(path, 'MISSING_TEXT', 'must carry the approved copy');
  parts.forEach((part, index) => {
    const at = `${path}[${index}]`;
    if (!isObject(part)) return errors.add(at, 'NOT_AN_OBJECT', 'must be an object');
    if (part.link !== undefined) {
      errors.text(`${at}.link`, part.link);
      if (!SOURCE_URL_PATTERN.test(part.url ?? '')) {
        errors.add(`${at}.url`, 'INVALID_URL', 'must be an http(s) destination');
      }
      return true;
    }
    if (typeof part.text !== 'string' || part.text.length === 0) {
      return errors.add(`${at}.text`, 'MISSING_TEXT', 'must be a non-empty string');
    }
    return true;
  });
  return true;
}

function checkSource(errors, path, source, expectedNumber) {
  if (!isObject(source)) return errors.add(path, 'NOT_AN_OBJECT', 'must be an object');

  if (source.number !== expectedNumber) {
    errors.add(`${path}.number`, 'OUT_OF_ORDER',
      `register entries are numbered by first appearance; expected ${expectedNumber}`);
  }
  if (!SOURCE_ID_PATTERN.test(source.sourceId ?? '')) {
    errors.add(`${path}.sourceId`, 'INVALID_SOURCE_ID', 'must keep its existing R identifier');
  }
  if (!SOURCE_AUDIT_LEVELS.includes(source.auditStatus)) {
    errors.add(`${path}.auditStatus`, 'UNKNOWN_AUDIT_STATUS',
      `must be one of ${SOURCE_AUDIT_LEVELS.join(', ')}; an abstract is not a full reading`);
  }
  if (source.label !== `[${source.number}]`) {
    errors.add(`${path}.label`, 'LABEL_MISMATCH', 'the visible label is the entry number in square brackets');
  }
  if (source.accessibleName !== `Source ${source.number}`) {
    errors.add(`${path}.accessibleName`, 'NAME_MISMATCH', 'the accessible name is "Source" and the entry number');
  }
  errors.text(`${path}.citation`, source.citation);
  if (!SOURCE_URL_PATTERN.test(source.url ?? '')) {
    errors.add(`${path}.url`, 'INVALID_URL', 'must be an http(s) destination');
  }
  // Every entry states what was actually opened. Without it an abstract and a
  // full reading look the same on the page.
  checkRichText(errors, `${path}.note`, source.note);
  return true;
}

/* --------------------------------------------------------------------------
 * The document
 * ----------------------------------------------------------------------- */

/**
 * @param {unknown} doc a parsed content document
 * @returns {{valid: boolean, errors: Array<{path: string, code: string, message: string}>}}
 */
export function validateContent(doc) {
  const errors = new Errors();

  if (!isObject(doc)) {
    errors.add('.', 'NOT_AN_OBJECT', 'a content document must be an object');
    return { valid: false, errors: errors.list };
  }
  if (doc.schema !== SCHEMA_ID) {
    errors.add('.schema', 'UNKNOWN_SCHEMA', `must be ${SCHEMA_ID}`);
  }

  // The two approved documents this one was transferred from, by content
  // hash. A document that names a different revision is not this essay.
  if (!isObject(doc.source)) {
    errors.add('.source', 'MISSING_SOURCE', 'must record the approved essay and its SHA-256');
  } else {
    for (const key of ['essay', 'handoff']) {
      const entry = doc.source[key];
      if (!isObject(entry) || !isText(entry.path) || !/^[0-9a-f]{64}$/.test(entry.sha256 ?? '')) {
        errors.add(`.source.${key}`, 'MISSING_SOURCE', 'must record the approved path and its SHA-256');
      }
    }
  }

  if (!isObject(doc.interface)) {
    errors.add('.interface', 'NOT_AN_OBJECT', 'must be an object');
  } else {
    for (const key of INTERFACE_KEYS) errors.text(`.interface.${key}`, doc.interface[key]);
  }

  const assets = Array.isArray(doc.assets) ? doc.assets : [];
  if (!errors.list_('.assets', doc.assets)) return { valid: false, errors: errors.list };
  assets.forEach((asset, index) => checkAsset(errors, `.assets[${index}]`, asset));

  const assetsByRef = new Map(assets.filter(isObject).map((asset) => [asset.ref, asset]));
  if (assetsByRef.size !== assets.length) {
    errors.add('.assets', 'DUPLICATE_REF', 'each brief reference is registered once');
  }

  /* --- Chapters and scenes --- */

  const scenes = Array.isArray(doc.scenes) ? doc.scenes : [];
  const chapters = Array.isArray(doc.chapters) ? doc.chapters : [];
  if (!errors.list_('.scenes', doc.scenes) || !errors.list_('.chapters', doc.chapters)) {
    return { valid: false, errors: errors.list };
  }
  if (scenes.length !== SCENE_COUNT) {
    errors.add('.scenes', 'SCENE_COUNT', `the approved argument has ${SCENE_COUNT} parts, not ${scenes.length}`);
  }
  if (chapters.length !== CHAPTER_COUNT) {
    errors.add('.chapters', 'CHAPTER_COUNT', `the approved argument has ${CHAPTER_COUNT} chapters, not ${chapters.length}`);
  }

  const sceneIds = new Set();
  const cited = new Set();
  scenes.forEach((scene, index) => {
    const path = `.scenes[${index}]`;
    if (!isObject(scene)) return errors.add(path, 'NOT_AN_OBJECT', 'must be an object');
    if (!SCENE_ID_PATTERN.test(scene.id ?? '')) {
      errors.add(`${path}.id`, 'INVALID_ID', 'must keep the sNNN identifier shape');
    } else if (sceneIds.has(scene.id)) {
      errors.add(`${path}.id`, 'DUPLICATE_ID', `${scene.id} appears more than once`);
    } else if (Number.parseInt(scene.id.slice(1), 10) < FIRST_PART_NUMBER) {
      // The approved essay's own id policy: changed copy never reuses an
      // address this site has already published.
      errors.add(`${path}.id`, 'REUSED_ADDRESS',
        `${scene.id} is an address the superseded script published; parts start at s${FIRST_PART_NUMBER}`);
    } else {
      sceneIds.add(scene.id);
    }
    if (!PART_KEY_PATTERN.test(scene.partKey ?? '')) {
      errors.add(`${path}.partKey`, 'INVALID_PART_KEY', 'must keep the approved handoff authoring key');
    }
    errors.text(`${path}.title`, scene.title);
    if (!CHAPTER_ID_PATTERN.test(scene.chapterId ?? '')) {
      errors.add(`${path}.chapterId`, 'INVALID_ID', 'must name one of the eight chapters');
    }
    if (errors.list_(`${path}.blocks`, scene.blocks)) {
      if (scene.blocks.length === 0) {
        errors.add(`${path}.blocks`, 'EMPTY_SCENE', 'every part completes its titled point');
      }
      scene.blocks.forEach((block, blockIndex) => checkBlock(errors, `${path}.blocks[${blockIndex}]`, block, cited));
      if (Array.isArray(scene.blocks) && isObject(scene.visual)
        && Number.isInteger(scene.visual.afterBlock) && scene.visual.afterBlock > scene.blocks.length) {
        errors.add(`${path}.visual.afterBlock`, 'PLACEMENT_PAST_END', 'the drawing cannot follow a block the scene does not have');
      }
    }
    checkVisual(errors, `${path}.visual`, scene.visual, assetsByRef);
    return true;
  });

  const chapterIds = new Set();
  const assigned = [];
  chapters.forEach((chapter, index) => {
    const path = `.chapters[${index}]`;
    if (!isObject(chapter)) return errors.add(path, 'NOT_AN_OBJECT', 'must be an object');
    if (!CHAPTER_ID_PATTERN.test(chapter.id ?? '')) {
      errors.add(`${path}.id`, 'INVALID_ID', 'must be c1 through c8');
    } else if (chapterIds.has(chapter.id)) {
      errors.add(`${path}.id`, 'DUPLICATE_ID', `${chapter.id} appears more than once`);
    } else {
      chapterIds.add(chapter.id);
    }
    if (chapter.number !== index + 1) {
      errors.add(`${path}.number`, 'OUT_OF_ORDER', `chapters are numbered in reading order; expected ${index + 1}`);
    }
    // No chapter question, opening or closing: the approved script has none,
    // and a renderer that supplied them would be writing the essay.
    errors.text(`${path}.title`, chapter.title);
    if (!errors.list_(`${path}.sceneIds`, chapter.sceneIds)) return false;
    if (chapter.sceneIds.length === 0) {
      errors.add(`${path}.sceneIds`, 'EMPTY_CHAPTER', 'a chapter carries at least one part');
    }
    chapter.sceneIds.forEach((id, sceneIndex) => {
      if (!sceneIds.has(id)) {
        errors.add(`${path}.sceneIds[${sceneIndex}]`, 'UNKNOWN_SCENE', `${id} is not a scene in this document`);
      }
      assigned.push(id);
    });
    return true;
  });

  // Reading order is the chapters' declared scene order, and it has to be the
  // authored one: every scene assigned once, in the order the scenes are
  // stored, with none left out of the reading path.
  if (assigned.length !== new Set(assigned).size) {
    errors.add('.chapters', 'SCENE_ASSIGNED_TWICE', 'a scene belongs to one chapter');
  }
  const authored = scenes.filter(isObject).map((scene) => scene.id);
  if (assigned.length === authored.length && assigned.some((id, index) => id !== authored[index])) {
    errors.add('.chapters', 'READING_ORDER', 'the chapters must list the scenes in their authored order');
  }
  for (const scene of scenes.filter(isObject)) {
    if (!assigned.includes(scene.id)) {
      errors.add('.chapters', 'SCENE_UNREACHABLE', `${scene.id} is in no chapter and no reader would reach it`);
    }
    const chapter = chapters.find((entry) => isObject(entry) && entry.id === scene.chapterId);
    if (chapter && !chapter.sceneIds?.includes(scene.id)) {
      errors.add(`.scenes[${authored.indexOf(scene.id)}].chapterId`, 'CHAPTER_MISMATCH',
        `${scene.id} names ${scene.chapterId}, which does not list it`);
    }
  }

  /* --- Old addresses ---
     Every address the superseded script published still has to lead
     somewhere. The copy at those addresses is gone, so each one names the
     part that now carries the related passage; a reader following a link
     somebody shared arrives at the passage rather than at nothing. */

  // Reported, not returned on: an editor fixing a document wants the whole
  // list, and a missing relocation table says nothing about the register.
  const relocations = Array.isArray(doc.relocations) ? doc.relocations : [];
  errors.list_('.relocations', doc.relocations);
  if (Array.isArray(doc.relocations) && relocations.length !== RELOCATION_COUNT) {
    errors.add('.relocations', 'RELOCATION_COUNT',
      `${RELOCATION_COUNT} published addresses need a destination, not ${relocations.length}`);
  }
  const relocated = new Set();
  relocations.forEach((entry, index) => {
    const path = `.relocations[${index}]`;
    if (!isObject(entry)) return errors.add(path, 'NOT_AN_OBJECT', 'must be an object');
    if (!SCENE_ID_PATTERN.test(entry.from ?? '')) {
      errors.add(`${path}.from`, 'INVALID_ID', 'must be an address this site published');
    } else if (relocated.has(entry.from)) {
      errors.add(`${path}.from`, 'DUPLICATE_ID', `${entry.from} is relocated more than once`);
    } else {
      relocated.add(entry.from);
    }
    if (sceneIds.has(entry.from)) {
      errors.add(`${path}.from`, 'ADDRESS_STILL_IN_USE', `${entry.from} is a part in this document`);
    }
    if (!sceneIds.has(entry.to)) {
      errors.add(`${path}.to`, 'UNKNOWN_SCENE', `${entry.to} is not a part in this document`);
    }
    if (!PART_KEY_PATTERN.test(entry.partKey ?? '')) {
      errors.add(`${path}.partKey`, 'INVALID_PART_KEY', 'must keep the approved handoff authoring key');
    }
    return true;
  });

  /* --- Landing --- */

  if (!isObject(doc.landing)) {
    errors.add('.landing', 'NOT_AN_OBJECT', 'must be an object');
  } else {
    // The landing carries the approved title, the opening drawing, Begin and
    // Sources & Credits. There is deliberately no field here for a subtitle,
    // a byline, a summary or a reading-time estimate.
    errors.text('.landing.title', doc.landing.title);
    errors.text('.landing.beginLabel', doc.landing.beginLabel);
    errors.text('.landing.sourcesLabel', doc.landing.sourcesLabel);
    if (!sceneIds.has(doc.landing.beginSceneId)) {
      errors.add('.landing.beginSceneId', 'UNKNOWN_SCENE', 'Begin must open a part in this document');
    } else if (chapters[0] && doc.landing.beginSceneId !== chapters[0].sceneIds?.[0]) {
      errors.add('.landing.beginSceneId', 'ANCHOR_MISMATCH', 'Begin opens the first part of the first chapter');
    }
    checkVisual(errors, '.landing.visual', doc.landing.visual, assetsByRef, { anchored: false });
  }

  /* --- Sources --- */

  const page = doc.sourcesPage;
  if (!isObject(page)) {
    errors.add('.sourcesPage', 'NOT_AN_OBJECT', 'must be an object');
    return { valid: errors.list.length === 0, errors: errors.list };
  }
  for (const key of SOURCES_PAGE_KEYS) {
    if (page[key] === undefined) errors.add(`.sourcesPage.${key}`, 'MISSING_BLOCK', 'the approved page copy is required');
  }
  errors.text('.sourcesPage.title', page.title);
  errors.text('.sourcesPage.returnLabel', page.returnLabel);
  for (const key of ['intro', 'classNote', 'credits', 'methodNote']) {
    if (page[key] !== undefined) checkRichText(errors, `.sourcesPage.${key}`, page[key]);
  }

  const sources = Array.isArray(page.sources) ? page.sources : [];
  if (!errors.list_('.sourcesPage.sources', page.sources)) {
    return { valid: false, errors: errors.list };
  }
  if (sources.length !== SOURCE_COUNT) {
    errors.add('.sourcesPage.sources', 'SOURCE_COUNT',
      `the approved reader page carries ${SOURCE_COUNT} entries, not ${sources.length}`);
  }
  sources.forEach((source, index) => checkSource(errors, `.sourcesPage.sources[${index}]`, source, index + 1));

  const numbers = new Set(sources.filter(isObject).map((source) => source.number));
  const identities = sources.filter(isObject).map((source) => source.sourceId);
  if (new Set(identities).size !== identities.length) {
    errors.add('.sourcesPage.sources', 'DUPLICATE_SOURCE_ID', 'one R identifier cannot be two register entries');
  }
  for (const number of [...cited].sort((a, b) => a - b)) {
    if (!numbers.has(number)) {
      errors.add('.sourcesPage.sources', 'DANGLING_CITATION', `a scene cites [${number}], which has no register entry`);
    }
  }
  for (const number of [...numbers].sort((a, b) => a - b)) {
    if (!cited.has(number)) {
      errors.add('.sourcesPage.sources', 'UNCITED_SOURCE', `entry [${number}] supports no claim in the essay`);
    }
  }

  /* --- Measurement --- */

  if (!isObject(doc.measure) || !Number.isInteger(doc.measure.number ?? doc.measure.words)) {
    errors.add('.measure', 'MISSING_MEASURE', 'must record the main-path word count');
  } else if (!isText(doc.measure.rule)) {
    // The number alone invites tuning. The rule says what was counted.
    errors.add('.measure.rule', 'MISSING_RULE', 'must record how the words were counted');
  }

  return { valid: errors.list.length === 0, errors: errors.list };
}

/** One error per line, in a form an editor can act on. */
export const formatErrors = (errors) =>
  errors.map((error) => `  ${error.path}  ${error.code}: ${error.message}`).join('\n');
