/**
 * The smallest SVG writer that this project needs.
 *
 * Every drawing in `src/art/` is produced as a string by these helpers and
 * inlined into the document, which is what keeps the artwork inside the one
 * promise the packaging makes: the offline file must carry everything it
 * draws. Nothing here emits an `id`, a `<use>`, an `<image>`, a font, or a
 * `url(...)` reference, so the same drawing can appear many times in one
 * document without colliding with itself and without reaching outside the file.
 *
 * Numbers are rounded to two decimals so a build is byte-for-byte repeatable.
 */

/** Rounds a coordinate, and never emits `-0`, which would differ between runs. */
export function num(value) {
  if (!Number.isFinite(value)) throw new TypeError(`Coordinate must be a finite number, received ${JSON.stringify(value)}.`);
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

const attributeValue = (value) => (typeof value === 'number' ? num(value) : String(value).replace(/"/g, '&quot;'));

/** Serialises attributes, dropping anything undefined, null, or false. */
export function attrs(map) {
  return Object.entries(map)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([name, value]) => ` ${name}="${attributeValue(value)}"`)
    .join('');
}

export const el = (name, map = {}, children = '') =>
  children === '' ? `<${name}${attrs(map)}/>` : `<${name}${attrs(map)}>${children}</${name}>`;

export const group = (map, children) => el('g', map, children);

export const path = (d, map = {}) => el('path', { d, ...map });

export const circle = (cx, cy, r, map = {}) => el('circle', { cx, cy, r, ...map });

export const rect = (x, y, width, height, map = {}) => el('rect', { x, y, width, height, ...map });

export const line = (x1, y1, x2, y2, map = {}) => el('line', { x1, y1, x2, y2, ...map });

/** An open run of straight segments, used for limbs, rails, and connections. */
export const polyline = (points, map = {}) =>
  el('polyline', { points: points.map(([x, y]) => `${num(x)},${num(y)}`).join(' '), ...map });

/** A single curved stroke: start, control point, end. */
export const curve = ([sx, sy], [cx, cy], [ex, ey], map = {}) =>
  path(`M ${num(sx)},${num(sy)} Q ${num(cx)},${num(cy)} ${num(ex)},${num(ey)}`, map);

export function translate(x, y, scale = 1, flip = false) {
  const move = `translate(${num(x)} ${num(y)})`;
  const sx = flip ? -scale : scale;
  return scale === 1 && !flip ? move : `${move} scale(${num(sx)} ${num(scale)})`;
}

export const rotate = (degrees, x, y) => `rotate(${num(degrees)} ${num(x)} ${num(y)})`;

/** Mirrors a run of points across the figure's own centre line. */
export const mirror = (points) => points.map(([x, y]) => [-x, y]);
