/**
 * The binary resources the essay packages.
 *
 * Both are deliberately temporary. They exist so the foundation can prove that
 * a real font file and a real image survive into the hosted output and into a
 * single offline file with no network request. Replacing either one means
 * editing this file and nothing else.
 */

/** Body-text fallback. Not the project's typeface; see assets/fonts/README.md. */
export const FONT = {
  source: 'assets/fonts/DejaVuSans.ttf',
  published: 'assets/fonts/DejaVuSans.ttf',
  mediaType: 'font/ttf',
  notice:
    'Body text is set in DejaVu Sans, bundled under the Bitstream Vera Fonts Copyright as a temporary fallback until the project typeface is licensed and added.',
};

/** The licence travels with the font in the hosted output. */
export const FONT_LICENSE = {
  source: 'assets/fonts/DejaVuSans.LICENSE.txt',
  published: 'assets/fonts/DejaVuSans.LICENSE.txt',
  mediaType: 'text/plain; charset=utf-8',
};

/** The one original illustration committed so far. */
export const ILLUSTRATION = {
  source: 'assets/concepts/stickman-character-sheet-v1.png',
  published: 'assets/illustrations/stickman-character-sheet-v1.png',
  mediaType: 'image/png',
  width: 1536,
  height: 1024,
  alt: 'Original stickman concept sheet: four simple figures drawn across six expressions each, from joy and curiosity to sadness, frustration, fatigue, and quiet reflection.',
  caption:
    'First concept sheet. The appearances are provisional, the lettering inside the image is a placement study, and the finished essay renders every name and line as text.',
};

/** Where the replaceable font URL appears in the stylesheet. */
export const FONT_URL_TOKEN = '__FONT_URL__';
