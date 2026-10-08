/**
 * Content validation for the illustrated happiness essay.
 *
 * `validateContent` never throws on malformed input and never stops at the
 * first problem: it returns every error it can locate so one run tells an
 * editor everything to fix. Each error carries a JSON-ish `path`, a stable
 * machine `code`, and a sentence a human can act on.
 */

import {
  SCHEMA_ID,
  ID_PATTERN,
  DIALOGUE_STANCES,
  SOURCE_REVIEW_STATUSES,
  CAST_ROLES,
  CONCEPT_STATUSES,
  INTERACTION_SURFACES,
} from './schema.js';

const FIELDS = {
  root: ['schema', 'status', 'project', 'chapters', 'scenes', 'cast', 'sources', 'concepts', 'details', 'interactions', 'provenance'],
  status: ['final', 'label', 'notice'],
  project: ['title', 'question', 'summary', 'readingTimeEstimate'],
  chapter: ['id', 'title', 'question', 'opening', 'closing', 'sceneIds'],
  scene: ['id', 'chapterId', 'title', 'narration', 'dialogue', 'visual', 'conceptIds', 'sourceIds', 'limitations', 'detailIds', 'interactionIds'],
  visual: ['description', 'cast'],
  visualCast: ['characterId', 'expressionId'],
  dialogue: ['id', 'speakerId', 'text', 'stance', 'sourceIds', 'provenanceId'],
  castMember: ['id', 'role', 'displayName', 'appearance', 'expressions'],
  expression: ['id', 'label'],
  source: ['id', 'label', 'url', 'type', 'intendedRole', 'limitation', 'reviewStatus', 'citation', 'supportedClaim'],
  concept: ['id', 'name', 'status', 'explanation', 'application', 'question', 'sourceIds'],
  detail: ['id', 'title', 'body', 'sourceIds'],
  interaction: ['id', 'surface', 'purpose', 'trigger', 'keyboard', 'staticEquivalent', 'detailId'],
  provenance: ['id', 'appliesTo', 'note', 'sourceNote'],
};

class ErrorBag {
  constructor() {
    this.errors = [];
  }

  add(path, code, message) {
    this.errors.push({ path, code, message });
  }
}

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

function checkObject(bag, value, path, allowedFields) {
  if (!isPlainObject(value)) {
    bag.add(path, 'NOT_AN_OBJECT', `Expected an object at ${path}.`);
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowedFields.includes(key)) {
      bag.add(`${path}.${key}`, 'UNKNOWN_FIELD', `Unknown field "${key}". The contract allows: ${allowedFields.join(', ')}.`);
    }
  }
  for (const key of allowedFields) {
    if (!(key in value)) {
      bag.add(`${path}.${key}`, 'MISSING_FIELD', `Required field "${key}" is missing.`);
    }
  }
  return true;
}

function checkString(bag, value, path, { label } = {}) {
  if (value === undefined) return false; // already reported as MISSING_FIELD
  if (typeof value !== 'string') {
    bag.add(path, 'NOT_A_STRING', `${label ?? path} must be a string.`);
    return false;
  }
  if (value.trim() === '') {
    bag.add(path, 'EMPTY_STRING', `${label ?? path} must not be empty. The contract requires meaningful text here.`);
    return false;
  }
  return true;
}

function checkNullableString(bag, value, path) {
  if (value === undefined || value === null) return true;
  return checkString(bag, value, path);
}

function checkArray(bag, value, path, { allowEmpty = true } = {}) {
  if (value === undefined) return false;
  if (!Array.isArray(value)) {
    bag.add(path, 'NOT_AN_ARRAY', `${path} must be an array.`);
    return false;
  }
  if (!allowEmpty && value.length === 0) {
    bag.add(path, 'EMPTY_ARRAY', `${path} must list at least one entry.`);
    return false;
  }
  return true;
}

function checkStringArray(bag, value, path, options) {
  if (!checkArray(bag, value, path, options)) return false;
  let ok = true;
  value.forEach((entry, index) => {
    if (!checkString(bag, entry, `${path}[${index}]`)) ok = false;
  });
  return ok;
}

function checkEnum(bag, value, path, allowed) {
  if (value === undefined) return false;
  if (!allowed.includes(value)) {
    bag.add(path, 'INVALID_ENUM', `${path} must be one of: ${allowed.join(', ')}. Found ${JSON.stringify(value)}.`);
    return false;
  }
  return true;
}

/**
 * Registers one globally unique identifier. Expression identifiers are scoped
 * to their character and deliberately stay out of this namespace.
 */
function registerId(bag, ids, value, path, kind) {
  if (!checkString(bag, value, path)) return null;
  if (!ID_PATTERN.test(value)) {
    bag.add(path, 'INVALID_ID', `Identifier ${JSON.stringify(value)} must be alphanumeric groups joined by hyphens, for example "ch-what-counts".`);
    return null;
  }
  const existing = ids.get(value);
  if (existing) {
    bag.add(path, 'DUPLICATE_ID', `Identifier ${JSON.stringify(value)} is already used by ${existing.kind} at ${existing.path}. Identifiers must be unique across the whole document.`);
    return null;
  }
  ids.set(value, { kind, path });
  return value;
}

function checkReference(bag, ids, value, path, expectedKinds, { what } = {}) {
  if (!checkString(bag, value, path)) return false;
  const target = ids.get(value);
  if (!target) {
    bag.add(path, 'UNKNOWN_REFERENCE', `${what ?? 'Reference'} ${JSON.stringify(value)} does not exist. Add the entry or correct the identifier.`);
    return false;
  }
  if (!expectedKinds.includes(target.kind)) {
    bag.add(path, 'WRONG_REFERENCE_KIND', `${what ?? 'Reference'} ${JSON.stringify(value)} points at a ${target.kind}, but a ${expectedKinds.join(' or ')} is required here.`);
    return false;
  }
  return true;
}

function checkReferenceList(bag, ids, list, path, expectedKinds, options) {
  if (!checkArray(bag, list, path, options)) return;
  const seen = new Set();
  list.forEach((value, index) => {
    const itemPath = `${path}[${index}]`;
    if (typeof value === 'string' && seen.has(value)) {
      bag.add(itemPath, 'DUPLICATE_REFERENCE', `${JSON.stringify(value)} is listed more than once in ${path}.`);
      return;
    }
    if (typeof value === 'string') seen.add(value);
    checkReference(bag, ids, value, itemPath, expectedKinds, options);
  });
}

/**
 * First pass: collect identifiers so later passes can resolve references
 * regardless of the order registries appear in the document.
 */
function collectIds(bag, doc) {
  const ids = new Map();
  const expressionsByCharacter = new Map();

  const collect = (registry, kind) => {
    const list = doc?.[registry];
    if (!Array.isArray(list)) return;
    list.forEach((entry, index) => {
      if (!isPlainObject(entry)) return;
      registerId(bag, ids, entry.id, `${registry}[${index}].id`, kind);
    });
  };

  collect('chapters', 'chapter');
  collect('scenes', 'scene');
  collect('cast', 'character');
  collect('sources', 'source');
  collect('concepts', 'concept');
  collect('details', 'detail');
  collect('interactions', 'interaction');
  collect('provenance', 'provenance record');

  if (Array.isArray(doc?.scenes)) {
    doc.scenes.forEach((scene, sceneIndex) => {
      if (!isPlainObject(scene) || !Array.isArray(scene.dialogue)) return;
      scene.dialogue.forEach((line, lineIndex) => {
        if (!isPlainObject(line)) return;
        registerId(bag, ids, line.id, `scenes[${sceneIndex}].dialogue[${lineIndex}].id`, 'dialogue line');
      });
    });
  }

  if (Array.isArray(doc?.cast)) {
    doc.cast.forEach((character, index) => {
      if (!isPlainObject(character) || typeof character.id !== 'string') return;
      const expressionIds = new Set();
      if (!Array.isArray(character.expressions)) return;
      character.expressions.forEach((expression, expressionIndex) => {
        if (!isPlainObject(expression) || typeof expression.id !== 'string') return;
        const path = `cast[${index}].expressions[${expressionIndex}].id`;
        if (expressionIds.has(expression.id)) {
          bag.add(path, 'DUPLICATE_ID', `Expression ${JSON.stringify(expression.id)} is listed twice for ${character.id}.`);
          return;
        }
        expressionIds.add(expression.id);
      });
      expressionsByCharacter.set(character.id, expressionIds);
    });
  }

  return { ids, expressionsByCharacter };
}

function validateStatus(bag, doc) {
  if (!checkObject(bag, doc.status, 'status', FIELDS.status)) return;
  if (typeof doc.status.final !== 'boolean') {
    bag.add('status.final', 'NOT_A_BOOLEAN', 'status.final must be true or false so the reader can show an honest draft notice.');
  }
  checkString(bag, doc.status.label, 'status.label');
  if (doc.status.final === false) {
    checkString(bag, doc.status.notice, 'status.notice', {
      label: 'status.notice (required while status.final is false)',
    });
  } else {
    checkNullableString(bag, doc.status.notice, 'status.notice');
  }
}

function validateProject(bag, doc) {
  if (!checkObject(bag, doc.project, 'project', FIELDS.project)) return;
  checkString(bag, doc.project.title, 'project.title');
  checkString(bag, doc.project.question, 'project.question');
  checkString(bag, doc.project.summary, 'project.summary');
  // The reading-time estimate stays null until real prose can be measured.
  checkNullableString(bag, doc.project.readingTimeEstimate, 'project.readingTimeEstimate');
}

function validateCast(bag, doc) {
  if (!checkArray(bag, doc.cast, 'cast', { allowEmpty: false })) return;
  doc.cast.forEach((character, index) => {
    const path = `cast[${index}]`;
    if (!checkObject(bag, character, path, FIELDS.castMember)) return;
    checkEnum(bag, character.role, `${path}.role`, CAST_ROLES);
    checkString(bag, character.displayName, `${path}.displayName`);
    checkString(bag, character.appearance, `${path}.appearance`);
    if (!checkArray(bag, character.expressions, `${path}.expressions`, { allowEmpty: false })) return;
    character.expressions.forEach((expression, expressionIndex) => {
      const expressionPath = `${path}.expressions[${expressionIndex}]`;
      if (!checkObject(bag, expression, expressionPath, FIELDS.expression)) return;
      if (checkString(bag, expression.id, `${expressionPath}.id`) && !ID_PATTERN.test(expression.id)) {
        bag.add(`${expressionPath}.id`, 'INVALID_ID', `Expression identifier ${JSON.stringify(expression.id)} must be alphanumeric groups joined by hyphens.`);
      }
      checkString(bag, expression.label, `${expressionPath}.label`);
    });
  });
}

function validateSources(bag, doc) {
  if (!checkArray(bag, doc.sources, 'sources')) return;
  doc.sources.forEach((source, index) => {
    const path = `sources[${index}]`;
    if (!checkObject(bag, source, path, FIELDS.source)) return;
    checkString(bag, source.label, `${path}.label`);
    checkString(bag, source.url, `${path}.url`);
    checkString(bag, source.type, `${path}.type`);
    checkString(bag, source.intendedRole, `${path}.intendedRole`);
    checkString(bag, source.limitation, `${path}.limitation`);
    checkEnum(bag, source.reviewStatus, `${path}.reviewStatus`, SOURCE_REVIEW_STATUSES);

    // A source may only assert a bibliographic citation and a supported claim
    // once it has actually been read at passage level. This keeps unaudited
    // imports from hardening into published evidence.
    if (source.reviewStatus === 'verified') {
      checkString(bag, source.citation, `${path}.citation`, {
        label: `${path}.citation (required once reviewStatus is "verified")`,
      });
      checkString(bag, source.supportedClaim, `${path}.supportedClaim`, {
        label: `${path}.supportedClaim (required once reviewStatus is "verified")`,
      });
    } else if (SOURCE_REVIEW_STATUSES.includes(source.reviewStatus)) {
      for (const field of ['citation', 'supportedClaim']) {
        if (source[field] !== null && source[field] !== undefined) {
          bag.add(`${path}.${field}`, 'UNVERIFIED_SOURCE_CLAIM', `${path}.${field} must be null while reviewStatus is ${JSON.stringify(source.reviewStatus)}. Record the audited claim only after the passage has been read.`);
        }
      }
    }
  });
}

function validateConcepts(bag, doc, ids) {
  if (!checkArray(bag, doc.concepts, 'concepts')) return;
  doc.concepts.forEach((concept, index) => {
    const path = `concepts[${index}]`;
    if (!checkObject(bag, concept, path, FIELDS.concept)) return;
    checkString(bag, concept.name, `${path}.name`);
    checkEnum(bag, concept.status, `${path}.status`, CONCEPT_STATUSES);
    checkReferenceList(bag, ids, concept.sourceIds, `${path}.sourceIds`, ['source'], { what: 'Source' });

    // "Explain, apply, and question" is the agreed treatment, so a drafted
    // concept carries all three and a planned one carries none of them.
    const treatment = ['explanation', 'application', 'question'];
    if (concept.status === 'drafted') {
      for (const field of treatment) {
        checkString(bag, concept[field], `${path}.${field}`, {
          label: `${path}.${field} (required once status is "drafted")`,
        });
      }
    } else if (concept.status === 'planned') {
      for (const field of treatment) {
        if (concept[field] !== null && concept[field] !== undefined) {
          bag.add(`${path}.${field}`, 'UNDRAFTED_CONCEPT_TEXT', `${path}.${field} must be null while status is "planned". Set status to "drafted" when the explanation, application, and criticism are written.`);
        }
      }
    }
  });
}

function validateDetailsAndInteractions(bag, doc, ids) {
  if (checkArray(bag, doc.details, 'details')) {
    doc.details.forEach((detail, index) => {
      const path = `details[${index}]`;
      if (!checkObject(bag, detail, path, FIELDS.detail)) return;
      checkString(bag, detail.title, `${path}.title`);
      checkStringArray(bag, detail.body, `${path}.body`, { allowEmpty: false });
      checkReferenceList(bag, ids, detail.sourceIds, `${path}.sourceIds`, ['source'], { what: 'Source' });
    });
  }

  if (checkArray(bag, doc.interactions, 'interactions')) {
    doc.interactions.forEach((interaction, index) => {
      const path = `interactions[${index}]`;
      if (!checkObject(bag, interaction, path, FIELDS.interaction)) return;
      checkEnum(bag, interaction.surface, `${path}.surface`, INTERACTION_SURFACES);
      checkString(bag, interaction.purpose, `${path}.purpose`);
      checkString(bag, interaction.trigger, `${path}.trigger`);
      // Keyboard behaviour and a readable static equivalent are the agreed
      // accessibility floor: an optional reveal may never be the only route to
      // its explanation.
      checkString(bag, interaction.keyboard, `${path}.keyboard`, {
        label: `${path}.keyboard (every optional interaction needs keyboard behaviour)`,
      });
      checkString(bag, interaction.staticEquivalent, `${path}.staticEquivalent`, {
        label: `${path}.staticEquivalent (every optional interaction needs a readable static equivalent)`,
      });
      checkReference(bag, ids, interaction.detailId, `${path}.detailId`, ['detail'], { what: 'Detail' });
    });
  }
}

function validateProvenance(bag, doc, ids) {
  if (!checkArray(bag, doc.provenance, 'provenance')) return;
  doc.provenance.forEach((record, index) => {
    const path = `provenance[${index}]`;
    if (!checkObject(bag, record, path, FIELDS.provenance)) return;
    checkReference(bag, ids, record.appliesTo, `${path}.appliesTo`, ['chapter', 'scene', 'dialogue line', 'source', 'concept', 'detail'], {
      what: 'Provenance subject',
    });
    checkString(bag, record.note, `${path}.note`);
    checkString(bag, record.sourceNote, `${path}.sourceNote`);
  });
}

function validateScenes(bag, doc, ids, expressionsByCharacter) {
  if (!checkArray(bag, doc.scenes, 'scenes', { allowEmpty: false })) return;
  doc.scenes.forEach((scene, index) => {
    const path = `scenes[${index}]`;
    if (!checkObject(bag, scene, path, FIELDS.scene)) return;
    checkString(bag, scene.title, `${path}.title`);
    checkReference(bag, ids, scene.chapterId, `${path}.chapterId`, ['chapter'], { what: 'Chapter' });

    // Essential narration is the main reading path. It must stand on its own,
    // independently of dialogue, optional detail, or illustration.
    if (checkArray(bag, scene.narration, `${path}.narration`)) {
      scene.narration.forEach((paragraph, paragraphIndex) => {
        checkString(bag, paragraph, `${path}.narration[${paragraphIndex}]`);
      });
      const meaningful = scene.narration.filter((paragraph) => typeof paragraph === 'string' && paragraph.trim() !== '');
      if (meaningful.length === 0) {
        bag.add(`${path}.narration`, 'EMPTY_ESSENTIAL_SCENE', `Scene ${JSON.stringify(scene.id ?? index)} has no essential narration. Every scene must read on the main path without dialogue, illustration, or optional detail.`);
      }
    }

    checkStringArray(bag, scene.limitations, `${path}.limitations`);
    checkReferenceList(bag, ids, scene.conceptIds, `${path}.conceptIds`, ['concept'], { what: 'Concept' });
    checkReferenceList(bag, ids, scene.sourceIds, `${path}.sourceIds`, ['source'], { what: 'Source' });
    checkReferenceList(bag, ids, scene.detailIds, `${path}.detailIds`, ['detail'], { what: 'Detail' });
    checkReferenceList(bag, ids, scene.interactionIds, `${path}.interactionIds`, ['interaction'], { what: 'Interaction' });

    validateSceneVisual(bag, scene, path, ids, expressionsByCharacter);
    validateSceneDialogue(bag, scene, path, ids);

    // An optional interaction must reveal a detail the same scene already
    // carries statically, so the explanation survives with the reveal unused.
    if (Array.isArray(scene.interactionIds) && Array.isArray(scene.detailIds) && Array.isArray(doc.interactions)) {
      scene.interactionIds.forEach((interactionId, interactionIndex) => {
        const interaction = doc.interactions.find((entry) => isPlainObject(entry) && entry.id === interactionId);
        if (!interaction || typeof interaction.detailId !== 'string') return;
        if (!scene.detailIds.includes(interaction.detailId)) {
          bag.add(`${path}.interactionIds[${interactionIndex}]`, 'INTERACTION_DETAIL_NOT_IN_SCENE', `Interaction ${JSON.stringify(interactionId)} reveals detail ${JSON.stringify(interaction.detailId)}, which this scene does not list in detailIds. The detail must also be readable without the interaction.`);
        }
      });
    }
  });
}

function validateSceneVisual(bag, scene, path, ids, expressionsByCharacter) {
  const visualPath = `${path}.visual`;
  if (!checkObject(bag, scene.visual, visualPath, FIELDS.visual)) return;
  // The visual description doubles as the text alternative and as the static
  // equivalent when motion is reduced, so it is never optional.
  checkString(bag, scene.visual.description, `${visualPath}.description`, {
    label: `${visualPath}.description (also the text alternative and reduced-motion equivalent)`,
  });
  if (!checkArray(bag, scene.visual.cast, `${visualPath}.cast`)) return;
  scene.visual.cast.forEach((appearance, appearanceIndex) => {
    const appearancePath = `${visualPath}.cast[${appearanceIndex}]`;
    if (!checkObject(bag, appearance, appearancePath, FIELDS.visualCast)) return;
    const known = checkReference(bag, ids, appearance.characterId, `${appearancePath}.characterId`, ['character'], { what: 'Character' });
    if (!checkString(bag, appearance.expressionId, `${appearancePath}.expressionId`)) return;
    if (!known) return;
    const available = expressionsByCharacter.get(appearance.characterId);
    if (available && !available.has(appearance.expressionId)) {
      bag.add(`${appearancePath}.expressionId`, 'UNKNOWN_EXPRESSION', `Character ${JSON.stringify(appearance.characterId)} has no expression ${JSON.stringify(appearance.expressionId)}. Available: ${[...available].join(', ') || 'none'}.`);
    }
  });
}

function validateSceneDialogue(bag, scene, path, ids) {
  const dialoguePath = `${path}.dialogue`;
  if (!checkArray(bag, scene.dialogue, dialoguePath)) return;
  scene.dialogue.forEach((line, lineIndex) => {
    const linePath = `${dialoguePath}[${lineIndex}]`;
    if (!checkObject(bag, line, linePath, FIELDS.dialogue)) return;
    checkReference(bag, ids, line.speakerId, `${linePath}.speakerId`, ['character'], { what: 'Speaker' });
    checkString(bag, line.text, `${linePath}.text`);
    checkEnum(bag, line.stance, `${linePath}.stance`, DIALOGUE_STANCES);
    checkReferenceList(bag, ids, line.sourceIds, `${linePath}.sourceIds`, ['source'], { what: 'Source' });

    // A line spoken as a contributor's own position must point at the note or
    // delta that records it. Without that, it would be an invented opinion.
    if (line.stance === 'member-endorsed') {
      if (typeof line.provenanceId !== 'string' || line.provenanceId.trim() === '') {
        if (line.provenanceId !== undefined) {
          bag.add(`${linePath}.provenanceId`, 'UNSUPPORTED_MEMBER_POSITION', `This line speaks for a contributor but records no provenance. Link the note or delta showing that the member endorses it, or mark the line as "fictional-illustration".`);
        }
      } else {
        checkReference(bag, ids, line.provenanceId, `${linePath}.provenanceId`, ['provenance record'], { what: 'Provenance record' });
      }
    } else if (line.provenanceId !== null && line.provenanceId !== undefined) {
      checkReference(bag, ids, line.provenanceId, `${linePath}.provenanceId`, ['provenance record'], { what: 'Provenance record' });
    }
  });
}

/**
 * Chapters own scenes by identifier. Reading order comes from `sceneIds`, so a
 * later editorial delta can reorder beats without touching array positions.
 */
function validateOwnershipAndOrder(bag, doc, ids) {
  if (!checkArray(bag, doc.chapters, 'chapters', { allowEmpty: false })) return;

  const claims = new Map(); // scene id -> { chapterId, path }

  doc.chapters.forEach((chapter, index) => {
    const path = `chapters[${index}]`;
    if (!checkObject(bag, chapter, path, FIELDS.chapter)) return;
    checkString(bag, chapter.title, `${path}.title`);
    checkString(bag, chapter.question, `${path}.question`);
    // Opening and closing connections are what keep six questions reading as
    // one argument instead of six separate essays.
    checkString(bag, chapter.opening, `${path}.opening`, {
      label: `${path}.opening (the connection into this chapter)`,
    });
    checkString(bag, chapter.closing, `${path}.closing`, {
      label: `${path}.closing (the connection out of this chapter)`,
    });

    if (!checkArray(bag, chapter.sceneIds, `${path}.sceneIds`, { allowEmpty: false })) return;
    chapter.sceneIds.forEach((sceneId, sceneIndex) => {
      const scenePath = `${path}.sceneIds[${sceneIndex}]`;
      if (!checkReference(bag, ids, sceneId, scenePath, ['scene'], { what: 'Scene' })) return;
      const existing = claims.get(sceneId);
      if (existing) {
        bag.add(scenePath, 'SCENE_CLAIMED_TWICE', `Scene ${JSON.stringify(sceneId)} is already listed at ${existing.path}. Each scene belongs to exactly one chapter and appears once in its order.`);
        return;
      }
      claims.set(sceneId, { chapterId: chapter.id, path: scenePath });
    });
  });

  if (!Array.isArray(doc.scenes)) return;
  doc.scenes.forEach((scene, index) => {
    if (!isPlainObject(scene) || typeof scene.id !== 'string') return;
    const claim = claims.get(scene.id);
    if (!claim) {
      bag.add(`scenes[${index}].id`, 'SCENE_ORPHANED', `Scene ${JSON.stringify(scene.id)} is not listed in any chapter's sceneIds, so it would never be read. Add it to its chapter's order.`);
      return;
    }
    if (typeof scene.chapterId === 'string' && scene.chapterId !== claim.chapterId) {
      bag.add(`scenes[${index}].chapterId`, 'SCENE_CHAPTER_MISMATCH', `Scene ${JSON.stringify(scene.id)} declares chapter ${JSON.stringify(scene.chapterId)} but is ordered inside ${JSON.stringify(claim.chapterId)} at ${claim.path}.`);
    }
  });
}

/** Details and interactions are scene-scoped; an unused one is dead content. */
function validateUsage(bag, doc) {
  const usage = (registry, field, kind) => {
    if (!Array.isArray(doc[registry]) || !Array.isArray(doc.scenes)) return;
    const owners = new Map();
    doc.scenes.forEach((scene) => {
      if (!isPlainObject(scene) || !Array.isArray(scene[field]) || typeof scene.id !== 'string') return;
      for (const id of new Set(scene[field])) {
        if (typeof id !== 'string') continue;
        if (!owners.has(id)) owners.set(id, []);
        owners.get(id).push(scene.id);
      }
    });
    doc[registry].forEach((entry, index) => {
      if (!isPlainObject(entry) || typeof entry.id !== 'string') return;
      const claimedBy = owners.get(entry.id) ?? [];
      if (claimedBy.length === 0) {
        bag.add(`${registry}[${index}].id`, 'UNUSED_ENTRY', `${kind} ${JSON.stringify(entry.id)} is not referenced by any scene, so no reader would ever reach it. Reference it or remove it.`);
      } else if (claimedBy.length > 1) {
        bag.add(`${registry}[${index}].id`, 'ENTRY_CLAIMED_TWICE', `${kind} ${JSON.stringify(entry.id)} is referenced by several scenes (${claimedBy.join(', ')}). Each belongs to a single scene.`);
      }
    });
  };

  usage('details', 'detailIds', 'Detail');
  usage('interactions', 'interactionIds', 'Interaction');
}

/**
 * Validates a parsed content document.
 *
 * @param {unknown} doc Parsed JSON, trusted to be nothing more than JSON.
 * @returns {{ valid: boolean, errors: Array<{path: string, code: string, message: string}> }}
 */
export function validateContent(doc) {
  const bag = new ErrorBag();

  if (!checkObject(bag, doc, 'content', FIELDS.root)) {
    return { valid: false, errors: bag.errors };
  }

  if (doc.schema !== SCHEMA_ID) {
    bag.add('content.schema', 'SCHEMA_MISMATCH', `Expected schema ${JSON.stringify(SCHEMA_ID)} but found ${JSON.stringify(doc.schema)}.`);
  }

  const { ids, expressionsByCharacter } = collectIds(bag, doc);

  validateStatus(bag, doc);
  validateProject(bag, doc);
  validateCast(bag, doc);
  validateSources(bag, doc);
  validateConcepts(bag, doc, ids);
  validateDetailsAndInteractions(bag, doc, ids);
  validateScenes(bag, doc, ids, expressionsByCharacter);
  validateOwnershipAndOrder(bag, doc, ids);
  validateProvenance(bag, doc, ids);
  validateUsage(bag, doc);

  return { valid: bag.errors.length === 0, errors: bag.errors };
}

/** Formats errors for a terminal, one actionable line each. */
export function formatErrors(errors) {
  return errors.map((error) => `  ${error.path}: [${error.code}] ${error.message}`).join('\n');
}
