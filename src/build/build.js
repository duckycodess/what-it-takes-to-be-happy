#!/usr/bin/env node
/**
 * Builds the essay's outputs from one validated content document.
 *
 *   npm run build            -> dist/ (the hosted website, and nothing else)
 *   npm run export:offline   -> dist/offline.html only
 *
 * The hosted website is the deliverable: `index.html`, the separate
 * `sources.html`, the stylesheet, the script, the two fonts and the selected
 * generated artwork as linked files. Linking the drawings rather than
 * inlining them is deliberate — the 22 selected cutouts are 20.4 MB, and a
 * phone should fetch the one it is looking at.
 *
 * `dist/offline.html` is retained tooling, not a release gate, and since the
 * 9 October 2026 owner amendment it is no longer part of what gets published.
 * Every build still renders it in memory and still runs every packaging audit
 * over it, because those audits are what prove the hosted page's resources are
 * all committed and accounted for — but only an explicit `--only=offline`
 * export writes it to disk. A normal build clears `dist/` first, so a file
 * left behind by an earlier export never reaches a deploy.
 *
 * That ordering matters the other way round too: `dist/` is only safe to
 * publish when it is the output of a normal build. A directory an export has
 * since added to is not, which is why nothing here uploads a prebuilt tree.
 *
 * The build is deterministic: nothing records a timestamp, a random value, or
 * a machine path, so the same commit always produces byte-identical output.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadContent, ContentError } from '../content/load.js';
import { APPROVED_ESSAY } from '../content/transfer.js';
import { formatErrors } from '../content/validate.js';
import { buildContent, serialise, CONTENT_PATH } from '../tools/transfer.js';
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

/** A selected drawing whose bytes are not the inspected ones. */
export class ArtworkError extends Error {}

/**
 * Reads every selected drawing, and refuses any whose bytes have changed.
 *
 * The content document records the SHA-256 the provider's manifest was
 * inspected at. Nothing downstream re-reads it: `auditArtwork` works on the
 * rendered markup — the path, the dimensions, the alternative text — so a file
 * replaced or corrupted in place would be published with its manifest and its
 * content entry still agreeing with each other and with the page.
 *
 * `npm test` does compare these digests, but a deployment runs `npm run build`
 * and nothing else, so the comparison has to happen on this path. Bytes that
 * fail it never enter the output map.
 */
async function readSelectedArtwork(content) {
  const recorded = new Map();
  for (const asset of content.assets) {
    for (const image of asset.images) recorded.set(image.path, image.sha256);
  }

  const artwork = new Map();
  const problems = [];

  await Promise.all([...recorded.keys()].map(async (path) => {
    let bytes;
    try {
      bytes = await read(path);
    } catch (error) {
      problems.push({ kind: 'artwork', value: path, message: `The selected drawing could not be read: ${error.code ?? error.message}.` });
      return;
    }
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== recorded.get(path)) {
      problems.push({
        kind: 'artwork',
        value: path,
        message: `The file is ${digest}, not the inspected ${recorded.get(path)}.`,
      });
      return;
    }
    artwork.set(path, bytes);
  }));

  if (problems.length > 0) {
    throw new ArtworkError(`The selected artwork is not the artwork that was inspected:\n${formatProblems(problems)}`);
  }
  return artwork;
}

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

  const artwork = await readSelectedArtwork(content);

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
  // The export is audited on every build even though only an explicit export
  // writes it: these are the checks that say every resource the hosted page
  // needs is committed and accounted for, and they are worth nothing if they
  // only run on the command nobody deploying ever types.
  const EXPORT = 'the single-file export';
  const essayOutputs = [
    ['dist/index.html', outputs.hosted, {}],
    [EXPORT, outputs.offline, { inline: true }],
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
    [EXPORT, outputs.offline],
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
  if (credits.length > 0) fail(`${EXPORT} does not credit the font it bundles`, credits);

  const selfContained = auditSelfContainedHtml(outputs.offline);
  if (selfContained.length > 0) fail(`${EXPORT} depends on resources it does not carry`, selfContained);

  const leaked = auditProjectFontIsHostedOnly(outputs.offline, outputs.projectFontBytes, PROJECT_FONT);
  if (leaked.length > 0) fail(`${EXPORT} carries the project typeface, which is served by the hosted site only`, leaked);

  const licence = auditBundledLicence(outputs.offline, outputs.fontLicense);
  if (licence.length > 0) fail(`${EXPORT} does not carry the bundled font licence`, licence);
}

const sha = (data) => createHash('sha256').update(data).digest('hex').slice(0, 12);
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * The approved-copy gate, run by the build itself.
 *
 * Structural validation says the document is well formed. It cannot say the
 * prose is the owner's: a careful hand edit to a narration block passes every
 * schema rule, and `source.sha256` is only checked for being a hash. The
 * deployment runs `npm run build` and nothing else, so a gate that lives only
 * in `npm run validate` is a gate the deployment walks around.
 *
 * Rebuilding the document from the approved script answers both questions at
 * once: `transfer()` refuses a script whose bytes are not the approved ones,
 * and the result is compared with what is committed, so any edit to either
 * side fails the build instead of publishing.
 */
async function enforceApprovedTransfer() {
  let expected;
  try {
    expected = serialise(await buildContent(repoRoot));
  } catch (error) {
    console.error(`The approved transfer could not be rebuilt from ${APPROVED_ESSAY.markdown.path}; nothing was built.`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const committed = await readFile(join(repoRoot, CONTENT_PATH), 'utf8').catch(() => null);
  if (committed !== expected) {
    console.error(`${CONTENT_PATH} is not what ${APPROVED_ESSAY.markdown.path} transfers to; nothing was built.`);
    console.error('The published copy must be the approved copy. Run: npm run content:transfer');
    process.exit(1);
  }
}

async function main() {
  const onlyOffline = process.argv.includes('--only=offline');

  await enforceApprovedTransfer();

  let content;
  try {
    content = await loadContent(join(repoRoot, 'content/content.json'));
  } catch (error) {
    if (!(error instanceof ContentError)) throw error;
    console.error('Content validation failed; nothing was built.');
    console.error(formatErrors(error.errors));
    process.exit(1);
  }

  let outputs;
  try {
    outputs = await buildOutputs(content);
  } catch (error) {
    if (!(error instanceof ArtworkError)) throw error;
    console.error('Artwork verification failed; nothing was built.');
    console.error(error.message);
    process.exit(1);
  }
  auditOutputs(outputs, content);

  if (!onlyOffline) {
    // A clean directory keeps a stale file from a previous shape — an
    // offline.html an export wrote here among them — out of a deploy.
    await rm(DIST, { recursive: true, force: true });
  }
  await mkdir(DIST, { recursive: true });

  const written = [];
  if (onlyOffline) {
    written.push(await write(join(DIST, 'offline.html'), outputs.offline));
  } else {
    written.push(await write(join(DIST, 'index.html'), outputs.hosted));
    written.push(await write(join(DIST, 'sources.html'), outputs.sources));
    written.push(await write(join(DIST, 'styles.css'), outputs.hostedCss));
    written.push(await write(join(DIST, 'reader.js'), outputs.script));
    written.push(await write(join(DIST, PROJECT_FONT.published), outputs.projectFontBytes));
    written.push(await write(join(DIST, FALLBACK_FONT.published), outputs.fontBytes));
    written.push(await write(join(DIST, FALLBACK_FONT_LICENSE.published), outputs.fontLicense));
    for (const [path, bytes] of outputs.artwork) written.push(await write(join(DIST, path), bytes));
  }

  console.log(`Built ${content.chapters.length} chapter(s) and ${content.scenes.length} scene(s) `
    + `from content/content.json (${content.measure.words} main-path words).`);
  for (const file of written) {
    console.log(`  ${relative(repoRoot, file.path).padEnd(56)} ${String(file.bytes).padStart(10)} bytes  sha256:${sha(await readFile(file.path))}`);
  }

  if (onlyOffline) {
    const [offlineFile] = written;
    console.log(`dist/offline.html is retained tooling, not a release gate: ${mb(offlineFile.bytes)} with every `
      + 'drawing inlined as base64. The hosted site links those files instead.');
    console.log('dist/ now holds an export and is no longer the published output. Run `npm run build` '
      + 'before deploying; it clears this file out again.');
    return;
  }

  const hostedBytes = written.reduce((sum, file) => sum + file.bytes, 0);
  const first = written.find((file) => file.path.endsWith('index.html'));
  console.log(`Hosted output is dist/ (publish directory): ${mb(hostedBytes)} in total, of which the first `
    + `page is ${first.bytes} bytes of HTML plus the one eagerly loaded illustration; the rest of the artwork is lazy.`);
  console.log(`Audited but not published: the ${mb(Buffer.byteLength(outputs.offline))} single-file export. `
    + 'It is retained tooling, not a deliverable; `npm run export:offline` writes it when it is wanted.');
}

// Run only when invoked directly, so tests can import these functions.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
