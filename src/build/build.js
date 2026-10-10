#!/usr/bin/env node
/**
 * Builds the essay's outputs from one validated content document.
 *
 *   npm run build            -> dist/ (the hosted website) and dist/offline.html
 *   npm run export:offline   -> dist/offline.html only
 *
 * The hosted website is the deliverable: `index.html`, the separate
 * `sources.html`, the stylesheet, the script, the two fonts and the selected
 * generated artwork as linked files. Linking the drawings rather than
 * inlining them is deliberate — the 21 selected cutouts are 21.4 MB, and a
 * phone should fetch the one it is looking at.
 *
 * `dist/offline.html` is retained tooling, not a release gate. It inlines
 * every one of those images as base64 and is correspondingly enormous; the
 * build reports its size rather than treating a threshold as evidence about
 * the hosted site.
 *
 * The build is deterministic: nothing records a timestamp, a random value, or
 * a machine path, so the same commit always produces byte-identical output.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadContent, ContentError } from '../content/load.js';
import { formatErrors } from '../content/validate.js';
import { renderEssay, renderSourcesPage, sourceAnchor } from '../runtime/render.js';
import {
  PROJECT_FONT,
  FALLBACK_FONT,
  FALLBACK_FONT_LICENSE,
  FONT_URL_TOKEN,
  PROJECT_FONT_URL_TOKEN,
  HOSTED_ONLY_CSS,
} from './assets.js';
import { toDataUri, withFontUrl, withoutHostedOnly } from './inline.js';
import {
  auditSelfContainedHtml,
  auditContentCoverage,
  auditSourcesCoverage,
  auditArtwork,
  auditBrowserText,
  auditBundledLicence,
  auditFontNotices,
  auditProjectFontIsHostedOnly,
  formatProblems,
} from './verify.js';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DIST = join(repoRoot, 'dist');

const STYLESHEET = 'src/runtime/styles.css';
const READER_SCRIPT = 'src/runtime/reader.js';

const read = (path) => readFile(join(repoRoot, path));
const readText = (path) => readFile(join(repoRoot, path), 'utf8');

async function write(outputPath, data) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, data);
  return { path: outputPath, bytes: Buffer.byteLength(data) };
}

function fail(label, problems) {
  throw new Error(`${label}:\n${formatProblems(problems)}`);
}

/** Every selected image the content document actually uses. */
export const selectedImages = (content) =>
  content.assets.flatMap((asset) => asset.images.map((image) => image.path));

/**
 * Where a citation leads on the hosted site: the separate page, with the
 * originating scene and reading mode in the query so returning can restore
 * both, and the entry's own fragment so the reader lands on it.
 */
const hostedSourceHref = (number, sceneId) =>
  `sources.html${sceneId ? `?from=${sceneId}&view=scene` : ''}#${sourceAnchor(number)}`;

/**
 * Renders every output in memory. Exported so tests can build without writing
 * to disk and can compare the documents directly.
 */
export async function buildOutputs(content) {
  const [css, script, projectFontBytes, fontBytes, fontLicense] = await Promise.all([
    readText(STYLESHEET),
    readText(READER_SCRIPT),
    read(PROJECT_FONT.source),
    read(FALLBACK_FONT.source),
    readText(FALLBACK_FONT_LICENSE.source),
  ]);

  const artwork = new Map();
  await Promise.all(selectedImages(content).map(async (path) => artwork.set(path, await read(path))));

  // Hosted: ordinary linked files, so the browser caches them between visits,
  // and the only output the project typeface is served from.
  const hostedCss = withFontUrl(
    withFontUrl(css, FONT_URL_TOKEN, FALLBACK_FONT.published),
    PROJECT_FONT_URL_TOKEN,
    PROJECT_FONT.published,
  );
  const hostedOptions = {
    mode: 'hosted',
    stylesheetUrl: 'styles.css',
    scriptUrl: 'reader.js',
    sourcesHref: 'sources.html',
    sourceHref: hostedSourceHref,
  };
  const hosted = renderEssay(content, hostedOptions);
  const sources = renderSourcesPage(content, { ...hostedOptions, essayUrl: 'index.html' });

  // The single-file export: one document that opens straight from disk with
  // no network at all. The project typeface is not in it. Its permission
  // covers this site using the face, not a copy of the file travelling inside
  // a document handed to someone else, so the hosted-only region of the
  // stylesheet leaves here and the bundled fallback sets everything.
  const offlineCss = withFontUrl(
    withoutHostedOnly(css, HOSTED_ONLY_CSS),
    FONT_URL_TOKEN,
    toDataUri(fontBytes, FALLBACK_FONT.mediaType),
  );
  const offline = renderEssay(content, {
    mode: 'offline',
    inlineStyles: offlineCss,
    inlineScript: script,
    inlineSources: true,
    assetUrl: (path) => toDataUri(artwork.get(path), 'image/png'),
    sourcesHref: '#sources',
    sourceHref: (number) => `#${sourceAnchor(number)}`,
    fontLicense,
    fontNotice: FALLBACK_FONT.noticeAlone,
  });

  return { hosted, sources, hostedCss, script, offline, projectFontBytes, fontBytes, fontLicense, artwork };
}

/** Every check the build refuses to publish without. */
export function auditOutputs(outputs, content) {
  const essayOutputs = [
    ['dist/index.html', outputs.hosted, {}],
    ['dist/offline.html', outputs.offline, { inline: true }],
  ];

  for (const [label, html, options] of essayOutputs) {
    const coverage = auditContentCoverage(html, content);
    if (coverage.length > 0) fail(`${label} does not carry the complete approved argument`, coverage);

    const art = auditArtwork(html, content, options);
    if (art.length > 0) fail(`${label} does not present the inspected generated artwork correctly`, art);

    const text = auditBrowserText(html, content);
    if (text.length > 0) fail(`${label} does not render every name and label as browser text`, text);
  }

  const sourcesOutputs = [
    ['dist/sources.html', outputs.sources],
    ['dist/offline.html', outputs.offline],
  ];
  for (const [label, html] of sourcesOutputs) {
    const problems = auditSourcesCoverage(html, content);
    if (problems.length > 0) fail(`${label} does not carry the complete Sources & Credits page`, problems);
  }

  // The typeface credit is the owner-approved Sources & Credits copy, which
  // names Billy Snyder and the grant it is used under; `auditSourcesCoverage`
  // above is what requires it, and no renderer-written notice is added to the
  // reader's page. The single-file export credits the only face it actually
  // carries, which the approved copy does not mention because the website
  // does not bundle it.
  const credits = auditFontNotices(outputs.offline, [FALLBACK_FONT.noticeAlone]);
  if (credits.length > 0) fail('dist/offline.html does not credit the font it bundles', credits);

  const selfContained = auditSelfContainedHtml(outputs.offline);
  if (selfContained.length > 0) fail('dist/offline.html depends on resources it does not carry', selfContained);

  const leaked = auditProjectFontIsHostedOnly(outputs.offline, outputs.projectFontBytes, PROJECT_FONT);
  if (leaked.length > 0) fail('dist/offline.html carries the project typeface, which is served by the hosted site only', leaked);

  const licence = auditBundledLicence(outputs.offline, outputs.fontLicense);
  if (licence.length > 0) fail('dist/offline.html does not carry the bundled font licence', licence);
}

const sha = (data) => createHash('sha256').update(data).digest('hex').slice(0, 12);
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  const onlyOffline = process.argv.includes('--only=offline');

  let content;
  try {
    content = await loadContent(join(repoRoot, 'content/content.json'));
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
    console.error('Content validation failed; nothing was built.');
    console.error(formatErrors(error.errors));
    process.exit(1);
  }

  const outputs = await buildOutputs(content);
  auditOutputs(outputs, content);

  if (!onlyOffline) {
    // A clean directory keeps a stale file from a previous shape out of a deploy.
    await rm(DIST, { recursive: true, force: true });
  }
  await mkdir(DIST, { recursive: true });

  const written = [];
  if (!onlyOffline) {
    written.push(await write(join(DIST, 'index.html'), outputs.hosted));
    written.push(await write(join(DIST, 'sources.html'), outputs.sources));
    written.push(await write(join(DIST, 'styles.css'), outputs.hostedCss));
    written.push(await write(join(DIST, 'reader.js'), outputs.script));
    written.push(await write(join(DIST, PROJECT_FONT.published), outputs.projectFontBytes));
    written.push(await write(join(DIST, FALLBACK_FONT.published), outputs.fontBytes));
    written.push(await write(join(DIST, FALLBACK_FONT_LICENSE.published), outputs.fontLicense));
    for (const [path, bytes] of outputs.artwork) written.push(await write(join(DIST, path), bytes));
  }
  const offlineFile = await write(join(DIST, 'offline.html'), outputs.offline);
  written.push(offlineFile);

  console.log(`Built ${content.chapters.length} chapter(s) and ${content.scenes.length} scene(s) `
    + `from content/content.json (${content.measure.words} main-path words).`);
  for (const file of written) {
    console.log(`  ${relative(repoRoot, file.path).padEnd(56)} ${String(file.bytes).padStart(10)} bytes  sha256:${sha(await readFile(file.path))}`);
  }

  const hostedBytes = written.filter((file) => file !== offlineFile).reduce((sum, file) => sum + file.bytes, 0);
  if (!onlyOffline) {
    const first = written.find((file) => file.path.endsWith('index.html'));
    console.log(`Hosted output is dist/ (publish directory): ${mb(hostedBytes)} in total, of which the first `
      + `page is ${first.bytes} bytes of HTML plus the one eagerly loaded illustration; the rest of the artwork is lazy.`);
  }
  console.log(`dist/offline.html is retained tooling, not a release gate: ${mb(offlineFile.bytes)} with every `
    + 'drawing inlined as base64. The hosted site links those files instead.');
}

// Run only when invoked directly, so tests can import these functions.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
