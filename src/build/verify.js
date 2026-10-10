/**
 * Output checks that run as part of every build.
 *
 * These are not style preferences. They are the two promises the architecture
 * makes about packaging: the offline file needs nothing from a network, and no
 * output quietly loses essential content or leaks authoring material.
 */

import { esc } from '../runtime/render.js';

/** Schemes an offline document may legitimately point at. */
const ALLOWED_HREF = /^(#|https?:|mailto:|data:)/;

const ELEMENT_WITH_REMOTE_CONTENT = /<(iframe|object|embed|video|audio|source|track)\b/gi;

/**
 * Reports every required resource the offline document could not satisfy from
 * its own bytes. External `href` destinations on links are allowed: a reader
 * offline still sees each source's label, role, and limitation, and only
 * following the link needs a connection.
 *
 * @param {string} html
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditOfflineHtml(html) {
  const problems = [];
  const report = (kind, value, message) => problems.push({ kind, value, message });

  for (const match of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']*)["']/gi)) {
    report('script-src', match[1], 'The offline file must not load a script from anywhere else.');
  }

  for (const match of html.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']*)["']/gi)) {
    if (!match[1].startsWith('data:')) {
      report('link-href', match[1], 'The offline file must not link to an external stylesheet or resource.');
    }
  }

  for (const match of html.matchAll(/\bsrcset\s*=\s*["']([^"']*)["']/gi)) {
    report('srcset', match[1], 'The offline file must not declare alternative remote images.');
  }

  for (const match of html.matchAll(/<(?:img|source|iframe|embed|video|audio|script)\b[^>]*\bsrc\s*=\s*["']([^"']*)["']/gi)) {
    if (!match[1].startsWith('data:')) {
      report('src', match[1], 'Every embedded resource in the offline file must be a data URI.');
    }
  }

  for (const match of html.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
    if (!match[2].startsWith('data:')) {
      report('css-url', match[2], 'Every stylesheet resource in the offline file must be a data URI.');
    }
  }

  for (const match of html.matchAll(/@import\b[^;]*/gi)) {
    report('css-import', match[0], 'The offline file must not import another stylesheet.');
  }

  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']*)["']/gi)) {
    if (!ALLOWED_HREF.test(match[1])) {
      report('a-href', match[1], 'A relative link would not resolve from a local file; use a fragment or a full destination.');
    }
  }

  for (const match of html.matchAll(ELEMENT_WITH_REMOTE_CONTENT)) {
    report('element', match[1], 'This element type is not used by the essay and would risk a remote dependency.');
  }

  return problems;
}

/**
 * Reports essential content that an output dropped, and any authoring material
 * that leaked into it.
 *
 * @param {string} html
 * @param {object} content the validated content document
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditContentCoverage(html, content) {
  const problems = [];
  const missing = (kind, value) =>
    problems.push({ kind, value, message: 'This essential content is not present in the output.' });

  const requireText = (kind, text) => {
    if (!html.includes(esc(text))) missing(kind, text);
  };

  requireText('project-question', content.project.question);
  requireText('project-summary', content.project.summary);
  // The landing's drawing has a text alternative like every other drawing, and
  // an output that dropped it would leave the opening unexplained.
  if (content.project.visual) requireText('landing-visual-description', content.project.visual.description);
  if (!content.status.final) requireText('draft-notice', content.status.notice);

  for (const chapter of content.chapters) {
    requireText('chapter-title', chapter.title);
    requireText('chapter-opening', chapter.opening);
    requireText('chapter-closing', chapter.closing);
    for (const sceneId of chapter.sceneIds) {
      if (!html.includes(`id="${sceneId}"`)) missing('scene', sceneId);
    }
  }

  for (const scene of content.scenes) {
    requireText('scene-title', scene.title);
    for (const paragraph of scene.narration) requireText('narration', paragraph);
    for (const limitation of scene.limitations) requireText('limitation', limitation);
    for (const line of scene.dialogue) requireText('dialogue', line.text);
    requireText('visual-description', scene.visual.description);
  }

  for (const detail of content.details) {
    requireText('detail-title', detail.title);
    for (const paragraph of detail.body) requireText('detail-body', paragraph);
  }

  for (const source of content.sources) {
    requireText('source-label', source.label);
    requireText('source-limitation', source.limitation);
  }

  for (const character of content.cast) {
    if (character.role === 'member') requireText('member-name', character.displayName);
  }

  // Authoring provenance is never published, so none of it may appear.
  for (const record of content.provenance) {
    for (const [field, value] of [['note', record.note], ['sourceNote', record.sourceNote]]) {
      if (html.includes(esc(value))) {
        problems.push({
          kind: 'provenance-leak',
          value: `${record.id}.${field}`,
          message: 'Authoring provenance reached the output. The product shows citations and context, not editorial workflow.',
        });
      }
    }
  }

  return problems;
}

/**
 * Patterns that would make an inline drawing depend on something outside the
 * document, or put lettering inside the artwork where it cannot be selected,
 * searched, translated, or resized by the reader.
 */
const ARTWORK_RULES = [
  [/<image\b/i, 'An <image> element would embed or fetch a raster file inside the drawing.'],
  [/<use\b/i, 'A <use> element depends on an element identifier, which collides as soon as the same drawing appears twice.'],
  [/<foreignObject\b/i, 'A <foreignObject> puts HTML inside the drawing instead of beside it.'],
  [/<text\b/i, 'Lettering belongs in the page as browser text, never inside the artwork.'],
  [/<(style|script)\b/i, 'A drawing must not carry its own stylesheet or script.'],
  [/\bxlink:href\s*=/i, 'An xlink:href reaches outside the element that draws it.'],
  [/\bhref\s*=/i, 'A drawing must not link anywhere; its explanation is the text beside it.'],
  [/\bid\s*=/i, 'An element identifier inside a drawing collides when the same drawing is used twice.'],
  [/\bfont-family\s*[:=]/i, 'A drawing must not depend on a font being available.'],
  [/url\s*\(/i, 'A drawing must not reference another resource.'],
];

/**
 * Checks every inline drawing in an output.
 *
 * The artwork is generated into the markup rather than linked, which is what
 * lets one HTML file carry the whole illustrated essay. These rules are what
 * keep that true, and what keep every name and word in the essay real browser
 * text rather than lettering baked into a picture.
 *
 * @param {string} html
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditInlineArtwork(html) {
  const problems = [];
  const drawings = [...html.matchAll(/<svg\b[\s\S]*?<\/svg>/gi)].map((match) => match[0]);

  for (const drawing of drawings) {
    for (const [pattern, message] of ARTWORK_RULES) {
      const found = drawing.match(pattern);
      if (found) problems.push({ kind: 'artwork', value: found[0], message });
    }
  }

  return problems;
}

/**
 * The bundled font's licence requires its permission notice to be included in
 * every copy of the font software. The offline file is one such copy and has no
 * neighbouring files, so the notice has to be inside the document itself.
 *
 * @param {string} html
 * @param {string} licenceText
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditBundledLicence(html, licenceText) {
  if (html.includes(esc(licenceText.trimEnd()))) return [];
  return [{
    kind: 'font-licence',
    value: 'bundled font licence',
    message: 'The complete font licence text must be embedded in the document, because the licence requires its notice to travel with every copy of the font.',
  }];
}

/**
 * Reports a font this output carries but does not credit.
 *
 * The two outputs carry different faces, so they owe different credits, and a
 * notice naming a font that is not in the document would be as wrong as a
 * missing one. Each output is checked against its own list.
 *
 * @param {string} html
 * @param {string[]} notices the credits this output is required to carry
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditFontNotices(html, notices) {
  return notices
    .filter((notice) => !html.includes(esc(notice)))
    .map((notice) => ({
      kind: 'font-credit',
      value: notice.slice(0, 60),
      message: 'Every font an output carries must be credited in that output, with its author and the permission it is served under.',
    }));
}

/**
 * Reports any trace of the project typeface in the offline document.
 *
 * The permission recorded for Futura Handwritten is the author's own note
 * granting use, which the owner accepted for this website. Serving the face is
 * already sending it — the hosted page delivers the file to every reader's
 * browser — so this check is not a line between distributing and not. It keeps
 * the font inside the context the owner approved: a page served from this
 * origin with the author credited, rather than a document that travels on its
 * own with no record attached. So the offline file must contain neither the
 * font's data nor a rule that would reach for it. The bytes are checked by
 * their own base64, not by a filename, because a data URI has no filename to
 * look for.
 *
 * @param {string} html the offline document
 * @param {Buffer} fontBytes the project typeface
 * @param {{family: string, published: string}} font
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditProjectFontIsHostedOnly(html, fontBytes, font) {
  const problems = [];
  const report = (kind, value, message) => problems.push({ kind, value, message });

  // A base64 run long enough to be unmistakably this file and short enough to
  // find quickly. Any embedding of the font contains it.
  const signature = fontBytes.toString('base64').slice(0, 512);
  if (html.includes(signature)) {
    report('project-font-bytes', font.published, 'The offline file must not embed the project typeface; it is served by the hosted site only.');
  }

  if (html.includes(font.published)) {
    report('project-font-url', font.published, 'The offline file must not point at the project typeface, which it cannot carry.');
  }

  if (html.includes(`'${font.family}'`) || html.includes(`"${font.family}"`)) {
    report('project-font-family', font.family, 'The offline file must not name the project typeface in a font stack it has no face for.');
  }

  return problems;
}

/** Formats audit problems for a build failure message. */
export const formatProblems = (problems) =>
  problems.map((problem) => `  [${problem.kind}] ${problem.value}\n    ${problem.message}`).join('\n');
