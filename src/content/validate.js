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
  SOURCE_EVIDENCE_LEVELS,
  SOURCE_URL_PATTERN,
  CAST_ROLES,
  CONCEPT_STATUSES,
  INTERACTION_SURFACES,
  MAIN_PATH_KINDS,
  ART_ABSENCE_REASONS,
  ART_STATES,
} from './schema.js';
import {
  COMPOSITION_IDS,
  EXPRESSION_IDS,
  FIGURES,
  FIGURE_IDS,
  compositionHasReveal,
  figureRange,
  hasComposition,
  hasExpression,
  hasFigure,
} from '../art/index.js';

const FIELDS = {
  root: ['schema', 'status', 'project', 'chapters', 'scenes', 'cast', 'sources', 'concepts', 'details', 'interactions', 'provenance'],
  status: ['final', 'label', 'notice'],
  project: ['title', 'question', 'summary', 'readingTimeEstimate', 'visual'],
  chapter: ['id', 'title', 'question', 'number', 'opening', 'closing', 'sceneIds'],
  scene: ['id', 'chapterId', 'title', 'narration', 'dialogue', 'mainPath', 'visual', 'conceptIds', 'sourceIds', 'limitations', 'detailIds', 'interactionIds'],
  mainPath: ['kind', 'index'],
  visual: ['description', 'artId', 'artState', 'artAbsence', 'cast'],
  visualCast: ['characterId', 'expressionId'],
  dialogue: ['id', 'speakerId', 'text', 'stance', 'sourceIds', 'provenanceId'],
  castMember: ['id', 'role', 'displayName', 'appearance', 'artId', 'expressions'],
  expression: ['id', 'label', 'artId'],
  source: ['id', 'label', 'url', 'type', 'intendedRole', 'limitation', 'reviewStatus', 'evidenceBasis', 'citation', 'supportedClaim'],
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

function validateProject(bag, doc, ids, expressionsByCharacter) {
  if (!checkObject(bag, doc.project, 'project', FIELDS.project)) return;
  checkString(bag, doc.project.title, 'project.title');
  checkString(bag, doc.project.question, 'project.question');
  checkString(bag, doc.project.summary, 'project.summary');
  // The reading-time estimate stays null until real prose can be measured.
  checkNullableString(bag, doc.project.readingTimeEstimate, 'project.readingTimeEstimate');
  // The landing illustration is authored content like any other beat's, so it
  // obeys the same rules: a drawing the artwork can produce, a state it can
  // settle into, a cast it can place, and a description that stands in for it.
  validateVisual(bag, doc.project.visual, 'project.visual', ids, expressionsByCharacter, isFinal(doc));
}

function validateCast(bag, doc) {
  if (!checkArray(bag, doc.cast, 'cast', { allowEmpty: false })) return;
  doc.cast.forEach((character, index) => {
    const path = `cast[${index}]`;
    if (!checkObject(bag, character, path, FIELDS.castMember)) return;
    checkEnum(bag, character.role, `${path}.role`, CAST_ROLES);
    checkString(bag, character.displayName, `${path}.displayName`);
    checkString(bag, character.appearance, `${path}.appearance`);
    validateCharacterArt(bag, character, path);
    if (!checkArray(bag, character.expressions, `${path}.expressions`, { allowEmpty: false })) return;
    character.expressions.forEach((expression, expressionIndex) => {
      const expressionPath = `${path}.expressions[${expressionIndex}]`;
      if (!checkObject(bag, expression, expressionPath, FIELDS.expression)) return;
      if (checkString(bag, expression.id, `${expressionPath}.id`) && !ID_PATTERN.test(expression.id)) {
        bag.add(`${expressionPath}.id`, 'INVALID_ID', `Expression identifier ${JSON.stringify(expression.id)} must be alphanumeric groups joined by hyphens.`);
      }
      checkString(bag, expression.label, `${expressionPath}.label`);
      if (checkString(bag, expression.artId, `${expressionPath}.artId`) && !hasExpression(expression.artId)) {
        bag.add(`${expressionPath}.artId`, 'UNKNOWN_ART_REFERENCE', `The artwork package draws no expression ${JSON.stringify(expression.artId)}. Drawable states: ${EXPRESSION_IDS.join(', ')}.`);
      }
    });
  });
}

/**
 * A character is drawn by one of the artwork package's figures, and the figure
 * has to be the right kind. An invented friend may not be drawn as one of the
 * three contributors, a contributor may not be drawn as an invented friend, and
 * neither may be drawn with the unnamed outline the essay uses for figures it
 * has deliberately not named.
 */
function validateCharacterArt(bag, character, path) {
  if (!checkString(bag, character.artId, `${path}.artId`)) return;
  if (!hasFigure(character.artId)) {
    bag.add(`${path}.artId`, 'UNKNOWN_ART_REFERENCE', `The artwork package draws no figure ${JSON.stringify(character.artId)}. Drawable figures: ${FIGURE_IDS.join(', ')}.`);
    return;
  }
  const drawnRole = FIGURES[character.artId].role;
  if (CAST_ROLES.includes(character.role) && drawnRole !== character.role) {
    bag.add(`${path}.artId`, 'ART_ROLE_MISMATCH', `Figure ${JSON.stringify(character.artId)} is drawn as a ${drawnRole}, but this cast entry is a ${character.role}. A contributor and an invented friend must stay visibly different people.`);
  }
}

function validateSources(bag, doc) {
  if (!checkArray(bag, doc.sources, 'sources')) return;
  doc.sources.forEach((source, index) => {
    const path = `sources[${index}]`;
    if (!checkObject(bag, source, path, FIELDS.source)) return;
    checkString(bag, source.label, `${path}.label`);
    checkString(bag, source.type, `${path}.type`);
    checkString(bag, source.intendedRole, `${path}.intendedRole`);
    checkString(bag, source.limitation, `${path}.limitation`);

    // A citation needs a destination a reader can actually follow.
    if (checkString(bag, source.url, `${path}.url`) && !SOURCE_URL_PATTERN.test(source.url)) {
      bag.add(`${path}.url`, 'INVALID_SOURCE_URL', `A source destination must be an http:// or https:// address. Found ${JSON.stringify(source.url)}.`);
    }

    if (!checkEnum(bag, source.reviewStatus, `${path}.reviewStatus`, SOURCE_REVIEW_STATUSES)) return;

    // What a source may assert depends on what was actually opened. An
    // unopened work supports nothing; a publisher's description or an abstract
    // supports only what it itself states, which the reader is told.
    const level = SOURCE_EVIDENCE_LEVELS[source.reviewStatus];
    const required = [
      ['citation', level.requiresRecord],
      ['evidenceBasis', level.requiresRecord],
      ['supportedClaim', level.requiresSupportedClaim],
    ];

    for (const [field, isRequired] of required) {
      if (isRequired) {
        checkString(bag, source[field], `${path}.${field}`, {
          label: `${path}.${field} (required at evidence level "${source.reviewStatus}")`,
        });
      } else if (source[field] !== null && source[field] !== undefined) {
        const code = field === 'supportedClaim' ? 'UNSUPPORTED_SOURCE_CLAIM' : 'UNVERIFIED_SOURCE_RECORD';
        const why = field === 'supportedClaim'
          ? `Nothing inside this work was read at evidence level ${JSON.stringify(source.reviewStatus)}, so it supports no claim. Raise the level once a passage is read, or move the material into the limitation.`
          : `Record this only once something has actually been opened; the evidence level is ${JSON.stringify(source.reviewStatus)}.`;
        bag.add(`${path}.${field}`, code, `${path}.${field} must be null. ${why}`);
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

    // The main path is the essential reading route: narrator paragraphs, spoken
    // lines, and visible caveats, in the order `mainPath` gives them. All three
    // are in every output, so a beat carried by dialogue alone still reads in
    // print and with motion reduced. What a beat may not be is empty.
    if (checkArray(bag, scene.narration, `${path}.narration`)) {
      scene.narration.forEach((paragraph, paragraphIndex) => {
        checkString(bag, paragraph, `${path}.narration[${paragraphIndex}]`);
      });
    }
    const essential = [
      ...(Array.isArray(scene.narration) ? scene.narration : []),
      ...(Array.isArray(scene.limitations) ? scene.limitations : []),
      ...(Array.isArray(scene.dialogue) ? scene.dialogue.map((line) => (isPlainObject(line) ? line.text : null)) : []),
    ];
    if (!essential.some((text) => typeof text === 'string' && text.trim() !== '')) {
      bag.add(`${path}.mainPath`, 'EMPTY_ESSENTIAL_SCENE', `Scene ${JSON.stringify(scene.id ?? index)} has nothing on the main path: no narration, no dialogue, and no visible caveat. Every beat must read without optional detail or illustration.`);
    }

    checkStringArray(bag, scene.limitations, `${path}.limitations`);
    checkReferenceList(bag, ids, scene.conceptIds, `${path}.conceptIds`, ['concept'], { what: 'Concept' });
    checkReferenceList(bag, ids, scene.sourceIds, `${path}.sourceIds`, ['source'], { what: 'Source' });
    checkReferenceList(bag, ids, scene.detailIds, `${path}.detailIds`, ['detail'], { what: 'Detail' });
    checkReferenceList(bag, ids, scene.interactionIds, `${path}.interactionIds`, ['interaction'], { what: 'Interaction' });

    validateVisual(bag, scene.visual, `${path}.visual`, ids, expressionsByCharacter, isFinal(doc));
    validateSceneDialogue(bag, scene, path, ids);
    validateMainPath(bag, scene, path);

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

/** Whether the document declares itself finished. Unset counts as not final. */
const isFinal = (doc) => doc?.status?.final === true;

/**
 * The order a reader actually meets a beat's essential blocks.
 *
 * `narration`, `dialogue` and `limitations` stay three arrays, because they are
 * three different presentations. `mainPath` is the sequence, and it must be a
 * complete permutation of them: every paragraph, every line, and every visible
 * caveat exactly once. Anything less would let a block exist in the document
 * and never be read; anything more would print it twice.
 */
function validateMainPath(bag, scene, path) {
  const mainPathPath = `${path}.mainPath`;
  if (!checkArray(bag, scene.mainPath, mainPathPath, { allowEmpty: false })) return;

  const blocks = {
    narration: Array.isArray(scene.narration) ? scene.narration.length : 0,
    dialogue: Array.isArray(scene.dialogue) ? scene.dialogue.length : 0,
    limitations: Array.isArray(scene.limitations) ? scene.limitations.length : 0,
  };
  const seen = { narration: new Set(), dialogue: new Set(), limitations: new Set() };

  scene.mainPath.forEach((entry, index) => {
    const entryPath = `${mainPathPath}[${index}]`;
    if (!checkObject(bag, entry, entryPath, FIELDS.mainPath)) return;
    if (!checkEnum(bag, entry.kind, `${entryPath}.kind`, MAIN_PATH_KINDS)) return;
    if (!Number.isInteger(entry.index) || entry.index < 0) {
      bag.add(`${entryPath}.index`, 'MAIN_PATH_INDEX', `${entryPath}.index must be a whole number naming a position in ${entry.kind}.`);
      return;
    }
    if (entry.index >= blocks[entry.kind]) {
      bag.add(`${entryPath}.index`, 'MAIN_PATH_OUT_OF_RANGE', `${entryPath} points at ${entry.kind}[${entry.index}], but this scene has ${blocks[entry.kind]} ${entry.kind} entries.`);
      return;
    }
    if (seen[entry.kind].has(entry.index)) {
      bag.add(`${entryPath}.index`, 'MAIN_PATH_DUPLICATE', `${entry.kind}[${entry.index}] is already placed earlier in ${mainPathPath}. Each essential block is read once.`);
      return;
    }
    seen[entry.kind].add(entry.index);
  });

  for (const kind of MAIN_PATH_KINDS) {
    for (let index = 0; index < blocks[kind]; index += 1) {
      if (!seen[kind].has(index)) {
        bag.add(`${path}.${kind}[${index}]`, 'MAIN_PATH_INCOMPLETE', `${kind}[${index}] is never placed in ${mainPathPath}, so no reader would meet it. Add it where it belongs in the reading order.`);
      }
    }
  }
}

/**
 * A drawing and the figures in it. Scenes use this, and so does the landing:
 * one rule set, so the opening cannot quietly become a special case that
 * invents a cast or claims a drawing nobody made.
 */
function validateVisual(bag, visual, visualPath, ids, expressionsByCharacter, final) {
  if (!checkObject(bag, visual, visualPath, FIELDS.visual)) return;
  // The visual description doubles as the text alternative and as the static
  // equivalent when motion is reduced, so it is never optional.
  checkString(bag, visual.description, `${visualPath}.description`, {
    label: `${visualPath}.description (also the text alternative and reduced-motion equivalent)`,
  });
  if (!checkArray(bag, visual.cast, `${visualPath}.cast`)) return;
  validateSceneArt(bag, visual, visualPath, final);
  visual.cast.forEach((appearance, appearanceIndex) => {
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

/**
 * A scene either names a drawing or declares that it has none. Both are
 * legitimate: the written description is the text alternative, the
 * reduced-motion equivalent, and the print illustration, so a beat without a
 * composition still carries its meaning. What is rejected is a scene asking for
 * a drawing that does not exist, a layer a composition cannot show, or more
 * figures than it can place.
 */
function validateSceneArt(bag, visual, visualPath, final) {
  const { artId, artState, artAbsence } = visual;

  if (artId === null || artId === undefined) {
    if (artState !== null && artState !== undefined) {
      bag.add(`${visualPath}.artState`, 'ART_STATE_UNAVAILABLE', `${visualPath}.artState must be null while this scene has no composition. The written description is what carries the beat.`);
    }
    // An undrawn beat has to say which kind of undrawn it is. "Nobody has made
    // it yet" and "this one is deliberately not a picture" read the same in a
    // document and must not read the same to a reader.
    if (!ART_ABSENCE_REASONS.includes(artAbsence)) {
      bag.add(`${visualPath}.artAbsence`, 'ART_ABSENCE_UNDECLARED', `${visualPath}.artAbsence must be one of: ${ART_ABSENCE_REASONS.join(', ')}, because this beat has no drawing. Declare whether one is still to be made or whether this beat is intentionally text-only.`);
    } else if (final && artAbsence === 'pending') {
      bag.add(`${visualPath}.artAbsence`, 'PENDING_ART_IN_FINAL_CONTENT', `${visualPath}.artAbsence is "pending", which finished content may not contain. Draw the beat, or declare it "text-only" if it is deliberately not an illustrated situation.`);
    }

    // A text-only beat is rendered without a frame at all, so a cast listed on
    // one would be named nowhere: the document would say somebody is in a
    // drawing the reader is never shown. A beat whose art is merely pending
    // still has its frame and still names them.
    if (artAbsence === 'text-only' && Array.isArray(visual.cast) && visual.cast.length > 0) {
      bag.add(`${visualPath}.cast`, 'TEXT_ONLY_CAST', `${visualPath} is declared text-only, which is rendered with no frame and no names, so it may not place ${visual.cast.length} figure(s). Draw the beat, or move who is in it into the description.`);
    }
    return;
  }

  if (artAbsence !== null && artAbsence !== undefined) {
    bag.add(`${visualPath}.artAbsence`, 'ART_ABSENCE_DECLARED', `${visualPath}.artAbsence must be null while this beat names a drawing. A reason is only recorded where there is no drawing.`);
  }

  if (!checkString(bag, artId, `${visualPath}.artId`)) return;
  if (!hasComposition(artId)) {
    bag.add(`${visualPath}.artId`, 'UNKNOWN_ART_REFERENCE', `The artwork package draws no composition ${JSON.stringify(artId)}. Available compositions: ${COMPOSITION_IDS.join(', ')}. Use null to declare that this beat has no drawing yet.`);
    return;
  }

  if (checkEnum(bag, artState, `${visualPath}.artState`, ART_STATES) && artState === 'revealed' && !compositionHasReveal(artId)) {
    bag.add(`${visualPath}.artState`, 'ART_STATE_UNAVAILABLE', `Composition ${JSON.stringify(artId)} has no condition layer to reveal, so it can only be shown as "situation".`);
  }

  const range = figureRange(artId);
  const placed = Array.isArray(visual.cast) ? visual.cast.length : 0;
  if (placed < range.min || placed > range.max) {
    bag.add(`${visualPath}.cast`, 'ART_FIGURE_COUNT', `Composition ${JSON.stringify(artId)} places ${range.min} to ${range.max} figures, but this scene lists ${placed}. Choose a composition that fits the cast, or change the cast.`);
  }
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
  const numbers = new Map(); // displayed chapter number -> where it was claimed

  doc.chapters.forEach((chapter, index) => {
    const path = `chapters[${index}]`;
    if (!checkObject(bag, chapter, path, FIELDS.chapter)) return;
    checkString(bag, chapter.title, `${path}.title`);
    checkString(bag, chapter.question, `${path}.question`);
    // A chapter the reader counts carries its own number, so an opening that is
    // not one of the shared questions is not silently counted as the first of
    // them. `null` is the declared "this chapter is not numbered".
    if (chapter.number !== null && chapter.number !== undefined) {
      if (!Number.isInteger(chapter.number) || chapter.number < 1) {
        bag.add(`${path}.number`, 'INVALID_CHAPTER_NUMBER', `${path}.number must be a whole number of at least 1, or null for a chapter the reader does not count.`);
      } else if (numbers.has(chapter.number)) {
        bag.add(`${path}.number`, 'DUPLICATE_CHAPTER_NUMBER', `Chapter number ${chapter.number} is already used at ${numbers.get(chapter.number)}.`);
      } else {
        numbers.set(chapter.number, `${path}.number`);
      }
    }
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
  validateProject(bag, doc, ids, expressionsByCharacter);
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
