/**
 * The original cast, drawn as reusable parts.
 *
 * A figure is assembled from four separable pieces — an identity anchor (the
 * hair shape), a face (the expression), a body (the pose), and the placement a
 * composition gives it. Those four axes are the whole drawing system: a new
 * scene reuses the same parts rather than needing a new picture of a person,
 * and a member can wear any expression in any pose, so nobody is reduced to one
 * standing mood or one position.
 *
 * Everything is geometry authored here. The generated concept sheet in
 * `assets/concepts/` is where the identities came from; it is a flattened
 * raster study and supplies none of these shapes. See `docs/art-system.md`.
 *
 * Local coordinates: the figure stands with its feet at the origin and grows
 * upward, so a composition places it by naming the spot it stands on.
 */

import { circle, curve, group, line, mirror, path, polyline, rotate, translate } from './svg.js';

/** Fixed landmarks. A pose or an expression may move limbs and faces, not these. */
export const ANATOMY = {
  headCentreY: -134,
  headRadius: 22,
  /** Where a nametag is anchored: clear of the tallest identity anchor. */
  labelY: -172,
  neckY: -112,
  shoulderY: -106,
  hipY: -58,
  totalHeight: 172,
};

const INK = { stroke: 'currentColor', fill: 'none' };
const SOLID = { fill: 'currentColor', stroke: 'none' };
/** Restrained emphasis only. Nothing in this system means anything by colour. */
const BLUSH = { fill: '#d98f86', stroke: 'none' };

const limb = (points) => polyline(points, { 'stroke-width': 3 });

/**
 * The eight drawable identities.
 *
 * `anchor` is the hair shape that makes a figure recognisable across every
 * expression and pose. Identifiers are permanent: a figure may be redrawn, but
 * its identifier keeps pointing at the same person or the same invented friend.
 * Contributor appearances are provisional stand-ins, not approved likenesses.
 */
export const FIGURES = {
  tj: {
    role: 'member',
    anchorNote: 'A small forward tuft at the crown.',
    anchor: () => curve([-5, -154], [0, -167], [7, -157], { 'stroke-width': 3 }),
  },
  koj: {
    role: 'member',
    anchorNote: 'A single curl turning off the right of the crown.',
    anchor: () => path('M -3,-154 Q 6,-169 13,-159 Q 15,-153 9,-153', { ...INK, 'stroke-width': 3 }),
  },
  vier: {
    role: 'member',
    anchorNote: 'An angular tuft drawn as a short zigzag.',
    anchor: () => polyline([[-9, -150], [-3, -163], [1, -154], [8, -164]], { 'stroke-width': 3 }),
  },
  bob: {
    role: 'friend',
    anchorNote: 'A plain round head with no anchor, deliberately unlike the three contributors.',
    anchor: () => '',
  },
  nessa: {
    role: 'friend',
    anchorNote: 'Hair framing the face as two arcs outside the head.',
    anchor: () =>
      `${curve([-22, -132], [-27, -148], [-15, -154], { 'stroke-width': 3 })}${curve([22, -132], [27, -148], [15, -154], { 'stroke-width': 3 })}`,
  },
  dino: {
    role: 'friend',
    anchorNote: 'Three short upright bristles across a flat crown.',
    anchor: () =>
      `${line(-8, -154, -8, -162, { 'stroke-width': 3 })}${line(0, -156, 0, -165, { 'stroke-width': 3 })}${line(8, -154, 8, -162, { 'stroke-width': 3 })}`,
  },
  ivy: {
    role: 'friend',
    anchorNote: 'A short tied tail of hair off the left side of the head.',
    anchor: () =>
      `${curve([-21, -148], [-33, -146], [-33, -128], { 'stroke-width': 3 })}${circle(-20, -148, 3.4, { ...INK, 'stroke-width': 2.5 })}`,
  },
  marco: {
    role: 'friend',
    anchorNote: 'A cropped cap of hair drawn as one arc above the crown.',
    anchor: () => curve([-14, -151], [0, -165], [14, -151], { 'stroke-width': 3 }),
  },
  /**
   * The unnamed outline figure. It is how the essay shows "an invented example"
   * without pretending a particular person is standing there, and it never
   * carries a nametag.
   */
  unnamed: {
    role: 'placeholder',
    anchorNote: 'No anchor and a dashed outline: a figure the essay has not named.',
    anchor: () => '',
    outline: 'dashed',
  },
};

/**
 * The drawable emotional states.
 *
 * Six of them are the editorial vocabulary that the storyboard and the cast
 * registry already use. `uncertainty` is the seventh: the brief asks the
 * drawings to carry not-knowing, and `reflection` is a settled, considering
 * state rather than an unsettled one. It is a drawable state a scene may ask
 * for; the storyboard's six-state vocabulary is unchanged by its existence.
 */
export const EXPRESSIONS = {
  joy: {
    note: 'Open, lifted, laughing or at ease.',
    tilt: 0,
    face: () => [
      curve([-12, -139], [-8, -146], [-4, -139], { 'stroke-width': 2.5 }),
      curve([4, -139], [8, -146], [12, -139], { 'stroke-width': 2.5 }),
      curve([-8, -127], [0, -118], [8, -127], { 'stroke-width': 2.5 }),
      circle(-16, -130, 2.6, BLUSH),
      circle(16, -130, 2.6, BLUSH),
    ].join(''),
  },
  curiosity: {
    note: 'Leaning in, attentive, asking.',
    tilt: -6,
    face: () => [
      circle(-8, -139, 2.6, SOLID),
      circle(8, -139, 2.6, SOLID),
      curve([-13, -147], [-8, -152], [-3, -148], { 'stroke-width': 2.5 }),
      line(3, -147, 13, -147, { 'stroke-width': 2.5 }),
      circle(2, -125, 3, { ...INK, 'stroke-width': 2.5 }),
    ].join(''),
  },
  sadness: {
    note: 'Lowered, quiet, withdrawn.',
    tilt: 4,
    face: () => [
      circle(-8, -138, 2.6, SOLID),
      circle(8, -138, 2.6, SOLID),
      line(-13, -145, -4, -149, { 'stroke-width': 2.5 }),
      line(4, -149, 13, -145, { 'stroke-width': 2.5 }),
      curve([-7, -121], [0, -129], [7, -121], { 'stroke-width': 2.5 }),
    ].join(''),
  },
  frustration: {
    note: 'Tense, blocked, pushing against something.',
    tilt: 0,
    face: () => [
      circle(-8, -139, 2.6, SOLID),
      circle(8, -139, 2.6, SOLID),
      line(-13, -150, -4, -145, { 'stroke-width': 2.5 }),
      line(13, -150, 4, -145, { 'stroke-width': 2.5 }),
      line(-7, -124, 7, -124, { 'stroke-width': 2.5 }),
      line(-26, -145, -33, -149, { 'stroke-width': 2 }),
      line(26, -145, 33, -149, { 'stroke-width': 2 }),
    ].join(''),
  },
  fatigue: {
    note: 'Slumped, heavy, out of energy.',
    tilt: 6,
    face: () => [
      line(-13, -140, -3, -140, { 'stroke-width': 2.5 }),
      line(3, -140, 13, -140, { 'stroke-width': 2.5 }),
      curve([-12, -140], [-8, -135], [-4, -140], { 'stroke-width': 2 }),
      curve([4, -140], [8, -135], [12, -140], { 'stroke-width': 2 }),
      line(-5, -123, 5, -123, { 'stroke-width': 2.5 }),
    ].join(''),
  },
  reflection: {
    note: 'Still, considering, neither happy nor sad.',
    tilt: 5,
    face: () => [
      circle(-10, -140, 2.6, SOLID),
      circle(6, -140, 2.6, SOLID),
      curve([-14, -148], [-10, -151], [-6, -148], { 'stroke-width': 2.5 }),
      curve([-5, -124], [0, -122], [6, -126], { 'stroke-width': 2.5 }),
    ].join(''),
  },
  uncertainty: {
    note: 'Unsettled, weighing two answers, not yet decided.',
    tilt: -9,
    face: () => [
      circle(-8, -139, 2.4, SOLID),
      circle(8, -139, 4, { ...INK, 'stroke-width': 2.5 }),
      curve([-13, -149], [-8, -153], [-3, -149], { 'stroke-width': 2.5 }),
      line(3, -144, 13, -146, { 'stroke-width': 2.5 }),
      path('M -7,-124 Q -3.5,-128 0,-124 Q 3.5,-120 7,-124', { ...INK, 'stroke-width': 2.5 }),
    ].join(''),
  },
};

/**
 * Postures. A pose carries the limbs and, where a composition needs to hand the
 * figure something, the points its hands are at.
 */
export const POSES = {
  stand: {
    note: 'Upright, arms loose at the sides.',
    arms: [[[-10, -106], [-19, -88], [-21, -66]]],
    legs: [[[-5, -58], [-8, -30], [-10, -1]]],
    hands: [[-21, -66], [21, -66]],
  },
  ease: {
    note: 'Weight on one leg, one hand resting on the hip.',
    arms: [[[-10, -106], [-20, -88], [-22, -68]], [[10, -106], [21, -92], [8, -72]]],
    legs: [[[-5, -58], [-9, -30], [-12, -1]], [[5, -58], [4, -30], [7, -1]]],
    hands: [[-22, -68], [8, -72]],
    mirrored: false,
  },
  walk: {
    note: 'Mid-step, one arm forward and one back.',
    arms: [[[-10, -106], [-20, -94], [-24, -78]], [[10, -106], [18, -92], [16, -72]]],
    legs: [[[-5, -58], [-13, -32], [-19, -1]], [[5, -58], [12, -34], [17, -1]]],
    hands: [[-24, -78], [16, -72]],
    mirrored: false,
  },
  reach: {
    note: 'One arm lifted forward and up, toward something.',
    arms: [[[-10, -106], [-19, -90], [-20, -70]], [[10, -106], [24, -116], [35, -126]]],
    legs: [[[-5, -58], [-8, -30], [-10, -1]], [[5, -58], [8, -30], [10, -1]]],
    hands: [[-20, -70], [35, -126]],
    mirrored: false,
  },
  celebrate: {
    note: 'Both arms up and open.',
    arms: [[[-10, -106], [-22, -122], [-27, -140]]],
    legs: [[[-5, -58], [-9, -30], [-13, -1]]],
    hands: [[-27, -140], [27, -140]],
  },
  carry: {
    note: 'Both arms forward, holding something in front.',
    arms: [[[-10, -106], [-16, -94], [-14, -80]]],
    legs: [[[-5, -58], [-8, -30], [-10, -1]]],
    hands: [[-14, -80], [14, -80]],
  },
  sit: {
    note: 'Sitting on the ground, legs out to the sides.',
    drop: 34,
    arms: [[[-10, -106], [-21, -92], [-22, -74]], [[10, -106], [21, -92], [22, -74]]],
    legs: [[[-5, -58], [-24, -46], [-33, -34]], [[5, -58], [24, -46], [33, -34]]],
    hands: [[-22, -40], [22, -40]],
    mirrored: false,
  },
  slump: {
    note: 'Shoulders down, head forward, arms hanging.',
    drop: 6,
    tilt: 7,
    arms: [[[-10, -106], [-17, -88], [-16, -66]]],
    legs: [[[-5, -58], [-8, -32], [-9, -1]]],
    hands: [[-16, -60], [16, -60]],
  },
  point: {
    note: 'One arm out level, indicating something beside the figure.',
    arms: [[[-10, -106], [-19, -90], [-20, -70]], [[10, -106], [23, -104], [36, -102]]],
    legs: [[[-5, -58], [-8, -30], [-10, -1]], [[5, -58], [8, -30], [10, -1]]],
    hands: [[-20, -70], [36, -102]],
    mirrored: false,
  },
};

const pairs = (runs, mirrored) => (mirrored === false ? runs : [...runs, ...runs.map(mirror)]);

const torso = (outline) =>
  path('M -10,-112 L 10,-112 L 6,-58 L -6,-58 Z', {
    fill: '#ffffff',
    stroke: 'currentColor',
    'stroke-width': 3,
    'stroke-dasharray': outline === 'dashed' ? '6 5' : undefined,
  });

const head = (outline) =>
  circle(0, ANATOMY.headCentreY, ANATOMY.headRadius, {
    fill: '#ffffff',
    stroke: 'currentColor',
    'stroke-width': 3,
    'stroke-dasharray': outline === 'dashed' ? '6 5' : undefined,
  });

/**
 * Draws one figure in its own coordinates, feet at the origin.
 *
 * @param {object} appearance
 * @param {string} appearance.figure     a key of {@link FIGURES}
 * @param {string} appearance.expression a key of {@link EXPRESSIONS}
 * @param {string} [appearance.pose]     a key of {@link POSES}
 * @param {boolean} [appearance.flip]    face the other way
 * @returns {string} an SVG `<g>` element
 */
export function drawFigure({ figure, expression, pose = 'stand', flip = false }) {
  const identity = FIGURES[figure];
  if (!identity) throw new Error(`No figure named ${JSON.stringify(figure)}. Known figures: ${Object.keys(FIGURES).join(', ')}.`);
  const mood = EXPRESSIONS[expression];
  if (!mood) throw new Error(`No expression named ${JSON.stringify(expression)}. Known expressions: ${Object.keys(EXPRESSIONS).join(', ')}.`);
  const posture = POSES[pose];
  if (!posture) throw new Error(`No pose named ${JSON.stringify(pose)}. Known poses: ${Object.keys(POSES).join(', ')}.`);

  const legs = pairs(posture.legs, posture.mirrored).map(limb).join('');
  const arms = pairs(posture.arms, posture.mirrored).map(limb).join('');

  // The face and the identity anchor tilt with the head; the body does not.
  const headGroup = group(
    { transform: rotate(mood.tilt, 0, ANATOMY.neckY) },
    `${head(identity.outline)}${identity.anchor()}${mood.face()}`,
  );

  // A pose may lean the upper body; it turns about the hips, so the feet stay
  // where the composition put them.
  const upper = group({ transform: rotate(posture.tilt ?? 0, 0, ANATOMY.hipY) }, `${torso(identity.outline)}${arms}${headGroup}`);

  const body = group({ transform: posture.drop ? translate(0, posture.drop) : undefined }, `${legs}${upper}`);

  return group(
    {
      'data-figure': figure,
      'data-expression': expression,
      'data-pose': pose,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 3,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      transform: flip ? 'scale(-1 1)' : undefined,
    },
    body,
  );
}

/**
 * Places a figure into a composition.
 *
 * @param {{x: number, y: number, scale?: number, pose?: string, flip?: boolean}} slot
 * @param {{figure: string, expression: string}} appearance
 */
export function placeFigure(slot, appearance) {
  const scale = slot.scale ?? 1;
  return group(
    { transform: translate(slot.x, slot.y, scale) },
    drawFigure({ ...appearance, pose: slot.pose ?? appearance.pose ?? 'stand', flip: slot.flip ?? false }),
  );
}

/** Where a figure's nametag belongs: directly above its head. */
export function labelAnchor(slot) {
  const scale = slot.scale ?? 1;
  const drop = (POSES[slot.pose ?? 'stand']?.drop ?? 0) * scale;
  return { x: slot.x, y: slot.y + drop + ANATOMY.labelY * scale };
}

/** Where a pose's hands are, in composition coordinates, for props it holds. */
export function handPoints(slot) {
  const scale = slot.scale ?? 1;
  const posture = POSES[slot.pose ?? 'stand'];
  const drop = posture.drop ?? 0;
  return posture.hands.map(([x, y]) => ({
    x: slot.x + (slot.flip ? -x : x) * scale,
    y: slot.y + (y + drop) * scale,
  }));
}
