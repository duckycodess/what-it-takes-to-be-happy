/** Reading a content document from disk, with validation attached. */

import { readFile } from 'node:fs/promises';
import { validateContent, formatErrors } from './validate.js';

/** The content document the hosted, offline, and print outputs all build from. */
export const DEFAULT_CONTENT_PATH = 'content/content.json';

export class ContentError extends Error {
  /**
   * @param {string} message
   * @param {Array<{path: string, code: string, message: string}>} errors
   */
  constructor(message, errors = []) {
    super(message);
    this.name = 'ContentError';
    this.errors = errors;
  }
}

/**
 * Parses JSON and reports the offending location rather than a bare
 * SyntaxError, because editors run this far more often than developers do.
 */
export function parseContent(text, label) {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new ContentError(`${label} is not valid JSON: ${cause.message}`, [
      { path: label, code: 'INVALID_JSON', message: cause.message },
    ]);
  }
}

/**
 * Reads, parses, and validates a content document.
 *
 * @param {string} path
 * @returns {Promise<object>} the validated document
 * @throws {ContentError} listing every validation error found
 */
export async function loadContent(path = DEFAULT_CONTENT_PATH) {
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch (cause) {
    throw new ContentError(`Cannot read content document ${path}: ${cause.message}`, [
      { path, code: 'UNREADABLE', message: cause.message },
    ]);
  }

  const doc = parseContent(text, path);
  const { valid, errors } = validateContent(doc);
  if (!valid) {
    throw new ContentError(`${path} failed content validation with ${errors.length} error(s):\n${formatErrors(errors)}`, errors);
  }
  return doc;
}
