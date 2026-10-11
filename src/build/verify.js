/**
 * Output checks that run as part of every build.
 *
 * These are not style preferences. They are what the build refuses to publish
 * without: an output that carries the complete approved argument, drawings
 * that are the inspected selected files and nothing else, alternative text on
 * every one of them, and a single-file export that needs nothing from a
 * network.
 *
 * The single-file export is retained tooling, not a release gate. Its checks
 * say what is true of it; its size is reported rather than treated as evidence
 * about the hosted site, which links its images instead of inlining them.
 */

import { esc, sourceAnchor } from '../runtime/render.js';
import { visibleText } from '../content/transfer.js';

/** Schemes a self-contained document may legitimately point at. */
const ALLOWED_HREF = /^(#|https?:|mailto:|data:)/;

const ELEMENT_WITH_REMOTE_CONTENT = /<(iframe|object|embed|video|audio|source|track)\b/gi;

/**
 * Reports every required resource the single-file export could not satisfy
 * from its own bytes. External `href` destinations on links are allowed: a
 * reader with no connection still sees every source entry and its access note,
 * and only following the link needs one.
 *
 * @param {string} html
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditSelfContainedHtml(html) {
  const problems = [];
  const report = (kind, value, message) => problems.push({ kind, value, message });

  for (const match of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']*)["']/gi)) {
    report('script-src', match[1], 'The single-file export must not load a script from anywhere else.');
  }

  for (const match of html.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']*)["']/gi)) {
    if (!match[1].startsWith('data:')) {
      report('link-href', match[1], 'The single-file export must not link to an external stylesheet or resource.');
    }
  }

  for (const match of html.matchAll(/\bsrcset\s*=\s*["']([^"']*)["']/gi)) {
    report('srcset', match[1], 'The single-file export must not declare alternative remote images.');
  }

  for (const match of html.matchAll(/<(?:img|source|iframe|embed|video|audio|script)\b[^>]*\bsrc\s*=\s*["']([^"']*)["']/gi)) {
    if (!match[1].startsWith('data:')) {
      report('src', match[1], 'Every embedded resource in the single-file export must be a data URI.');
    }
  }

  for (const match of html.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
    if (!match[2].startsWith('data:')) {
      report('css-url', match[2], 'Every stylesheet resource in the single-file export must be a data URI.');
    }
  }

  for (const match of html.matchAll(/@import\b[^;]*/gi)) {
    report('css-import', match[0], 'The single-file export must not import another stylesheet.');
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

/** Every reader-visible sentence of the main path, in reading order. */
export function readerSentences(content) {
  const order = content.chapters.flatMap((chapter) => chapter.sceneIds);
  const sceneById = new Map(content.scenes.map((scene) => [scene.id, scene]));
  return order.flatMap((id) => {
    const scene = sceneById.get(id);
    return [scene.title, ...scene.blocks.map((block) => visibleText(block.parts))];
  });
}

/**
 * Reports essential content an output dropped.
 *
 * Every scene title and every sentence of every block has to be present, as
 * does every scene's own element: a view that hides a scene on screen is a
 * choice about the screen, and an output that never wrote the scene at all
 * would have lost part of the argument for print and for a reader with no
 * script.
 *
 * @param {string} html
 * @param {object} content the validated content document
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditContentCoverage(html, content) {
  const problems = [];
  const missing = (kind, value) =>
    problems.push({ kind, value: String(value).slice(0, 80), message: 'This essential content is not present in the output.' });

  if (!html.includes(esc(content.landing.title))) missing('title', content.landing.title);

  for (const chapter of content.chapters) {
    if (!html.includes(esc(chapter.title))) missing('chapter-title', chapter.title);
    for (const sceneId of chapter.sceneIds) {
      if (!html.includes(`id="${sceneId}"`)) missing('scene', sceneId);
    }
  }

  for (const scene of content.scenes) {
    if (!html.includes(esc(scene.title))) missing('scene-title', scene.title);
    for (const block of scene.blocks) {
      // The citation marker is rendered as a link, so the sentence is checked
      // in the pieces the author wrote around it.
      for (const part of block.parts) {
        if (part.text === undefined) continue;
        if (!html.includes(esc(part.text))) missing('reader-copy', part.text);
      }
      if (block.kind === 'dialogue' && !html.includes(`>${esc(block.speaker)}<`)) {
        missing('speaker', block.speaker);
      }
    }
  }

  // Every control name the approved interface section fixes for the essay.
  // `backToReading` belongs to the Sources & Credits page and is required
  // there, by `auditSourcesCoverage`, rather than on every output.
  for (const [key, value] of Object.entries(content.interface)) {
    if (key === 'backToReading') continue;
    if (!html.includes(esc(value))) missing(`interface.${key}`, value);
  }

  return problems;
}

/**
 * Reports anything missing from the Sources & Credits output.
 *
 * @param {string} html
 * @param {object} content
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditSourcesCoverage(html, content) {
  const problems = [];
  const page = content.sourcesPage;
  const missing = (kind, value) =>
    problems.push({ kind, value: String(value).slice(0, 80), message: 'This approved page copy is not present in the output.' });

  const rich = (parts) => parts.map((part) => (part.link === undefined ? part.text : part.link)).join('');
  if (!html.includes(esc(page.title))) missing('sources-title', page.title);
  for (const key of ['intro', 'classNote', 'credits', 'methodNote']) {
    for (const part of page[key]) {
      const text = part.link === undefined ? part.text : part.link;
      if (!html.includes(esc(text))) missing(`sources-${key}`, text);
    }
  }
  if (!html.includes(esc(page.returnLabel))) missing('return-control', page.returnLabel);

  for (const source of page.sources) {
    if (!html.includes(`id="${sourceAnchor(source.number)}"`)) missing('source-anchor', source.number);
    if (!html.includes(esc(source.citation))) missing('source-citation', source.citation);
    if (!html.includes(esc(source.url))) missing('source-url', source.url);
    // The access note is what keeps an abstract from reading as a full text.
    if (!html.includes(esc(rich(source.note).trim().slice(0, 40)))) missing('source-note', source.number);
  }

  return problems;
}

/**
 * Checks every drawing in an output.
 *
 * The production artwork is the inspected generated files and nothing else: no
 * unselected provenance output, no resized or derived substitute, and no
 * drawing the content document did not ask for. Each one carries its approved
 * alternative text and its intrinsic dimensions, so a reader who cannot see it
 * is told what it shows and the layout reserves its box before it arrives.
 *
 * Only the first illustration a reader reaches is eager. Every other one waits,
 * which is what keeps 20.4 MB of selected cutouts off a phone's first screen.
 *
 * @param {string} html
 * @param {object} content
 * @param {{inline?: boolean}} [options] `inline` for the single-file export,
 *   whose images are data URIs and which has no lazy loading to check
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditArtwork(html, content, options = {}) {
  const problems = [];
  const report = (kind, value, message) => problems.push({ kind, value: String(value).slice(0, 80), message });

  const selected = new Map();
  for (const asset of content.assets) {
    for (const image of asset.images) selected.set(image.path, image);
  }
  const alts = new Set([...selected.values()].map((image) => image.alt));

  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  if (images.length === 0) report('artwork', 'none', 'The output carries no illustration at all.');

  let eager = 0;
  for (const tag of images) {
    const src = (tag.match(/\bsrc\s*=\s*"([^"]*)"/) || [])[1] ?? '';
    const alt = (tag.match(/\balt\s*=\s*"([^"]*)"/) || [])[1];

    if (options.inline) {
      if (!src.startsWith('data:image/png;base64,')) {
        report('image-src', src, 'The single-file export must carry every drawing as embedded PNG data.');
      }
    } else if (!selected.has(src)) {
      report('image-src', src, 'Every drawing must be one of the inspected selected assets, not a derived or unselected file.');
    } else if (selected.get(src).alt !== undefined && alt !== esc(selected.get(src).alt)) {
      report('image-alt', src, 'A drawing must carry the exact approved alternative text recorded for that cutout.');
    }

    if (alt === undefined || alt === '') {
      report('image-alt', src, 'Every drawing needs its approved alternative text.');
    } else if (!options.inline && !alts.has(alt.replace(/&#39;/g, "'").replace(/&amp;/g, '&'))) {
      report('image-alt', alt, 'This alternative text is not one of the approved strings.');
    }

    if (!/\bwidth\s*=\s*"\d+"/.test(tag) || !/\bheight\s*=\s*"\d+"/.test(tag)) {
      report('image-box', src, 'A drawing must declare its intrinsic width and height so its box is reserved before it loads.');
    }
    if (!/\bdecoding\s*=\s*"async"/.test(tag)) {
      report('image-decoding', src, 'A drawing should decode off the main thread.');
    }
    if (!/\bloading\s*=\s*"lazy"/.test(tag)) eager += 1;
  }

  if (!options.inline && eager > 1) {
    report('image-loading', `${eager} eager images`,
      'Only the first illustration a reader reaches loads eagerly; the rest wait until they are approached.');
  }

  // Nothing unselected may be served. The provider kept two source generations
  // purely as provenance, and a build that reached for one would be publishing
  // an output nobody selected.
  if (/source-generation\.png/.test(html)) {
    report('unselected-asset', 'source-generation.png', 'An unselected provenance output must never be served as production artwork.');
  }

  return problems;
}

/**
 * Reports lettering baked into the artwork.
 *
 * Names, dialogue labels and view labels are browser text positioned over the
 * image, never drawn into it. The manifests record that the bitmaps carry no
 * lettering; what this checks is the other half, that the output really does
 * write those labels as text a reader can select, resize and have read aloud.
 *
 * @param {string} html
 * @param {object} content
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditBrowserText(html, content) {
  const problems = [];
  const used = new Set(content.scenes.flatMap((scene) => scene.visual.views.map((view) => view.ref))
    .concat(content.landing.visual.views.map((view) => view.ref)));

  for (const asset of content.assets) {
    if (!used.has(asset.ref)) continue;
    for (const label of asset.labels) {
      if (!html.includes(`>${esc(label.text)}</span>`)) {
        problems.push({
          kind: 'browser-label',
          value: `${asset.ref}: ${label.text}`,
          message: 'Every name and prop label must be rendered as browser text over the drawing.',
        });
      }
    }
  }

  for (const scene of content.scenes) {
    for (const view of scene.visual.views) {
      if (view.label && !html.includes(`>${esc(view.label)}</`)) {
        problems.push({
          kind: 'view-label',
          value: `${scene.id}: ${view.label}`,
          message: 'Every exact view or comparison label must be present as browser text.',
        });
      }
    }
  }

  return problems;
}

/**
 * Reports a font this output carries but does not credit.
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
 * The bundled font's licence requires its permission notice to be included in
 * every copy of the font software. The single-file export is one such copy and
 * has no neighbouring files, so the notice has to be inside the document.
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
 * Reports any trace of the project typeface in the single-file export.
 *
 * The permission recorded for Futura Handwritten is the author's own note
 * granting use, which the owner accepted for this website. Serving the face is
 * already sending it — the hosted page delivers the file to every reader's
 * browser — so this check is not a line between distributing and not. It keeps
 * the font inside the context the owner approved: a page served from this
 * origin with the author credited, rather than a document that travels on its
 * own with no record attached.
 *
 * @param {string} html the single-file export
 * @param {Buffer} fontBytes the project typeface
 * @param {{family: string, published: string}} font
 * @returns {Array<{kind: string, value: string, message: string}>}
 */
export function auditProjectFontIsHostedOnly(html, fontBytes, font) {
  const problems = [];
  const report = (kind, value, message) => problems.push({ kind, value, message });

  const signature = fontBytes.toString('base64').slice(0, 512);
  if (html.includes(signature)) {
    report('project-font-bytes', font.published, 'The single-file export must not embed the project typeface; it is served by the hosted site only.');
  }
  if (html.includes(font.published)) {
    report('project-font-url', font.published, 'The single-file export must not point at the project typeface, which it cannot carry.');
  }
  if (html.includes(`'${font.family}'`) || html.includes(`"${font.family}"`)) {
    report('project-font-family', font.family, 'The single-file export must not name the project typeface in a font stack it has no face for.');
  }

  return problems;
}

/** Formats audit problems for a build failure message. */
export const formatProblems = (problems) =>
  problems.map((problem) => `  [${problem.kind}] ${problem.value}\n    ${problem.message}`).join('\n');
