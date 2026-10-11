#!/usr/bin/env node
/**
 * Rewrites `content/content.json` from the approved essay.
 *
 *   npm run content:transfer           # write the content document
 *   npm run content:transfer -- --check  # fail if it is out of date
 *
 * The two approved documents in `docs/editorial/` and the asset manifests are
 * the inputs; this file is the only thing that writes the content document,
 * and `test/transfer.test.js` reruns it to prove the committed copy is the one
 * this produces.
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { transfer, APPROVED_ESSAY } from '../content/transfer.js';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENT_PATH = 'content/content.json';
const GENERATED = 'assets/generated';

/** Every delivered asset manifest, read in a stable order. */
export async function readManifests(root = repoRoot) {
  const directories = (await readdir(join(root, GENERATED), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  return Promise.all(directories.map(async (name) =>
    JSON.parse(await readFile(join(root, GENERATED, name, 'manifest.json'), 'utf8'))));
}

/** The content document the approved essay and the delivered assets imply. */
export async function buildContent(root = repoRoot) {
  const [markdown, handoffJson, sourceMap, manifests] = await Promise.all([
    readFile(join(root, APPROVED_ESSAY.markdown.path), 'utf8'),
    readFile(join(root, APPROVED_ESSAY.handoff.path), 'utf8'),
    readFile(join(root, 'docs/redesign/source-map.json'), 'utf8').then(JSON.parse),
    readManifests(root),
  ]);
  return transfer({ markdown, handoffJson, manifests, sourceMap });
}

export const serialise = (document) => `${JSON.stringify(document, null, 2)}\n`;

async function main() {
  const check = process.argv.includes('--check');
  const document = await buildContent();
  const text = serialise(document);
  const path = join(repoRoot, CONTENT_PATH);

  if (check) {
    const current = await readFile(path, 'utf8').catch(() => '');
    if (current !== text) {
      console.error(`${CONTENT_PATH} is not what the approved essay transfers to. Run: npm run content:transfer`);
      process.exit(1);
    }
    console.log(`ok  ${CONTENT_PATH} matches ${APPROVED_ESSAY.markdown.path}`);
    return;
  }

  await writeFile(path, text);
  console.log(`Transferred ${document.scenes.length} parts, ${document.chapters.length} chapters, `
    + `${document.sourcesPage.sources.length} sources and ${document.assets.length} assets `
    + `into ${CONTENT_PATH} (${document.measure.words} main-path words), `
    + `with ${document.relocations.length} old addresses relocated.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
