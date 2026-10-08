/** Shared test helpers: load the real content document, then break copies of it. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export const readJson = (relativePath) => JSON.parse(readFileSync(join(repoRoot, relativePath), 'utf8'));

/** A fresh deep copy of the authored content document for each mutation test. */
export const loadValidContent = () => readJson('content/content.json');

export const clone = (value) => structuredClone(value);

/** Finds an entry by stable identifier, failing loudly if the fixture changed. */
export function byId(list, id) {
  const found = list.find((entry) => entry.id === id);
  if (!found) throw new Error(`Test fixture no longer contains ${id}`);
  return found;
}

/** The validation error codes reported at a given path. */
export const codesAt = (errors, path) => errors.filter((error) => error.path === path).map((error) => error.code);

export const codes = (errors) => errors.map((error) => error.code);
