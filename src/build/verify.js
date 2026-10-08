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

/** Formats audit problems for a build failure message. */
export const formatProblems = (problems) =>
  problems.map((problem) => `  [${problem.kind}] ${problem.value}\n    ${problem.message}`).join('\n');
