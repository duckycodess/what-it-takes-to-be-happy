/**
 * The binary resources the essay packages.
 *
 * Two faces, with different rights and different jobs. The project typeface is
 * served by the hosted site as a linked file; the fallback is bundled under a
 * licence that permits redistribution anywhere, including inside the retained
 * single-file export. Replacing either one means editing this file and nothing
 * else.
 *
 * The production artwork is not listed here. It is the inspected generated
 * assets the content document names, each with its own manifest, checksum and
 * approved alternative text, and the build reads them from there.
 *
 * Provenance, permission, and checksums for both are in assets/fonts/README.md.
 */

/**
 * The essay's typeface. Hosted only: it is served from the site's own origin
 * as a linked asset and is deliberately never embedded in the offline file.
 */
export const PROJECT_FONT = {
  family: 'Futura Handwritten',
  source: 'assets/fonts/FuturaHandwritten.ttf',
  published: 'assets/fonts/FuturaHandwritten.ttf',
  mediaType: 'font/ttf',
  notice:
    'Set in Futura Handwritten by Billy Snyder, served from this site under the author’s note at dafont.com/futurahandwritten.font: “Feel free to use this font for anything you want.” The author says credit is not required; it is given here anyway.',
};

/**
 * The fallback, and the only face the offline file carries. It sets whatever
 * the project typeface has no glyph for, which on this content is the en dash.
 */
export const FALLBACK_FONT = {
  family: 'Bundled Fallback',
  source: 'assets/fonts/DejaVuSans.ttf',
  published: 'assets/fonts/DejaVuSans.ttf',
  mediaType: 'font/ttf',
  notice:
    'DejaVu Sans is bundled under the Bitstream Vera Fonts Copyright, below, and sets every character Futura Handwritten has no glyph for.',
  /** Used where it is the only face in the document, so there is nothing to fall back from. */
  noticeAlone:
    'Body text is set in DejaVu Sans, bundled under the Bitstream Vera Fonts Copyright, below.',
};

/** The licence travels with the fallback font in every output that carries it. */
export const FALLBACK_FONT_LICENSE = {
  source: 'assets/fonts/DejaVuSans.LICENSE.txt',
  published: 'assets/fonts/DejaVuSans.LICENSE.txt',
  mediaType: 'text/plain; charset=utf-8',
};

/** Where the replaceable fallback-font URL appears in the stylesheet. */
export const FONT_URL_TOKEN = '__FONT_URL__';

/** Where the project typeface's hosted URL appears in the stylesheet. */
export const PROJECT_FONT_URL_TOKEN = '__PROJECT_FONT_URL__';

/**
 * The stylesheet region the hosted output keeps and the offline file drops.
 * Everything that depends on a font the offline file may not carry lives
 * between these two comments, so stripping them cannot leave half a rule.
 */
export const HOSTED_ONLY_CSS = { start: '/* hosted-only:start */', end: '/* hosted-only:end */' };
