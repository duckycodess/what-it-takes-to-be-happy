#!/usr/bin/env node
/**
 * Content validation command.
 *
 *   npm run validate            # validates content/content.json
 *   npm run validate -- path    # validates another document
 *
 * Exits 0 when the document satisfies the contract, 1 with located errors
 * otherwise, so the build and CI can depend on it.
 */

import { DEFAULT_CONTENT_PATH, loadContent, ContentError } from '../content/load.js';
import { formatErrors } from '../content/validate.js';

const paths = process.argv.slice(2).filter((argument) => !argument.startsWith('-'));
const targets = paths.length > 0 ? paths : [DEFAULT_CONTENT_PATH];

let failed = false;

for (const target of targets) {
  try {
    const doc = await loadContent(target);
    console.log(`ok  ${target}: ${doc.chapters.length} chapter(s), ${doc.scenes.length} scene(s), `
      + `${doc.sourcesPage.sources.length} source(s), ${doc.assets.length} generated asset(s), `
      + `${doc.measure.words} main-path words.`);
  } catch (error) {
    failed = true;
    if (!(error instanceof ContentError)) throw error;
    console.error(`FAIL ${target}: ${error.errors.length} error(s)`);
    console.error(formatErrors(error.errors));
  }
}

process.exit(failed ? 1 : 0);
