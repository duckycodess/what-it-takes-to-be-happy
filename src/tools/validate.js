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
    const scenes = doc.scenes.length;
    const chapters = doc.chapters.length;
    const draft = doc.status.final ? 'final' : 'non-final';
    console.log(`ok  ${target}: ${chapters} chapter(s), ${scenes} scene(s), ${doc.sources.length} source(s), marked ${draft}.`);
  } catch (error) {
    failed = true;
    if (!(error instanceof ContentError)) throw error;
    console.error(`FAIL ${target}: ${error.errors.length} error(s)`);
    console.error(formatErrors(error.errors));
  }
}

process.exit(failed ? 1 : 0);
