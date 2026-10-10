/**
 * Content contract constants for the illustrated happiness essay.
 *
 * This module is the single source of truth for registry names, enumerated
 * values, and identifier rules. `validate.js` enforces them; `docs/content-
 * contract.md` documents them for editors. Changing a value here is a contract
 * change and must be reflected in both.
 *
 * The contract describes a document transferred from the approved scene
 * script, not an editable manuscript. Nothing here asks for a field a
 * renderer would have to write prose to fill: the old mandatory chapter
 * question, project summary, reading-time estimate, chapter bridges and
 * disclosure-panel bodies are gone, because the approved script contains no
 * such copy and inventing it is exactly what this rewrite removed.
 */

export { SCHEMA_ID, LAYOUTS, SPEAKERS, CHAPTER_ANCHORS, APPROVED_SCRIPT } from './transfer.js';

/** Every registry stored in a content document, in document order. */
export const REGISTRIES = ['chapters', 'scenes', 'assets'];

/** Stable identifiers: ASCII alphanumerics in hyphen-separated groups. */
export const ID_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

/** A scene identifier keeps its historical `s088`–`s132` meaning. */
export const SCENE_ID_PATTERN = /^s\d{3}$/;

/** A chapter identifier is its number. */
export const CHAPTER_ID_PATTERN = /^c[1-8]$/;

/** An art reference as the approved brief table writes it. */
export const ASSET_REF_PATTERN = /^A\d{2}[ab]?$/;

/** A generated asset's folder name under `assets/generated/`. */
export const ASSET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The two kinds of block on the main reading path. */
export const BLOCK_KINDS = ['narration', 'dialogue'];

/** A source must be reachable over the web; nothing else is a citable destination. */
export const SOURCE_URL_PATTERN = /^https?:\/\/[^\s]+$/;

/**
 * How far a source was actually checked, in the audit's own vocabulary.
 *
 * The distinctions matter and are carried to the reader as the access note the
 * approved register already writes: a publisher's description of a book is not
 * a passage from it, and an abstract establishes only what the abstract
 * states. The label is what the Sources & Credits page shows beside an entry.
 */
export const SOURCE_AUDIT_STATUSES = {
  'verified-full': { label: 'Read in full' },
  'verified-abstract': { label: 'Abstract only' },
  'verified-locator': { label: 'Publisher or catalogue description only' },
};

/** The accepted values of a source's `auditStatus`. */
export const SOURCE_AUDIT_LEVELS = Object.keys(SOURCE_AUDIT_STATUSES);

/** An R identifier from the project's own research register. */
export const SOURCE_ID_PATTERN = /^R\d{2}$/;

/** The two manifest generations a delivered asset can have been inspected in. */
export const MANIFEST_GENERATIONS = ['a01', 'a02-a18'];

/** The two kinds of browser label anchored over a drawing. */
export const LABEL_KINDS = ['name', 'prop'];

/** The interface strings every output must carry, exactly as approved. */
export const INTERFACE_KEYS = [
  'title', 'begin', 'sources', 'chapters', 'continuous', 'scene',
  'print', 'skip', 'back', 'next', 'readAgain', 'backToReading',
];

/** The reader-facing blocks of the Sources & Credits page. */
export const SOURCES_PAGE_KEYS = ['title', 'intro', 'classNote', 'credits', 'methodNote', 'returnLabel', 'sources'];

/** How many scenes and chapters the approved argument has. */
export const SCENE_COUNT = 45;
export const CHAPTER_COUNT = 8;
export const SOURCE_COUNT = 26;
