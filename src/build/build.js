#!/usr/bin/env node
/**
 * Builds the essay's outputs from one validated content document.
 *
 *   npm run build            -> dist/index.html (+ linked assets) and dist/offline.html
 *   npm run export:offline   -> dist/offline.html only
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
import { renderDocument } from '../runtime/render.js';
import { FONT, FONT_LICENSE, ILLUSTRATION, FONT_URL_TOKEN } from './assets.js';
import { toDataUri, withFontUrl } from './inline.js';
import { auditOfflineHtml, auditContentCoverage, auditBundledLicence, auditInlineArtwork, formatProblems } from './verify.js';

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

/**
 * Renders both outputs in memory. Exported so tests can build without writing
 * to disk and can compare the two documents directly.
 */
export async function buildOutputs(content) {
  const [css, script, fontBytes, fontLicense, illustrationBytes] = await Promise.all([
    readText(STYLESHEET),
    readText(READER_SCRIPT),
    read(FONT.source),
    readText(FONT_LICENSE.source),
    read(ILLUSTRATION.source),
  ]);

  const shared = {
    fontNotice: FONT.notice,
    fontLicense,
    illustration: {
      width: ILLUSTRATION.width,
      height: ILLUSTRATION.height,
      alt: ILLUSTRATION.alt,
      caption: ILLUSTRATION.caption,
    },
  };

  // Hosted: ordinary linked files, so the browser can cache them between visits.
  const hostedCss = withFontUrl(css, FONT_URL_TOKEN, FONT.published);
  const hosted = renderDocument(content, {
    ...shared,
    mode: 'hosted',
    stylesheetUrl: 'styles.css',
    scriptUrl: 'reader.js',
    illustration: { ...shared.illustration, url: ILLUSTRATION.published },
  });

  // Offline: one file that opens straight from disk with no network at all.
  const offlineCss = withFontUrl(css, FONT_URL_TOKEN, toDataUri(fontBytes, FONT.mediaType));
  const offline = renderDocument(content, {
    ...shared,
    mode: 'offline',
    inlineStyles: offlineCss,
    inlineScript: script,
    illustration: { ...shared.illustration, url: toDataUri(illustrationBytes, ILLUSTRATION.mediaType) },
  });

  return { hosted, hostedCss, script, offline, fontBytes, fontLicense, illustrationBytes };
}

/** Every check the build refuses to publish without. */
export function auditOutputs(outputs, content) {
  const offlineProblems = auditOfflineHtml(outputs.offline);
  if (offlineProblems.length > 0) fail('dist/offline.html depends on resources it does not carry', offlineProblems);

  for (const [label, html] of [['dist/index.html', outputs.hosted], ['dist/offline.html', outputs.offline]]) {
    const coverage = auditContentCoverage(html, content);
    if (coverage.length > 0) fail(`${label} does not carry the complete content`, coverage);

    const licence = auditBundledLicence(html, outputs.fontLicense);
    if (licence.length > 0) fail(`${label} does not carry the bundled font licence`, licence);

    const artwork = auditInlineArtwork(html);
    if (artwork.length > 0) fail(`${label} contains a drawing that reaches outside itself or carries its own lettering`, artwork);
  }
}

const sha = (data) => createHash('sha256').update(data).digest('hex').slice(0, 12);

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
    written.push(await write(join(DIST, 'styles.css'), outputs.hostedCss));
    written.push(await write(join(DIST, 'reader.js'), outputs.script));
    written.push(await write(join(DIST, FONT.published), outputs.fontBytes));
    written.push(await write(join(DIST, FONT_LICENSE.published), outputs.fontLicense));
    written.push(await write(join(DIST, ILLUSTRATION.published), outputs.illustrationBytes));
  }
  written.push(await write(join(DIST, 'offline.html'), outputs.offline));

  const draft = content.status.final ? 'final' : 'non-final';
  console.log(`Built ${content.chapters.length} chapter(s) and ${content.scenes.length} beat(s) from content/content.json (${draft}).`);
  for (const file of written) {
    console.log(`  ${relative(repoRoot, file.path).padEnd(48)} ${String(file.bytes).padStart(9)} bytes  sha256:${sha(await readFile(file.path))}`);
  }
  console.log(onlyOffline
    ? 'Offline export only. Open dist/offline.html directly in a browser.'
    : 'Hosted output is dist/ (publish directory). The offline submission file is dist/offline.html.');
}

// Run only when invoked directly, so tests can import these functions.
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
