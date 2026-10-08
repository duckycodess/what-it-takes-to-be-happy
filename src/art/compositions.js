/**
 * Scene compositions: the drawings that carry an argument.
 *
 * A composition is a reusable motif, not a picture of one beat. It declares how
 * many figures it can place, where they stand, what scenery explains the claim,
 * and — where the point is that something was invisible until it was pointed
 * out — a second layer that arrives after the first.
 *
 * Two layers, not more. The base layer is the situation; the reveal layer is
 * the condition under it. Both are in the markup at all times and the settled
 * state is the default, so print, a scriptless browser, the offline file, and a
 * reader who has asked for reduced motion all see the finished explanation. The
 * entrance animation in the stylesheet is an addition to a drawing that is
 * already correct, never the thing that completes it.
 *
 * Nothing here means anything by colour alone, and no composition contains
 * lettering: names and every word a reader needs are browser text rendered
 * beside and above the drawing.
 */

import { circle, curve, group, line, path, polyline, rect } from './svg.js';
import { handPoints, labelAnchor, placeFigure } from './figures.js';

/** One frame for every scene, so a drawing never changes shape between beats. */
export const VIEW = { width: 480, height: 300, ground: 252 };

const INK = { stroke: 'currentColor', fill: 'none' };
const THIN = { ...INK, 'stroke-width': 2 };
const MEDIUM = { ...INK, 'stroke-width': 2.5 };
const THICK = { ...INK, 'stroke-width': 3 };
const FAINT = { ...INK, 'stroke-width': 2, 'stroke-dasharray': '5 5' };
const SOLID = { fill: 'currentColor', stroke: 'none' };

const ground = (x1 = 20, x2 = 460, y = VIEW.ground) => line(x1, y, x2, y, THICK);

/** A short stroke of ground under one figure, for scenes that stand apart. */
const footing = (x, width = 44, y = VIEW.ground) => line(x - width / 2, y, x + width / 2, y, THICK);

/** An arrow, used for direction and for cost. Heads are drawn, never implied. */
function arrow(x1, y1, x2, y2, options = {}) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = options.size ?? 8;
  const wing = (spread) => [x2 - size * Math.cos(angle - spread), y2 - size * Math.sin(angle - spread)];
  return [
    line(x1, y1, x2, y2, { ...MEDIUM, ...options.style }),
    polyline([wing(0.45), [x2, y2], wing(-0.45)], { ...MEDIUM, ...options.style }),
  ].join('');
}

/** A dimension line: two end ticks and a span, for a measurable distance. */
const span = (x1, x2, y) =>
  [line(x1, y - 8, x1, y + 8, THIN), line(x2, y - 8, x2, y + 8, THIN), arrow(x1, y, x2, y), arrow(x2, y, x1, y)].join('');

/** Evenly spaced standing positions across the frame. */
function row(count, options = {}) {
  const { y = VIEW.ground, scale = 0.82, spread = 320, centre = 240, poses = [], flips = [] } = options;
  if (count <= 0) return [];
  const step = count > 1 ? spread / (count - 1) : 0;
  const start = count > 1 ? centre - spread / 2 : centre;
  return Array.from({ length: count }, (_, index) => ({
    x: start + index * step,
    y,
    scale,
    pose: poses[index] ?? poses[poses.length - 1] ?? 'stand',
    flip: flips[index] ?? false,
  }));
}

/** Places figures at the slots a composition chose, in the scene's own order. */
const placeAll = (slots, figures) => slots.map((slot, index) => placeFigure(slot, figures[index])).join('');

/* --------------------------------------------------------------------------
 * The catalogue.
 *
 * `purpose` is why the motif exists in the argument; it is what an editor reads
 * when choosing one. `base` and `reveal` are what the reader sees first and
 * second. Identifiers are permanent: a motif may be redrawn, but a scene that
 * points at one keeps pointing at the same explanation.
 * ----------------------------------------------------------------------- */

const CATALOGUE = [
  {
    id: 'art-figure-row',
    title: 'The cast, standing in the open',
    purpose: 'Who is here and how each one is feeling, with nothing else in the frame to argue about.',
    settled: 'Every figure stands on the shared ground line wearing its own expression.',
    minFigures: 1,
    maxFigures: 8,
    slots: (count) => row(count, { scale: count > 5 ? 0.62 : 0.82, spread: Math.min(count > 5 ? 400 : 300, count * 86) }),
    base: ({ slots, figures }) => `${ground()}${placeAll(slots, figures)}`,
  },
  {
    id: 'art-opening-question',
    title: 'The question, with nobody settling it',
    purpose: 'Open on the question itself, surrounded by people in different states, so the opening never implies one correct emotion.',
    settled: 'The question stands in the middle; under each figure is an answer stroke, and no two are the same length.',
    minFigures: 0,
    maxFigures: 5,
    // The figures stand to either side of the question rather than in front of
    // it: the question is the thing the landing is about.
    slots: (count) => {
      const poses = ['ease', 'slump', 'stand', 'reach', 'sit'];
      const spread = (n, from, to) =>
        Array.from({ length: n }, (_, index) => (n === 1 ? (from + to) / 2 : from + (index * (to - from)) / (n - 1)));
      const left = Math.ceil(count / 2);
      const xs = [...spread(left, 66, 176), ...spread(count - left, 304, 414)];
      return xs.map((x, index) => ({
        x,
        y: VIEW.ground,
        scale: count > 3 ? 0.62 : 0.74,
        pose: poses[index] ?? 'stand',
        flip: x > 240,
      }));
    },
    base: ({ slots, figures }) => [
      ground(),
      path('M 212,118 Q 212,84 240,84 Q 268,84 268,108 Q 268,128 244,136 L 244,150', { ...INK, 'stroke-width': 7 }),
      circle(244, 166, 4.5, SOLID),
      placeAll(slots, figures),
    ].join(''),
    reveal: ({ slots }) => {
      const under = slots.length > 0 ? slots.map((slot) => slot.x) : [110, 240, 370];
      return under
        .map((x, index) => line(x - 16 - index * 3, VIEW.ground + 14, x + 10 + index * 5, VIEW.ground + 14, MEDIUM))
        .join('');
    },
  },
  {
    id: 'art-apart-together',
    title: 'Standing apart, and the figure nobody named',
    purpose: 'Introduce people as separate voices rather than one block, and mark that some figures in this essay are invented rather than real.',
    settled: 'Each figure stands on its own patch of ground; an unnamed dashed figure stands to one side, carrying no nametag.',
    minFigures: 1,
    maxFigures: 4,
    slots: (count) => row(count, { scale: 0.8, spread: 230, centre: 190 }),
    base: ({ slots, figures }) => `${slots.map((slot) => footing(slot.x)).join('')}${placeAll(slots, figures)}`,
    reveal: () =>
      `${footing(416)}${placeFigure({ x: 416, y: VIEW.ground, scale: 0.8, pose: 'stand' }, { figure: 'unnamed', expression: 'uncertainty' })}`,
  },
  {
    id: 'art-three-readings',
    title: 'One moment, read several ways',
    purpose: 'Show a single ordinary situation with different readings leaving it, so a disagreement is visibly about the reading and not about the facts.',
    settled: 'A framed ordinary moment sits in the middle, with a path running from it to each figure and a different shape at the end of each.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => row(count, { scale: 0.66, spread: 300 }),
    base: ({ slots, figures }) => [
      ground(),
      rect(196, 96, 88, 62, { ...MEDIUM, fill: '#ffffff' }),
      circle(230, 126, 11, MEDIUM),
      line(250, 138, 268, 138, MEDIUM),
      curve([214, 150], [206, 158], [214, 166], THIN),
      placeAll(slots, figures),
    ].join(''),
    reveal: ({ slots }) => {
      const ends = [
        (x, y) => circle(x, y, 7, MEDIUM),
        (x, y) => rect(x - 7, y - 7, 14, 14, MEDIUM),
        (x, y) => polyline([[x - 8, y + 7], [x, y - 8], [x + 8, y + 7], [x - 8, y + 7]], MEDIUM),
      ];
      return slots
        .map((slot, index) => {
          const toward = slot.x < 240 ? 196 : 284;
          const shapeX = slot.x + (slot.x < 240 ? -44 : 44);
          const shapeY = labelAnchor(slot).y + 44;
          return [
            path(`M ${toward},127 Q ${(toward + shapeX) / 2},${(127 + shapeY) / 2 - 20} ${shapeX},${shapeY}`, FAINT),
            ends[index % ends.length](shapeX, shapeY),
          ].join('');
        })
        .join('');
    },
  },
  {
    id: 'art-life-line',
    title: 'A whole life, not one good afternoon',
    purpose: 'Draw a life as a length rather than a moment, so a claim about flourishing over time can be separated from a claim about feeling good now.',
    settled: 'A long marked line runs across the frame with one bright point on it, and several stretches of it fenced off behind bars.',
    minFigures: 0,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.56, spread: 150, centre: 150 }),
    base: ({ slots, figures }) => [
      ground(),
      line(40, 112, 440, 112, THICK),
      ...[80, 140, 200, 260, 320, 380].map((x) => line(x, 105, x, 119, THIN)),
      circle(260, 112, 6, SOLID),
      placeAll(slots, figures),
    ].join(''),
    reveal: () =>
      [
        rect(140, 84, 60, 56, FAINT),
        line(150, 90, 150, 134, THIN),
        line(170, 90, 170, 134, THIN),
        line(190, 90, 190, 134, THIN),
        rect(320, 84, 60, 56, FAINT),
        line(330, 90, 330, 134, THIN),
        line(350, 90, 350, 134, THIN),
        line(370, 90, 370, 134, THIN),
      ].join(''),
  },
  {
    id: 'art-two-instruments',
    title: 'Two instruments, one person',
    purpose: 'Show that two measurements of the same life are not the same measurement, and that neither one is the person.',
    settled: 'A dial and a ruler both point at the same figure, and the two readings do not line up.',
    minFigures: 0,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.76, spread: 110, centre: 240 }),
    base: ({ slots, figures }) => [
      ground(),
      curve([54, 150], [94, 100], [134, 150], MEDIUM),
      line(54, 150, 134, 150, MEDIUM),
      line(94, 150, 118, 120, MEDIUM),
      circle(94, 150, 4, SOLID),
      placeAll(slots, figures),
    ].join(''),
    reveal: () =>
      [
        rect(352, 104, 36, 120, MEDIUM),
        ...[124, 144, 164, 184, 204].map((y) => line(352, y, 366, y, THIN)),
        line(346, 164, 394, 164, THICK),
        arrow(140, 158, 196, 178),
        arrow(346, 158, 292, 178),
      ].join(''),
  },
  {
    id: 'art-balance',
    title: 'Weighing one thing against another',
    purpose: 'Make a comparison visible as a balance, and then make visible that somebody decided how the pans were set.',
    settled: 'A balance holds two unlike things, and a figure stands on a small platform beside it, where the ranking is done.',
    minFigures: 0,
    maxFigures: 2,
    slots: (count) => (count <= 1
      ? row(count, { scale: 0.68, centre: 96 })
      : [
        { x: 86, y: VIEW.ground, scale: 0.68, pose: 'stand' },
        { x: 400, y: VIEW.ground - 34, scale: 0.68, pose: 'point', flip: true },
      ]),
    base: ({ slots, figures }) => [
      ground(),
      polyline([[232, 206], [248, 206], [240, 150], [232, 206]], MEDIUM),
      line(240, 150, 240, 142, MEDIUM),
      line(176, 130, 304, 154, THICK),
      line(176, 130, 176, 150, THIN),
      line(304, 154, 304, 174, THIN),
      curve([156, 150], [176, 172], [196, 150], MEDIUM),
      curve([284, 174], [304, 196], [324, 174], MEDIUM),
      circle(176, 142, 9, MEDIUM),
      rect(296, 162, 16, 14, MEDIUM),
      placeAll(slots, figures),
    ].join(''),
    reveal: () => [rect(368, VIEW.ground - 34, 64, 34, MEDIUM), arrow(372, 198, 318, 170)].join(''),
  },
  {
    id: 'art-two-climbs',
    title: 'A climb entered, and a climb imposed',
    purpose: 'Separate difficulty somebody chose from difficulty somebody cannot refuse, without claiming either one is easy.',
    settled: 'Two identical slopes stand side by side. One figure climbs with empty hands; the other climbs carrying a block it did not pick up by choice.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => [
      { x: 118, y: 212, scale: 0.6, pose: 'walk' },
      { x: 342, y: 212, scale: 0.6, pose: 'carry' },
    ].slice(0, Math.max(count, 1)),
    base: ({ slots, figures }) => [
      ground(),
      polyline([[36, VIEW.ground], [150, 196], [180, VIEW.ground]], MEDIUM),
      polyline([[260, VIEW.ground], [374, 196], [404, VIEW.ground]], MEDIUM),
      placeAll(slots, figures),
    ].join(''),
    reveal: ({ slots }) => {
      if (slots.length < 2) return [rect(326, 172, 36, 24, MEDIUM), arrow(344, 142, 344, 166)].join('');
      const [left, right] = handPoints(slots[1]);
      const width = right.x - left.x + 16;
      return [
        rect(left.x - 8, left.y - 14, width, 24, { ...MEDIUM, fill: '#ffffff' }),
        arrow(right.x + 26, left.y - 40, right.x + 26, left.y - 14),
      ].join('');
    },
  },
  {
    id: 'art-rest-without-a-frame',
    title: 'Rest, and the frame drawn around it',
    purpose: 'Show rest that produces nothing, and then show the measuring frame somebody drew around it lifting away.',
    settled: 'A figure rests. The frame of ticks and rising arrows that was around it has lifted clear and is drawn dashed above.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.78, spread: 110, centre: 236, poses: ['sit', 'stand'] }),
    base: ({ slots, figures }) => [
      ground(),
      rect(140, 112, 196, 136, MEDIUM),
      ...[164, 192, 220].map((x) => line(x, 244, x, 236, THIN)),
      arrow(306, 232, 326, 196),
      placeAll(slots, figures),
    ].join(''),
    reveal: () => [rect(140, 22, 196, 48, FAINT), line(160, 78, 160, 112, THIN), line(316, 78, 316, 112, THIN), arrow(166, 104, 166, 76)].join(''),
  },
  {
    id: 'art-handed-template',
    title: 'The shape everyone is handed',
    purpose: 'Show a template handed out identically to everyone, and the difference between carrying it and setting it down.',
    settled: 'Unnamed dashed figures each hold the same square. The named figure has set its own square on the ground beside it.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.78, spread: 120, centre: 356, poses: ['stand', 'point'] }),
    base: ({ slots, figures }) => {
      const outlines = [70, 150, 230].map((x) => {
        const slot = { x, y: VIEW.ground, scale: 0.68, pose: 'carry' };
        const [left, right] = handPoints(slot);
        return [
          placeFigure(slot, { figure: 'unnamed', expression: 'reflection' }),
          rect(left.x - 2, left.y - 20, right.x - left.x + 4, 22, { ...MEDIUM, fill: '#ffffff' }),
        ].join('');
      });
      return `${ground()}${outlines.join('')}${placeAll(slots, figures)}`;
    },
    reveal: ({ slots }) =>
      [
        rect(slots[0].x - 46, VIEW.ground - 24, 30, 24, { ...MEDIUM, fill: '#ffffff' }),
        arrow(slots[0].x - 34, VIEW.ground - 60, slots[0].x - 34, VIEW.ground - 32),
      ].join(''),
  },
  {
    id: 'art-one-screen-two-things',
    title: 'One screen, two things happening',
    purpose: 'Hold together the connection a device opens and the ranking it also runs, without declaring the device shallow.',
    settled: 'A line of contact runs through the screen to someone else. Inside the same screen, a ladder of rungs sorts people, with one marker above the rest.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.7, spread: 300, flips: [false, true] }).slice(0, Math.max(count, 1)),
    base: ({ slots, figures }) => [
      ground(),
      rect(186, 110, 108, 94, { ...MEDIUM, fill: '#ffffff' }),
      line(240, 204, 240, 232, MEDIUM),
      line(214, 232, 266, 232, MEDIUM),
      line(120, 150, 186, 150, FAINT),
      line(294, 150, 360, 150, FAINT),
      placeAll(slots, figures),
    ].join(''),
    reveal: () =>
      [
        ...[192, 176, 160, 144].map((y) => line(206, y, 274, y, THIN)),
        circle(222, 136, 5, SOLID),
        circle(258, 168, 5, MEDIUM),
        arrow(258, 156, 240, 140),
      ].join(''),
  },
  {
    id: 'art-invitation-conditions',
    title: 'An invitation, and what is under it',
    purpose: 'Show an ordinary invitation, then show the commute, the chores, and the care that were already inside the free evening it assumed.',
    settled: 'The message floats above the ground. Below the line, in a band of its own, are the travel, the tasks, and the person being cared for that the evening already contained.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => row(count, { scale: 0.66, spread: 190, centre: 150, poses: ['stand', 'slump', 'ease'] }),
    base: ({ slots, figures }) => [
      ground(),
      rect(286, 54, 152, 66, { ...MEDIUM, fill: '#ffffff' }),
      polyline([[306, 120], [300, 138], [326, 120]], MEDIUM),
      line(306, 76, 418, 76, THIN),
      line(306, 94, 386, 94, THIN),
      ...[316, 346, 376].map((x) => circle(x, 108, 5, MEDIUM)),
      placeAll(slots, figures),
    ].join(''),
    reveal: () =>
      [
        arrow(44, 282, 150, 282),
        rect(176, 268, 26, 26, MEDIUM),
        rect(210, 268, 26, 26, MEDIUM),
        placeFigure({ x: 300, y: 296, scale: 0.26, pose: 'sit' }, { figure: 'unnamed', expression: 'fatigue' }),
        placeFigure({ x: 344, y: 296, scale: 0.26, pose: 'stand' }, { figure: 'unnamed', expression: 'reflection' }),
        rect(394, 268, 26, 26, MEDIUM),
      ].join(''),
  },
  {
    id: 'art-accumulating-care',
    title: 'Small repeated care, and where it comes from',
    purpose: 'Let ordinary gestures accumulate into something with a shape, then show that each one was paid for out of somebody’s day.',
    settled: 'A stack of identical small marks has grown into a block between the figures, and under every mark is the tick of what it cost.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => row(count, { scale: 0.72, spread: 250, flips: [false, true, false] }),
    base: ({ slots, figures }) => {
      const marks = Array.from({ length: 5 }, (_, index) =>
        Array.from({ length: index + 1 }, (_, column) => line(188 + column * 18, 200 - index * 16, 202 + column * 18, 200 - index * 16, MEDIUM)).join(''));
      return `${ground()}${marks.join('')}${placeAll(slots, figures)}`;
    },
    reveal: () =>
      [
        ...Array.from({ length: 5 }, (_, index) => line(188 + index * 18, 214, 188 + index * 18, 228, THIN)),
        arrow(182, 222, 150, 222),
      ].join(''),
  },
  {
    id: 'art-door-distance',
    title: 'The same door, at different distances',
    purpose: 'Draw a service, an opportunity, or a right as a door that exists, and the distance and the barrier between it and the person it is for.',
    settled: 'The door stands open on the right. The figures are at different distances from it, a barrier of bars crosses the way, and the gap is measured.',
    minFigures: 1,
    maxFigures: 5,
    slots: (count) => {
      const xs = [52, 112, 176, 232, 288];
      return Array.from({ length: Math.min(count, xs.length) }, (_, index) => ({
        x: xs[index],
        y: VIEW.ground,
        scale: 0.56 + index * 0.03,
        pose: index === 0 ? 'reach' : 'stand',
      }));
    },
    base: ({ slots, figures }) => [
      ground(),
      rect(398, 130, 62, 122, { ...MEDIUM, fill: '#ffffff' }),
      line(398, 130, 398, VIEW.ground, THICK),
      circle(410, 196, 4, SOLID),
      placeAll(slots, figures),
    ].join(''),
    reveal: ({ slots }) => {
      const nearest = slots.reduce((best, slot) => (slot.x > best.x ? slot : best), slots[0] ?? { x: 240 });
      return [
        ...[0, 1, 2, 3].map((index) => line(344 + index * 12, 140, 344 + index * 12, VIEW.ground, THIN)),
        span(nearest.x + 24, 338, 288),
      ].join('');
    },
  },
  {
    id: 'art-joy-and-conditions',
    title: 'A good afternoon, with its supports drawn in',
    purpose: 'Show real enjoyment first and only then draw what was holding it up, so revisiting a joy explains it rather than taking it back.',
    settled: 'The game is still going on above the line. Under the line are the layers that made the afternoon possible: time, a safe place, and somebody covering what was not done.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => row(count, { scale: 0.7, spread: 210, centre: 160, poses: ['celebrate', 'ease', 'stand'], flips: [false, true, false] }),
    base: ({ slots, figures }) => [
      ground(),
      path('M 300,160 Q 352,100 404,168', FAINT),
      circle(404, 180, 11, MEDIUM),
      line(393, 180, 415, 180, THIN),
      curve([404, 169], [398, 180], [404, 191], THIN),
      placeAll(slots, figures),
    ].join(''),
    reveal: () =>
      [
        rect(40, 262, 120, 16, MEDIUM),
        rect(176, 262, 120, 16, MEDIUM),
        rect(312, 262, 120, 16, MEDIUM),
        ...[100, 236, 372].map((x) => arrow(x, 284, x, 266, { size: 7 })),
      ].join(''),
  },
  {
    id: 'art-spread-and-average',
    title: 'The average, and the people it is drawn over',
    purpose: 'Show a summary number sitting on top of a distribution, with the part of the distribution that the summary hides.',
    settled: 'Points sit at many different heights with an average line drawn through them, and a bracket marks the long tail the average passes over.',
    minFigures: 0,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.56, spread: 72, centre: 70, poses: ['point'] }),
    base: ({ slots, figures }) => {
      const points = [
        [150, 120], [176, 162], [198, 104], [224, 148], [248, 128],
        [272, 174], [296, 116], [318, 156], [342, 136], [366, 182],
      ];
      return [
        line(130, 230, 452, 230, THICK),
        line(130, 230, 130, 80, THICK),
        ...points.map(([x, y]) => circle(x, y, 4.5, SOLID)),
        line(140, 142, 380, 142, { ...THICK, 'stroke-dasharray': '10 6' }),
        placeAll(slots, figures),
      ].join('');
    },
    reveal: () =>
      [
        circle(392, 206, 4.5, SOLID),
        circle(414, 214, 4.5, SOLID),
        circle(436, 220, 4.5, SOLID),
        polyline([[384, 236], [384, 244], [444, 244], [444, 236]], THIN),
        arrow(414, 258, 414, 246),
      ].join(''),
  },
];

/** The catalogue, keyed by identifier. */
export const COMPOSITIONS = Object.freeze(Object.fromEntries(CATALOGUE.map((entry) => [entry.id, Object.freeze(entry)])));

/** Every composition identifier, in catalogue order. */
export const COMPOSITION_IDS = CATALOGUE.map((entry) => entry.id);

export const hasComposition = (id) => Object.hasOwn(COMPOSITIONS, id);

/**
 * Draws one scene.
 *
 * @param {string} id a composition identifier
 * @param {Array<{figure: string, expression: string}>} figures in the scene's own cast order
 * @param {{reveal?: boolean}} [options] whether the condition layer is settled on
 * @returns {{svg: string, anchors: Array<{x: number, y: number}>}}
 *   `anchors` are percentage positions for the nametags, which are HTML text
 *   placed over the drawing rather than lettering inside it.
 */
export function drawComposition(id, figures = [], { reveal: showReveal = true } = {}) {
  const composition = COMPOSITIONS[id];
  if (!composition) throw new Error(`No composition named ${JSON.stringify(id)}. Known compositions: ${COMPOSITION_IDS.join(', ')}.`);
  if (figures.length < composition.minFigures || figures.length > composition.maxFigures) {
    throw new Error(`Composition ${id} places ${composition.minFigures} to ${composition.maxFigures} figures, but ${figures.length} were given.`);
  }

  const slots = composition.slots(figures.length);
  const base = group({ 'data-art-layer': 'base' }, composition.base({ slots, figures }));
  const revealed = showReveal && composition.reveal ? composition.reveal({ slots, figures }) : '';
  const reveal = revealed ? group({ 'data-art-layer': 'reveal' }, revealed) : '';

  const svg = [
    `<svg class="scene-art" viewBox="0 0 ${VIEW.width} ${VIEW.height}" role="presentation" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">`,
    group({ fill: 'none', stroke: 'currentColor', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, `${base}${reveal}`),
    '</svg>',
  ].join('\n');

  const anchors = slots.map((slot) => {
    const point = labelAnchor(slot);
    return { x: (point.x / VIEW.width) * 100, y: (point.y / VIEW.height) * 100 };
  });

  return { svg, anchors };
}
