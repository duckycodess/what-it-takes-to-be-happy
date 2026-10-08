/** Turning committed files into data URIs so one HTML file carries everything. */

/**
 * @param {Buffer} buffer file contents
 * @param {string} mediaType for example `font/ttf`
 * @returns {string} a base64 data URI
 */
export function toDataUri(buffer, mediaType) {
  return `data:${mediaType};base64,${buffer.toString('base64')}`;
}

/** Points the stylesheet's `@font-face` at a path or at an embedded font. */
export function withFontUrl(css, token, url) {
  if (!css.includes(token)) {
    throw new Error(`The stylesheet no longer contains ${token}; the font can no longer be packaged.`);
  }
  return css.split(token).join(url);
}
