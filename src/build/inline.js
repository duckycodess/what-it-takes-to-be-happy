/** Turning committed files into data URIs so one HTML file carries everything. */

/**
 * @param {Buffer} buffer file contents
 * @param {string} mediaType for example `font/ttf`
 * @returns {string} a base64 data URI
 */
export function toDataUri(buffer, mediaType) {
  return `data:${mediaType};base64,${buffer.toString('base64')}`;
}

/**
 * Points one of the stylesheet's `@font-face` rules at a path or at an
 * embedded font.
 *
 * Exactly one occurrence, which is the check that matters rather than a
 * formality: the replacement is a whole font as base64 in the offline file, so
 * a token that also appeared in a comment would quietly put a second copy of
 * the font into the document.
 */
export function withFontUrl(css, token, url) {
  const count = css.split(token).length - 1;
  if (count === 0) {
    throw new Error(`The stylesheet no longer contains ${token}; the font can no longer be packaged.`);
  }
  if (count > 1) {
    throw new Error(`The stylesheet contains ${token} ${count} times; it belongs in one @font-face rule and nowhere else.`);
  }
  return css.split(token).join(url);
}

/**
 * Removes the stylesheet's hosted-only region.
 *
 * The offline file carries the bundled fallback and no other font, so it must
 * not keep a rule that names a face it does not have or points at a URL it
 * cannot reach. Dropping the whole marked region, rather than editing rules
 * out one at a time, is what keeps the two outputs from drifting: anything
 * added inside the markers leaves with them.
 *
 * @param {string} css
 * @param {{start: string, end: string}} markers
 * @returns {string} the stylesheet without that region
 */
export function withoutHostedOnly(css, markers) {
  const start = css.indexOf(markers.start);
  const end = css.indexOf(markers.end);
  if (start < 0 || end < 0 || end < start) {
    throw new Error(`The stylesheet no longer marks its hosted-only region with ${markers.start} and ${markers.end}.`);
  }
  const before = css.slice(0, start);
  const after = css.slice(end + markers.end.length);
  return `${before.replace(/\n+$/, '\n')}${after.replace(/^\n+/, '')}`;
}
