/**
 * Content contract constants for the illustrated happiness essay.
 *
 * This module is the single source of truth for registry names, enumerated
 * values, and identifier rules. `validate.js` enforces them; `docs/content-
 * contract.md` documents them for editors. Changing a value here is a contract
 * change and must be reflected in both.
 */

export const SCHEMA_ID = 'happiness-essay-content/v1';

/** Every registry stored in a content document, in document order. */
export const REGISTRIES = [
  'chapters',
  'scenes',
  'cast',
  'sources',
  'concepts',
  'details',
  'interactions',
  'provenance',
];

/**
 * Registries the reader may publish. `provenance` records why a member
 * position or an editorial change exists; it is authoring material and never
 * reaches hosted, offline, or print output.
 */
export const AUTHORING_ONLY_REGISTRIES = ['provenance'];

/** Stable identifiers: ASCII alphanumerics in hyphen-separated groups. */
export const ID_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

/** Who a line of dialogue speaks for. */
export const DIALOGUE_STANCES = ['member-endorsed', 'fictional-illustration'];

/**
 * How far a source was actually checked, using the evidence levels the source
 * audit recorded in docs/research.md. The distinctions matter: a publisher's
 * description of a book is not a passage from it, and an abstract establishes
 * only what the abstract states.
 *
 * - `requiresRecord` — the source must name its bibliographic detail and what
 *   was actually opened.
 * - `requiresSupportedClaim` — the source must state what the material read
 *   supports. Where it is false, stating one is rejected: nothing inside the
 *   work was read.
 * - `claimLabel` — how the reader is told what that claim rests on, so an
 *   abstract-level or description-level reading is never shown as more.
 */
export const SOURCE_EVIDENCE_LEVELS = {
  unreviewed: {
    label: 'Not checked yet',
    requiresRecord: false,
    requiresSupportedClaim: false,
    claimLabel: null,
  },
  'not-accessed': {
    label: 'Could not be opened',
    requiresRecord: true,
    requiresSupportedClaim: false,
    claimLabel: null,
  },
  'verified-locator': {
    label: 'Publisher or catalogue description only',
    requiresRecord: true,
    requiresSupportedClaim: true,
    claimLabel: "The publisher's description supports",
  },
  'verified-abstract': {
    label: 'Abstract only',
    requiresRecord: true,
    requiresSupportedClaim: true,
    claimLabel: 'The abstract supports',
  },
  'verified-full': {
    label: 'Read in full',
    requiresRecord: true,
    requiresSupportedClaim: true,
    claimLabel: 'The passage read supports',
  },
};

/** The accepted values of a source's `reviewStatus`. */
export const SOURCE_REVIEW_STATUSES = Object.keys(SOURCE_EVIDENCE_LEVELS);

/** A source must be reachable over the web; nothing else is a citable destination. */
export const SOURCE_URL_PATTERN = /^https?:\/\/[^\s]+$/;

/** A cast entry is one of the three contributors or an invented friend. */
export const CAST_ROLES = ['member', 'friend'];

/** Whether a concept has authored explanation/application/criticism text yet. */
export const CONCEPT_STATUSES = ['planned', 'drafted'];

/** Reader surfaces that an interaction can attach to. */
export const INTERACTION_SURFACES = ['scene-detail', 'source-detail'];
