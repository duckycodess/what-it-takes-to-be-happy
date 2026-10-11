/**
 * The committed font files themselves.
 *
 * Two questions that need no browser and that a browser answers badly. First,
 * whether the file in this repository is the one whose provenance and
 * permission `assets/fonts/README.md` records — a font is a binary nobody
 * reads in review, so its size and digest are pinned here and a replacement
 * has to come with a deliberate change to this test. Second, whether every
 * character the essay actually prints is drawn by a font the page carries:
 * the project typeface covers 219 code points, which is a real limit rather
 * than a theoretical one, and the fallback behind it is what makes that safe.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { buildOutputs } from '../src/build/build.js';
import { PROJECT_FONT, FALLBACK_FONT } from '../src/build/assets.js';
import { loadValidContent, repoRoot } from './helpers.js';

const bytes = (asset) => readFileSync(join(repoRoot, asset.source));
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/**
 * Every code point a TrueType font claims to draw.
 *
 * Only the two `cmap` subtable formats these files use are understood, and an
 * unknown one is an error rather than a silent gap, because a coverage check
 * that quietly reads nothing would pass for the wrong reason.
 */
function codePoints(font) {
  const read16 = (at) => font.readUInt16BE(at);
  const read32 = (at) => font.readUInt32BE(at);

  let cmap = null;
  for (let index = 0; index < read16(4); index += 1) {
    const entry = 12 + 16 * index;
    if (font.toString('latin1', entry, entry + 4) === 'cmap') cmap = read32(entry + 8);
  }
  assert.ok(cmap !== null, 'a font with no cmap table draws nothing');

  const covered = new Set();
  for (let index = 0; index < read16(cmap + 2); index += 1) {
    const subtable = cmap + read32(cmap + 4 + 8 * index + 4);
    const format = read16(subtable);

    if (format === 4) {
      const segments = read16(subtable + 6) / 2;
      const ends = subtable + 14;
      const starts = ends + segments * 2 + 2;
      for (let segment = 0; segment < segments; segment += 1) {
        const first = read16(starts + segment * 2);
        const last = read16(ends + segment * 2);
        if (first === 0xffff && last === 0xffff) continue;
        for (let point = first; point <= last; point += 1) covered.add(point);
      }
    } else if (format === 12) {
      const groups = read32(subtable + 12);
      for (let group = 0; group < groups; group += 1) {
        const at = subtable + 16 + 12 * group;
        for (let point = read32(at); point <= read32(at + 4); point += 1) covered.add(point);
      }
    } else if (format !== 0 && format !== 6) {
      throw new Error(`cmap subtable format ${format} is not understood, so coverage cannot be checked`);
    }
  }
  return covered;
}

/** The text a reader sees, with markup, styles, scripts, and data URIs gone. */
const visibleText = (html) =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');

test('the committed project typeface is the file whose permission was recorded', () => {
  const file = bytes(PROJECT_FONT);
  assert.equal(file.length, 51012, 'Futura Handwritten by Billy Snyder, from dafont.com/futurahandwritten.font');
  assert.equal(sha256(file), '15cc7ec3af6ae564792ce94d16c10c7d48eea197470ecb40705de4949bc45465');
  assert.equal(file.readUInt32BE(0), 0x00010000, 'a TrueType file, not a conversion of one');
});

test('the committed fallback is the licensed DejaVu Sans', () => {
  const file = bytes(FALLBACK_FONT);
  assert.equal(file.length, 759720);
  assert.equal(sha256(file), 'b4c632e3cdf9acc7f28758fb5a323c8524d7fc6660d46904d9b6cbe2809c419c');
  assert.match(readFileSync(join(repoRoot, 'assets/fonts/DejaVuSans.LICENSE.txt'), 'utf8'), /Bitstream Vera/);
});

/** Every character above the space that an output actually prints. */
function printedIn(html) {
  const printed = new Set();
  for (const character of visibleText(html)) {
    const point = character.codePointAt(0);
    if (point > 32) printed.add(point);
  }
  return printed;
}

test('every character either page prints is drawn by a font the site carries', async () => {
  const { hosted, sources } = await buildOutputs(loadValidContent());
  const project = codePoints(bytes(PROJECT_FONT));
  const fallback = codePoints(bytes(FALLBACK_FONT));

  // Both pages, because the register is where the quoted bibliographic detail
  // lives and is the half most likely to print something unusual.
  for (const [name, html] of [['the essay', hosted], ['Sources & Credits', sources]]) {
    const printed = printedIn(html);
    assert.ok(printed.size > 60, `${name} prints a real range of characters`);
    const uncovered = [...printed].filter((point) => !project.has(point) && !fallback.has(point));
    assert.deepEqual(uncovered, [], `${name} prints a character no packaged font can draw`);
  }

  // The gap the fallback exists to close, named rather than assumed. The
  // approved essay copy stays inside Futura Handwritten; the register does
  // not, because its page ranges are quoted from the papers themselves.
  // Respelling a citation to suit a font would be changing the evidence, so
  // the fallback draws the en dash instead.
  const missingFromProject = (html) => [...printedIn(html)]
    .filter((point) => !project.has(point))
    .sort((a, b) => a - b)
    .map((point) => String.fromCodePoint(point));

  assert.deepEqual(missingFromProject(hosted), [], 'the approved scene copy needs no fallback glyph');
  assert.deepEqual(
    missingFromProject(sources), ['–'],
    'this is the printed character Futura Handwritten has no glyph for',
  );
  assert.match(sources, /pp\. \d+–\d+/, 'the en dash is there because a page range is quoted');
  assert.ok(fallback.has(0x2013), 'the bundled fallback must draw U+2013');
});

test('the offline file prints nothing the fallback alone cannot draw', async () => {
  const { offline } = await buildOutputs(loadValidContent());
  const fallback = codePoints(bytes(FALLBACK_FONT));

  const uncovered = new Set();
  for (const character of visibleText(offline)) {
    const point = character.codePointAt(0);
    if (point > 32 && !fallback.has(point)) uncovered.add(character);
  }
  assert.deepEqual([...uncovered], [], 'the offline file carries one font and must be legible in it');
});
