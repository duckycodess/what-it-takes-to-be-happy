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

import { circle, curve, group, line, num, path, polyline, rect } from './svg.js';
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

/** A drawn question mark, used where a beat ends on a question. */
function questionMark(x, y, size = 1) {
  const s = size;
  return [
    path(
      `M ${num(x - 11 * s)},${num(y - 5 * s)} Q ${num(x - 11 * s)},${num(y - 19 * s)} ${num(x)},${num(y - 19 * s)} `
      + `Q ${num(x + 11 * s)},${num(y - 19 * s)} ${num(x + 11 * s)},${num(y - 9 * s)} `
      + `Q ${num(x + 11 * s)},${num(y - 1 * s)} ${num(x + 2 * s)},${num(y + 3 * s)} L ${num(x + 2 * s)},${num(y + 9 * s)}`,
      { ...INK, 'stroke-width': 3 * s },
    ),
    circle(x + 2 * s, y + 16 * s, 2.2 * s, SOLID),
  ].join('');
}

/** A plain panel: a bordered frame with a floor a figure can stand on. */
const panel = (x, y, width, height) => `${rect(x, y, width, height, { ...MEDIUM, fill: '#ffffff' })}${line(x, y + height, x + width, y + height, MEDIUM)}`;

/** An unnamed outline where a composition needs somebody, anybody. */
const anybody = (x, y, scale, pose = 'stand', expression = 'reflection', flip = false) =>
  placeFigure({ x, y, scale, pose, flip }, { figure: 'unnamed', expression });

/** Fills a composition's unused standing positions with unnamed outlines. */
const fillRest = (positions, used, draw) => positions.slice(used).map(draw).join('');

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
    slots: (count) => row(count, {
      scale: count > 5 ? 0.62 : 0.82,
      spread: Math.min(count > 5 ? 400 : 300, count * 86),
      poses: count === 1 ? ['ease'] : ['stand'],
    }),
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
      const xs = [...spread(left, 66, 176), ...spread(count - left, 312, 422)];
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
    settled: 'A balance holds two unlike things. Where a second figure is placed, it stands on the platform the ranking is done from, and an arrow runs from there to the pans.',
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
      // The platform is part of the situation: a figure placed on it has to be
      // standing on something in both states, not hovering until a layer arrives.
      slots.length > 1 ? rect(368, VIEW.ground - 34, 64, 34, MEDIUM) : '',
      placeAll(slots, figures),
    ].join(''),
    // What the reveal adds is the judging itself, not the furniture.
    reveal: () => arrow(372, 198, 318, 170),
  },
  {
    id: 'art-two-climbs',
    title: 'A climb entered, and a climb imposed',
    purpose: 'Separate difficulty somebody chose from difficulty somebody cannot refuse, without claiming either one is easy.',
    settled: 'Two identical slopes stand side by side. One figure climbs with empty hands; the other climbs carrying a block it did not pick up by choice. With only one figure placed, the load is drawn coming down onto the second climb instead.',
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
      if (slots.length < 2) return [rect(356, 146, 36, 24, MEDIUM), arrow(374, 176, 374, 192)].join('');
      const [left, right] = handPoints(slots[1]);
      const width = right.x - left.x + 16;
      return [
        rect(left.x - 8, left.y - 14, width, 24, { ...MEDIUM, fill: '#ffffff' }),
        arrow(right.x + 26, left.y - 40, right.x + 26, left.y - 14),
      ].join('');
    },
  },
  {
    id: 'art-rest-and-the-frame',
    title: 'Rest, and the frame somebody draws around it',
    purpose: 'Show rest with nothing attached to it, and then show the measure somebody draws around that rest. Taking the frame away is the same drawing in the other state.',
    settled: 'A figure rests with nothing attached to it, inside a frame of measuring ticks and a rising arrow that has been drawn around the rest.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.78, spread: 110, centre: 236, poses: ['sit', 'stand'] }),
    base: ({ slots, figures }) => `${ground()}${placeAll(slots, figures)}`,
    reveal: () => [
      rect(140, 100, 196, 148, MEDIUM),
      ...[164, 192, 220].map((x) => line(x, 244, x, 236, THIN)),
      arrow(306, 232, 326, 192),
    ].join(''),
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
  {
    id: 'art-three-panels',
    title: 'Three ordinary hours, side by side',
    purpose: 'Put three unlike activities in frames of the same size, so a reader sees them before anybody ranks them.',
    settled: 'Three equal panels stand in a row, each with one figure doing one ordinary thing. No arrow runs between them and no panel is larger.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => [
      { x: 94, y: 216, scale: 0.42, pose: 'celebrate' },
      { x: 240, y: 216, scale: 0.42, pose: 'carry' },
      { x: 386, y: 216, scale: 0.42, pose: 'sit' },
    ].slice(0, Math.max(count, 1)),
    base: ({ slots, figures }) => [
      ground(),
      ...[28, 174, 320].map((x) => `${rect(x, 92, 132, 140, { ...MEDIUM, fill: '#ffffff' })}${line(x, 216, x + 132, 216, MEDIUM)}`),
      circle(128, 198, 9, MEDIUM),
      rect(252, 188, 42, 28, MEDIUM),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-sequence-of-states',
    title: 'One person, several states, one continuous line',
    purpose: 'Show that a person moves through unlike feelings without becoming a different person, so "not happy all the time" is drawn rather than asserted.',
    settled: 'The same figure stands four times across one unbroken ground line, wearing a different state each time. The composition supplies the three later states; the scene supplies the first.',
    minFigures: 1,
    maxFigures: 1,
    slots: () => [{ x: 92, y: VIEW.ground, scale: 0.62, pose: 'stand' }],
    base: ({ slots, figures }) => {
      const later = ['fatigue', 'frustration', 'reflection'];
      return [
        ground(),
        placeAll(slots, figures),
        ...later.map((expression, index) =>
          placeFigure({ x: 184 + index * 92, y: VIEW.ground, scale: 0.62, pose: 'stand' }, { figure: figures[0].figure, expression })),
      ].join('');
    },
  },
  {
    id: 'art-list-as-objects',
    title: 'A list drawn as the things it names',
    purpose: 'Turn a spoken list into objects around the person saying it, so the items read as parts of a life rather than as bullet points.',
    settled: 'The figure stands in the middle. Around it: two people talking, a path, a fork in the road, a rising line, a clock, and a roof. Every item is a drawing, not a word.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.78, spread: 110, centre: 240 }),
    base: ({ slots, figures }) => [
      ground(),
      anybody(58, VIEW.ground, 0.3, 'stand', 'curiosity'),
      anybody(96, VIEW.ground, 0.3, 'stand', 'joy', true),
      circle(62, 84, 18, MEDIUM),
      line(62, 84, 62, 72, THIN),
      line(62, 84, 72, 88, THIN),
      polyline([[26, 202], [58, 152]], FAINT),
      polyline([[88, 202], [62, 152]], FAINT),
      polyline([[208, 88], [240, 56], [272, 88]], MEDIUM),
      line(208, 88, 272, 88, MEDIUM),
      polyline([[356, 212], [392, 182], [428, 152]], MEDIUM),
      arrow(420, 158, 434, 146, { size: 7 }),
      polyline([[392, 248], [416, 216]], MEDIUM),
      polyline([[416, 216], [398, 188]], MEDIUM),
      polyline([[416, 216], [444, 192]], MEDIUM),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-three-dials',
    title: 'Three readings that need not agree',
    purpose: 'Separate questions that get asked as one: three instruments pointed at the same life, each free to read differently.',
    settled: 'Three dials sit in a row with their needles at three different angles. Nobody is adjusting them, and no dial is marked as the right one.',
    minFigures: 0,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.6, spread: 160, centre: 240 }),
    base: ({ slots, figures }) => {
      const dial = (cx, angle) => {
        const radius = 44;
        const point = [cx + radius * Math.cos(angle), 118 + radius * Math.sin(angle)];
        return [
          curve([cx - 48, 118], [cx, 54], [cx + 48, 118], MEDIUM),
          line(cx - 48, 118, cx + 48, 118, MEDIUM),
          line(cx, 118, point[0], point[1], MEDIUM),
          circle(cx, 118, 5, SOLID),
        ].join('');
      };
      return [
        ground(),
        dial(96, -2.6),
        dial(240, -1.5),
        dial(384, -0.5),
        placeAll(slots, figures),
      ].join('');
    },
  },
  {
    id: 'art-cleared-space',
    title: 'Room to turn around, not an empty life',
    purpose: 'Draw enough room as a cleared space rather than as a solved life: the clutter is still there, pushed back far enough to move.',
    settled: 'A figure stands in a clearing marked by a faint arc. The clutter has not been removed; it has been pushed to the edges of the frame.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.8, spread: 90, centre: 240, poses: ['ease', 'stand'] }),
    base: ({ slots, figures }) => {
      const clutter = (x, y, width, height) => rect(x, y, width, height, MEDIUM);
      return [
        ground(),
        curve([132, VIEW.ground], [240, 184], [348, VIEW.ground], FAINT),
        clutter(24, 226, 30, 26),
        clutter(26, 192, 22, 30),
        clutter(58, 212, 26, 40),
        clutter(20, 158, 34, 28),
        clutter(426, 226, 30, 26),
        clutter(432, 190, 22, 32),
        clutter(394, 210, 28, 42),
        clutter(424, 156, 32, 28),
        placeAll(slots, figures),
      ].join('');
    },
  },
  {
    id: 'art-blocks-that-split',
    title: 'Words that crack when you stand on them',
    purpose: 'Offer the words people reach for first as solid blocks, and show each one giving way under the weight of being asked to carry a definition.',
    settled: 'Three blocks lie on the ground. The first two have already split; the third splits as the figure steps onto it.',
    minFigures: 1,
    maxFigures: 1,
    slots: () => [{ x: 204, y: 228, scale: 0.64, pose: 'walk' }],
    base: ({ slots, figures }) => {
      const block = (x) => rect(x, 228, 72, 24, { ...MEDIUM, fill: '#ffffff' });
      const crack = (x) => polyline([[x + 36, 228], [x + 28, 240], [x + 42, 244], [x + 34, 252]], THIN);
      return [
        ground(),
        block(168), crack(168),
        block(264), crack(264),
        block(360),
        placeAll(slots, figures),
      ].join('');
    },
    reveal: () => [
      polyline([[396, 228], [388, 240], [402, 244], [394, 252]], THIN),
      arrow(396, 196, 396, 222, { size: 7 }),
    ].join(''),
  },
  {
    id: 'art-writing-the-line',
    title: 'Drawing the line you are standing on',
    purpose: 'Show agency as participation rather than control: the line behind is already drawn and is not straight, and the next stretch is being drawn by the person standing on it.',
    settled: 'The figure stands on an uneven line that it is extending to the right with a pen in its hand.',
    minFigures: 1,
    maxFigures: 1,
    slots: () => [{ x: 208, y: VIEW.ground, scale: 0.78, pose: 'point' }],
    base: ({ slots, figures }) => {
      const [, hand] = handPoints({ x: 208, y: VIEW.ground, scale: 0.78, pose: 'point' });
      return [
        polyline([[24, 246], [64, 256], [104, 244], [148, 256], [182, 246], [208, VIEW.ground]], THICK),
        placeAll(slots, figures),
        line(hand.x, hand.y, hand.x + 20, hand.y + 16, MEDIUM),
      ].join('');
    },
    reveal: () => {
      const [, hand] = handPoints({ x: 208, y: VIEW.ground, scale: 0.78, pose: 'point' });
      return [
        polyline([[hand.x + 20, hand.y + 16], [288, 244], [340, 254], [396, 242]], FAINT),
        arrow(396, 242, 440, 248, { size: 7 }),
      ].join('');
    },
  },
  {
    id: 'art-same-game-two-ways',
    title: 'The same game, with and without the people',
    purpose: 'Hold one activity still and change only who is around it, so a reader can see the question of whether the activity or the company is the source.',
    settled: 'Two identical courts. In the first the other players stand far off and turned away; in the second they have come close and turned in.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => [
      { x: 122, y: 220, scale: 0.5, pose: 'walk' },
      { x: 358, y: 220, scale: 0.5, pose: 'celebrate' },
    ].slice(0, Math.max(count, 1)),
    base: ({ slots, figures }) => [
      ground(),
      panel(24, 86, 196, 134),
      panel(260, 86, 196, 134),
      circle(180, 196, 10, MEDIUM),
      circle(416, 196, 10, MEDIUM),
      anybody(44, 220, 0.34, 'stand', 'reflection', true),
      anybody(206, 220, 0.34, 'stand', 'reflection'),
      placeAll(slots, figures),
    ].join(''),
    reveal: () => [
      anybody(306, 220, 0.42, 'stand', 'joy'),
      anybody(408, 220, 0.42, 'stand', 'curiosity', true),
      curve([318, 170], [358, 158], [398, 170], FAINT),
    ].join(''),
  },
  {
    id: 'art-two-evenings',
    title: 'Two evenings, one of them heavier',
    purpose: 'Compare a comfortable evening with a difficult one by what each costs rather than by which looks nicer, by letting the harder panel sit lower on the page.',
    settled: 'Two panels of the same size hold the same person twice, once at rest and once at work. The second panel hangs lower, as though it weighed more.',
    minFigures: 1,
    maxFigures: 1,
    slots: () => [{ x: 118, y: 208, scale: 0.46, pose: 'sit' }],
    base: ({ slots, figures }) => [
      ground(),
      panel(28, 78, 180, 130),
      panel(252, 104, 180, 130),
      line(70, 196, 166, 196, MEDIUM),
      rect(300, 196, 60, 22, MEDIUM),
      placeAll(slots, figures),
      placeFigure({ x: 342, y: 234, scale: 0.46, pose: 'carry' }, { figure: figures[0].figure, expression: 'frustration' }),
    ].join(''),
  },
  {
    id: 'art-ranked-before-weighing',
    title: 'The pans were set before anything was put in them',
    purpose: 'Show a ranking that presents itself as a measurement: the balance is tilted, both pans are empty, and a hand is resting on the one that is already higher.',
    settled: 'An empty two-pan balance hangs with one pan permanently higher, and a hand reaches in from outside the frame to rest on it.',
    minFigures: 0,
    maxFigures: 1,
    slots: (count) => row(count, { scale: 0.68, centre: 70 }),
    base: ({ slots, figures }) => [
      ground(),
      polyline([[232, 206], [248, 206], [240, 150], [232, 206]], MEDIUM),
      line(240, 150, 240, 142, MEDIUM),
      line(172, 124, 308, 162, THICK),
      line(172, 124, 172, 146, THIN),
      line(308, 162, 308, 184, THIN),
      curve([152, 146], [172, 168], [192, 146], MEDIUM),
      curve([288, 184], [308, 206], [328, 184], MEDIUM),
      polyline([[36, 46], [94, 86], [146, 124]], MEDIUM),
      circle(156, 132, 9, MEDIUM),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-three-threads',
    title: 'Three threads running through one ordinary thing',
    purpose: 'Name three things an activity might be supplying without claiming they are all of it: three threads pass through the same afternoon and out the other side.',
    settled: 'A framed ordinary moment has three differently drawn threads running through it, each ending in a shape of its own.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.6, spread: 70, centre: 62 }),
    base: ({ slots, figures }) => {
      const threads = [
        [130, MEDIUM, (x, y) => circle(x, y, 7, MEDIUM)],
        [160, { ...MEDIUM, 'stroke-dasharray': '9 6' }, (x, y) => rect(x - 7, y - 7, 14, 14, MEDIUM)],
        [190, { ...MEDIUM, 'stroke-dasharray': '2 7' }, (x, y) => polyline([[x - 8, y + 7], [x, y - 8], [x + 8, y + 7], [x - 8, y + 7]], MEDIUM)],
      ];
      return [
        ground(),
        rect(192, 104, 126, 110, { ...MEDIUM, fill: '#ffffff' }),
        circle(255, 176, 13, MEDIUM),
        ...threads.map(([y, style, end]) => `${line(126, y, 428, y, style)}${end(440, y)}`),
        placeAll(slots, figures),
      ].join('');
    },
  },
  {
    id: 'art-one-block-grows',
    title: 'A day with one block taking the rest',
    purpose: 'Show a life filling up with one thing, as three states of the same day rather than as a judgement about anybody.',
    settled: 'Three rows show the same day. The block that stands for work widens in each row until it reaches both edges and the other blocks are gone.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.7, spread: 70, centre: 56 }),
    base: ({ slots, figures }) => {
      const strip = (y, blocks) => blocks.map(([x, width], index) =>
        rect(x, y, width, 24, index === blocks.length - 1 ? { ...MEDIUM, fill: '#ffffff' } : MEDIUM)).join('');
      return [
        ground(),
        strip(70, [[140, 54], [200, 56], [262, 50], [318, 60], [384, 68]]),
        strip(108, [[140, 44], [190, 40], [236, 40], [282, 170]]),
        strip(146, [[140, 312]]),
        placeAll(slots, figures),
      ].join('');
    },
  },
  {
    id: 'art-pyramid-and-partial-fills',
    title: 'The staircase, and what the paper actually says',
    purpose: 'Set a familiar diagram beside the account it is a simplification of, so the difference between the two is visible rather than asserted.',
    settled: 'A five-tier pyramid stands on the left with a cross drawn through it. On the right, five bars are each partly filled, to different levels, all at once.',
    minFigures: 1,
    maxFigures: 1,
    slots: () => [{ x: 240, y: VIEW.ground, scale: 0.56, pose: 'stand' }],
    base: ({ slots, figures }) => {
      // Tier lines follow the triangle's own sides, so no rule sticks out of it.
      const tiers = [1, 2, 3, 4].map((step) => {
        const y = 90 + (132 * step) / 5;
        const half = (78 * (y - 90)) / 132;
        return polyline([[120 - half, y], [120 + half, y]], MEDIUM);
      });
      const bars = [0, 1, 2, 3, 4].map((index) => {
        const x = 266 + index * 36;
        const fill = [92, 64, 46, 36, 12][index];
        return `${rect(x, 110, 24, 112, MEDIUM)}${rect(x, 222 - fill, 24, fill, { ...MEDIUM, 'stroke-dasharray': '4 4' })}`;
      });
      return [
        line(42, 222, 198, 222, THICK),
        line(258, 222, 452, 222, THICK),
        polyline([[120, 90], [42, 222]], MEDIUM),
        polyline([[120, 90], [198, 222]], MEDIUM),
        ...tiers,
        ...bars,
        ground(),
        placeAll(slots, figures),
      ].join('');
    },
    reveal: () => [
      line(48, 100, 192, 216, THICK),
      line(192, 100, 48, 216, THICK),
    ].join(''),
  },
  {
    id: 'art-ring-of-four',
    title: 'Four things in a ring, with nothing on top',
    purpose: 'Hold several goods together without ranking them: a ring has no first item, and a column always does.',
    settled: 'Laughter, a climb, a rising line and a figure lying down sit at four points of a ring. No arrow runs between them.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => row(count, { scale: 0.58, spread: 130, centre: 104 }),
    base: ({ slots, figures }) => [
      ground(),
      curve([314, 58], [330, 78], [346, 58], MEDIUM),
      line(310, 44, 302, 34, THIN),
      line(350, 44, 358, 34, THIN),
      polyline([[376, 164], [406, 116], [436, 164]], MEDIUM),
      anybody(406, 164, 0.2, 'walk', 'frustration'),
      arrow(306, 226, 356, 198),
      line(240, 148, 290, 148, THICK),
      circle(234, 140, 8, MEDIUM),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-grown-into-a-frame',
    title: 'The frame that arrives later',
    purpose: 'Show an idea of a good life as something that was added rather than something anybody was born with: the same person, once without the frame and once inside it.',
    settled: 'Two panels hold the same person. In the first they are small and playing with nothing drawn around them; in the second they are taller and a measured frame has been drawn around them, which they are not looking at.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => [
      { x: 118, y: 224, scale: 0.42, pose: 'sit' },
      { x: 344, y: 224, scale: 0.62, pose: 'stand' },
    ].slice(0, Math.max(count, 1)),
    base: ({ slots, figures }) => [
      ground(),
      panel(24, 76, 188, 148),
      panel(260, 76, 188, 148),
      circle(156, 214, 9, MEDIUM),
      placeAll(slots, figures),
    ].join(''),
    reveal: () => [
      rect(288, 96, 112, 122, MEDIUM),
      ...[316, 344, 372].map((x) => line(x, 96, x, 106, THIN)),
      ...[126, 156, 186].map((y) => line(288, y, 298, y, THIN)),
    ].join(''),
  },
  {
    id: 'art-paths-erased',
    title: 'Five ways out, one still drawn',
    purpose: 'Show what "the only correct way" does to a choice: the other routes are not argued against, they simply stop being drawn.',
    settled: 'Five paths leave one point. Four fade out within a short distance; one is drawn the whole way, and the figure is facing it.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.7, spread: 70, centre: 60 }),
    base: ({ slots, figures }) => [
      ground(),
      circle(118, 236, 5, SOLID),
      curve([118, 236], [210, 212], [268, 202], FAINT),
      curve([118, 236], [206, 238], [268, 244], FAINT),
      curve([118, 236], [196, 186], [248, 160], FAINT),
      curve([118, 236], [198, 226], [258, 224], FAINT),
      curve([118, 236], [260, 206], [446, 176], THICK),
      placeAll(slots, figures),
    ].join(''),
    reveal: () => [
      circle(300, 196, 6, SOLID),
      arrow(300, 170, 300, 188, { size: 7 }),
    ].join(''),
  },
  {
    id: 'art-own-leash',
    title: 'Holding your own leash',
    purpose: 'Draw self-regulation without a villain: nobody else is in the frame, and the figure is standing upright and holding the other end itself.',
    settled: 'A figure stands upright holding a leash whose other end is fastened around its own neck. Nobody else is in the frame.',
    minFigures: 1,
    maxFigures: 1,
    slots: () => [{ x: 240, y: VIEW.ground, scale: 0.92, pose: 'carry' }],
    base: ({ slots, figures }) => {
      const [, hand] = handPoints(slots[0]);
      return [
        ground(),
        placeAll(slots, figures),
        curve([228, 152], [240, 162], [252, 152], MEDIUM),
        path(`M ${num(hand.x)},${num(hand.y)} Q ${num(hand.x + 116)},${num(hand.y + 10)} ${num(252)},${num(150)}`, MEDIUM),
      ].join('');
    },
  },
  {
    id: 'art-desire-with-a-trail',
    title: 'A want, with where it came from behind it',
    purpose: 'Show that a want has a history without claiming the want is fake: the shape above the head is solid, and the trail behind it is faint and runs off the frame.',
    settled: 'A small shape hangs above a figure. A faint trail runs back from it through other people and off the edge of the frame.',
    minFigures: 0,
    maxFigures: 1,
    slots: (count) => row(count, { scale: 0.78, centre: 300 }),
    base: ({ slots, figures }) => [
      ground(),
      slots.length === 0 ? anybody(300, VIEW.ground, 0.78, 'stand', 'curiosity') : placeAll(slots, figures),
      polyline([[300, 58], [312, 70], [300, 82], [288, 70], [300, 58]], MEDIUM),
      anybody(196, VIEW.ground, 0.4, 'stand', 'reflection'),
      anybody(126, VIEW.ground, 0.32, 'stand', 'reflection'),
      anybody(66, VIEW.ground, 0.26, 'stand', 'reflection'),
      path('M 288,70 Q 220,52 176,84 Q 132,116 74,96 Q 40,84 16,96', FAINT),
    ].join(''),
  },
  {
    id: 'art-four-answers',
    title: 'One purchase, four different answers',
    purpose: 'Replace a verdict on buying things with the question the beat actually asks: what this particular thing gives the person who bought it.',
    settled: 'A boxed object sits in the middle with four arrows leaving it, each ending at a different small drawing: a cleared surface, a hobby, other people looking, and a shrug.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.7, spread: 70, centre: 62 }),
    base: ({ slots, figures }) => [
      ground(),
      rect(206, 118, 68, 52, { ...MEDIUM, fill: '#ffffff' }),
      line(206, 132, 274, 132, THIN),
      arrow(210, 120, 150, 84),
      arrow(272, 120, 352, 84),
      arrow(272, 168, 352, 206),
      arrow(210, 168, 156, 206),
      line(104, 84, 168, 84, MEDIUM),
      circle(372, 76, 12, MEDIUM),
      line(360, 92, 384, 92, THIN),
      anybody(360, 226, 0.22, 'stand', 'curiosity'),
      anybody(392, 226, 0.22, 'stand', 'curiosity'),
      path('M 126,206 Q 136,196 146,206 Q 156,216 166,206', MEDIUM),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-two-columns-that-leak',
    title: 'Two columns that do not hold',
    purpose: 'Show a tidy division failing on its own terms: items sit on the line between the two columns, and one has been drawn in both at once.',
    settled: 'Two columns of the same size stand side by side. Several items rest on the line between them, and one item appears in both columns, joined by a faint line.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.7, spread: 70, centre: 58 }),
    base: ({ slots, figures }) => {
      const item = (x, y) => rect(x - 11, y - 9, 22, 18, { ...MEDIUM, fill: '#ffffff' });
      return [
        ground(),
        rect(140, 70, 140, 162, MEDIUM),
        rect(280, 70, 140, 162, MEDIUM),
        line(140, 92, 420, 92, THIN),
        item(190, 120), item(190, 158), item(214, 196),
        item(344, 120), item(348, 158),
        item(280, 136), item(280, 180), item(280, 214),
        line(190, 120, 344, 120, FAINT),
        placeAll(slots, figures),
      ].join('');
    },
  },
  {
    id: 'art-claim-against-its-size',
    title: 'The headline, and the finding drawn to scale',
    purpose: 'Put a small measured effect next to the claim it is used to make, at the sizes they actually are, so the gap is seen rather than argued.',
    settled: 'A large block stands for the claim. Beside it, on the same baseline, the measured effect is a sliver barely thicker than the line itself, with its span marked.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.7, spread: 80, centre: 400 }),
    base: ({ slots, figures }) => [
      line(24, 240, 456, 240, THICK),
      rect(36, 76, 190, 164, MEDIUM),
      line(260, 238, 320, 238, THICK),
      line(260, 240, 260, 230, THIN),
      line(320, 240, 320, 230, THIN),
      arrow(290, 206, 290, 232, { size: 7 }),
      ground(),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-shared-timeline',
    title: 'One timeline, four different grounds',
    purpose: 'Show a schedule everybody can see running above circumstances nobody can, so the mismatch is between the markers and the ground, not between the people.',
    settled: 'A marked timeline runs across the top. Below it, four figures stand on ground at four different heights, all reaching toward the same markers.',
    minFigures: 1,
    maxFigures: 4,
    slots: (count) => {
      const places = [[68, 252], [168, 222], [276, 186], [390, 240]];
      return places.slice(0, Math.max(count, 1)).map(([x, y]) => ({ x, y, scale: 0.5, pose: 'reach' }));
    },
    base: ({ slots, figures }) => {
      const places = [[68, 252], [168, 222], [276, 186], [390, 240]];
      return [
        line(28, 58, 452, 58, THICK),
        ...[80, 170, 260, 350, 440].map((x) => line(x, 50, x, 66, THIN)),
        ...places.map(([x, y]) => footing(x, 72, y)),
        ...places.slice(slots.length).map(([x, y]) => anybody(x, y, 0.5, 'reach')),
        placeAll(slots, figures),
      ].join('');
    },
    reveal: () => {
      const places = [[68, 252], [168, 222], [276, 186], [390, 240]];
      return places.map(([x, y]) => line(x + 18, y - 96, x + 18, 72, FAINT)).join('');
    },
  },
  {
    id: 'art-one-burden-lifted',
    title: 'One weight off, the rest where they were',
    purpose: 'Show what removing one specific worry does and does not do: the stack is lighter by exactly one block, and nothing else about it has moved.',
    settled: 'A figure stands beside a stack of four identical blocks, joined to it by an arrow. One block has been lifted clear above the stack; the others have not moved.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.8, spread: 120, centre: 150, poses: ['slump', 'stand'] }),
    base: ({ slots, figures }) => [
      ground(),
      ...[0, 1, 2, 3].map((index) => rect(256, 168 + index * 21, 86, 19, { ...MEDIUM, fill: '#ffffff' })),
      arrow(252, 200, 222, 188),
      placeAll(slots, figures),
    ].join(''),
    reveal: () => [
      rect(256, 104, 86, 19, { ...MEDIUM, fill: '#ffffff' }),
      arrow(368, 160, 368, 118),
    ].join(''),
  },
  {
    id: 'art-second-pressure',
    title: 'The trouble, and the pressure added to it',
    purpose: 'Separate an original difficulty from the expectation laid on top of it, so the second one can be seen as a separate thing arriving from outside.',
    settled: 'A figure sits with its head down under a weight. A second force presses down on the same figure from outside the frame, on its own line.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => [
      { x: 150, y: VIEW.ground, scale: 0.8, pose: 'slump' },
      { x: 348, y: VIEW.ground, scale: 0.8, pose: 'stand' },
    ].slice(0, Math.max(count, 1)),
    base: ({ slots, figures }) => [
      ground(),
      placeAll(slots, figures),
      rect(120, 178, 62, 22, { ...MEDIUM, fill: '#ffffff' }),
    ].join(''),
    reveal: () => arrow(292, 48, 198, 158),
  },
  {
    id: 'art-split-face',
    title: 'Two feelings on one face',
    purpose: 'Draw gratitude and anger as one person rather than two, because the point of the beat is that they are held at the same time.',
    settled: 'One figure. A line runs down the middle of its face, and the half on the right wears the other feeling. It is one face, not two figures. The composition draws that half assuming the scene gives the figure a state whose head is level.',
    minFigures: 1,
    maxFigures: 1,
    slots: () => [{ x: 240, y: VIEW.ground, scale: 1, pose: 'stand' }],
    base: ({ slots, figures }) => `${ground()}${placeAll(slots, figures)}`,
    reveal: ({ slots }) => {
      const { x, y, scale } = slots[0];
      const at = (dx, dy) => [x + dx * scale, y + dy * scale];
      const [maskX, maskY] = at(0, -149);
      const [eyeX, eyeY] = at(8, -139);
      const [browFromX, browFromY] = at(13, -150);
      const [browToX, browToY] = at(4, -145);
      const [mouthFromX, mouthFromY] = at(0, -124);
      const [mouthToX, mouthToY] = at(7, -124);
      const [splitTopX, splitTopY] = at(0, -156);
      const [, splitBottomY] = at(0, -112);
      return [
        rect(maskX, maskY, 15 * scale, 30 * scale, { fill: '#ffffff', stroke: 'none' }),
        circle(eyeX, eyeY, 2.6 * scale, SOLID),
        line(browFromX, browFromY, browToX, browToY, { ...INK, 'stroke-width': 2.5 }),
        line(mouthFromX, mouthFromY, mouthToX, mouthToY, { ...INK, 'stroke-width': 2.5 }),
        line(splitTopX, splitTopY, splitTopX, splitBottomY, THIN),
      ].join('');
    },
  },
  {
    id: 'art-set-points',
    title: 'Five lines, and not all of them come back',
    purpose: 'Limit a comforting generalisation with the shape of the evidence: the lines dip together and recover to different places, and one does not recover.',
    settled: 'Five lines start at the same height, dip sharply, and return to four different levels. The fifth stays down.',
    minFigures: 0,
    maxFigures: 1,
    slots: (count) => row(count, { scale: 0.5, spread: 60, centre: 440 }),
    base: ({ slots, figures }) => {
      const lines = [96, 118, 140, 162, 184].map((start, index) => {
        const ends = [84, 118, 152, 128, 206];
        return path(`M 60,${num(start)} L 150,${num(start)} Q 196,${num(start + 70)} 240,${num(start + 58)} Q 300,${num(ends[index] + 40)} 392,${num(ends[index])}`, MEDIUM);
      });
      return [
        line(52, 232, 420, 232, THICK),
        line(52, 232, 52, 70, THICK),
        ...lines,
        ground(),
        placeAll(slots, figures),
      ].join('');
    },
  },
  {
    id: 'art-equal-panels',
    title: 'A milestone and an ordinary exchange, at the same size',
    purpose: 'Refuse the usual hierarchy by drawing it away: the two panels are the same size, so neither moment is presented as the real one.',
    settled: 'Two panels of identical size. One holds a figure receiving a rolled certificate; the other holds a figure saying something small to somebody who is listening.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => [
      { x: 118, y: 212, scale: 0.48, pose: 'reach' },
      { x: 312, y: 212, scale: 0.48, pose: 'point' },
    ].slice(0, Math.max(count, 1)),
    base: ({ slots, figures }) => {
      const [, hand] = handPoints({ x: 118, y: 212, scale: 0.48, pose: 'reach' });
      return [
        ground(),
        panel(28, 88, 196, 124),
        panel(256, 88, 196, 124),
        placeAll(slots, figures),
        rect(hand.x - 4, hand.y - 4, 26, 9, { ...MEDIUM, fill: '#ffffff' }),
        anybody(396, 212, 0.48, 'stand', 'curiosity', true),
        curve([342, 148], [368, 138], [392, 148], FAINT),
      ].join('');
    },
  },
  {
    id: 'art-quoted-panel-outside',
    title: 'A panel kept outside the room',
    purpose: 'Draw a source nobody in this essay could read: a bordered panel with nothing in it, standing clearly apart from the people who are talking.',
    settled: 'An empty double-bordered panel stands to one side with nothing drawn inside it. The cast stands outside its frame.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.74, spread: 110, centre: 130 }),
    base: ({ slots, figures }) => [
      ground(),
      rect(296, 68, 158, 164, MEDIUM),
      rect(306, 78, 138, 144, FAINT),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-care-undone',
    title: 'The same small acts, taken away one at a time',
    purpose: 'Show that the mechanism which builds belonging runs in both directions, by removing the marks that were holding somebody up.',
    settled: 'The stack of small marks is down to two solid ones; three are drawn as faint outlines where they used to be, and a figure stands on what is left while another takes a mark away.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => [
      { x: 230, y: 196, scale: 0.58, pose: 'stand' },
      { x: 384, y: VIEW.ground, scale: 0.7, pose: 'point', flip: true },
    ].slice(0, Math.max(count, 1)),
    base: ({ slots, figures }) => [
      ground(),
      line(180, 212, 280, 212, MEDIUM),
      line(180, 196, 280, 196, MEDIUM),
      line(180, 180, 280, 180, FAINT),
      line(180, 164, 280, 164, FAINT),
      line(180, 148, 280, 148, FAINT),
      placeAll(slots, figures),
    ].join(''),
    reveal: () => [
      arrow(292, 172, 340, 162),
      line(300, 150, 352, 150, FAINT),
    ].join(''),
  },
  {
    id: 'art-weak-ties-scatter',
    title: 'The people who are not your closest',
    purpose: 'Draw a social life as a scatter at many distances rather than as one best friend, so the beat can be about everybody else in the day.',
    settled: 'One figure stands among people drawn at several distances and sizes, the nearer ones larger. Faint ties run from the figure to each of them.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.74, spread: 90, centre: 196 }),
    base: ({ slots, figures }) => {
      const others = [[64, 0.34], [120, 0.42], [286, 0.46], [350, 0.36], [416, 0.28]];
      return [
        ground(),
        ...others.map(([x, scale], index) => anybody(x, VIEW.ground, scale, 'stand', index % 2 ? 'curiosity' : 'joy', x > 240)),
        placeAll(slots, figures),
      ].join('');
    },
    reveal: ({ slots }) => {
      const from = slots[0] ?? { x: 196 };
      return [[64, 196], [120, 188], [286, 188], [350, 196], [416, 204]]
        .map(([x, y]) => line(from.x, 178, x, y, FAINT))
        .join('');
    },
  },
  {
    id: 'art-shared-table',
    title: 'A table, and the league table in the corner',
    purpose: 'Keep the ordinary thing the finding is about in the middle of the frame, and leave the ranking it is usually quoted for small and faded at the edge.',
    settled: 'People sit around a shared table. A numbered league table is drawn small and faint in the corner.',
    minFigures: 0,
    maxFigures: 3,
    slots: (count) => row(count, { scale: 0.56, spread: 150, centre: 240 }),
    base: ({ slots, figures }) => [
      ground(),
      rect(116, 196, 248, 12, { ...MEDIUM, fill: '#ffffff' }),
      line(140, 208, 140, VIEW.ground, MEDIUM),
      line(340, 208, 340, VIEW.ground, MEDIUM),
      ...[[86, 0.52, false], [394, 0.52, true]].map(([x, scale, flip]) => anybody(x, VIEW.ground, scale, 'stand', 'joy', flip)),
      ...(slots.length === 0 ? [anybody(176, VIEW.ground, 0.56, 'stand', 'curiosity'), anybody(300, VIEW.ground, 0.56, 'stand', 'reflection', true)] : []),
      circle(176, 184, 9, FAINT),
      circle(300, 184, 9, FAINT),
      rect(388, 56, 66, 50, FAINT),
      ...[70, 84, 98].map((y) => line(394, y, 448, y, FAINT)),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-messages-one-way',
    title: 'Messages travelling mostly one way',
    purpose: 'Make the distribution of effort countable rather than asserted: the traffic between two people is drawn, and it is lopsided.',
    settled: 'Two figures face each other. Between them, most of the messages are moving in one direction and a few are coming back.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => [
      { x: 70, y: VIEW.ground, scale: 0.7, pose: 'point' },
      { x: 410, y: VIEW.ground, scale: 0.7, pose: 'stand', flip: true },
    ].slice(0, Math.max(count, 1)),
    base: ({ slots, figures }) => [
      ground(),
      slots.length < 2 ? anybody(410, VIEW.ground, 0.7, 'stand', 'reflection', true) : '',
      ...[106, 132, 158, 184].map((y) => arrow(136, y, 348, y)),
      placeAll(slots, figures),
    ].join(''),
    reveal: () => [
      arrow(348, 210, 136, 210),
      circle(242, 92, 4, SOLID),
    ].join(''),
  },
  {
    id: 'art-overlapping-selves',
    title: 'Selves whose outlines run into each other',
    purpose: 'Draw a self that does not begin bounded and then add other people: the outline over all three never closes around any one of them.',
    settled: 'Three figures stand close together under one continuous open outline that runs over all of them without closing. Where the condition layer is on, the middle one is pressed inward by the shape it is inside.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => {
      const places = [150, 240, 330];
      return places.slice(0, Math.max(count, 1)).map((x) => ({ x, y: VIEW.ground, scale: 0.7 }));
    },
    base: ({ slots, figures }) => {
      const places = [150, 240, 330];
      return [
        ground(),
        ...places.slice(slots.length).map((x, index) => anybody(x, VIEW.ground, 0.7, 'stand', index % 2 ? 'curiosity' : 'reflection')),
        placeAll(slots, figures),
        path('M 62,214 Q 76,112 150,112 Q 206,112 206,160 Q 206,112 266,112 Q 330,112 330,158 Q 330,112 400,116 Q 426,122 424,214', MEDIUM),
      ].join('');
    },
    reveal: () => [
      arrow(206, 174, 226, 174),
      arrow(274, 174, 254, 174),
      curve([240, 128], [220, 160], [240, 192], THIN),
    ].join(''),
  },
  {
    id: 'art-short-box-long-statement',
    title: 'A short sentence, and the one that will not fit in it',
    purpose: 'Show a shorthand against the finding it stands in for, by giving both the same box and letting one of them overflow.',
    settled: 'Two boxes of the same size. The first holds three short strokes with room left over; the second is full and its lines run out past the edges.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.7, spread: 70, centre: 60 }),
    base: ({ slots, figures }) => [
      ground(),
      rect(140, 92, 134, 60, MEDIUM),
      ...[108, 122, 136].map((y, index) => line(150, y, 150 + [96, 74, 52][index], y, THIN)),
      rect(300, 92, 134, 60, MEDIUM),
      ...[104, 116, 128, 140, 152, 164, 176, 188].map((y, index) =>
        line(310, y, 310 + [118, 142, 128, 150, 136, 152, 124, 140][index], y, THIN)),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-curves-replaced',
    title: 'One curve, replaced by several that behave differently',
    purpose: 'Replace a single summary shape with the shapes the reanalysis actually found, so the correction is visible as a change in the drawing.',
    settled: 'The flattening curve is drawn and struck through. From the same origin, three curves leave: one flat, one rising steadily, one rising faster at the end.',
    minFigures: 0,
    maxFigures: 1,
    slots: (count) => row(count, { scale: 0.56, spread: 60, centre: 436 }),
    base: ({ slots, figures }) => [
      line(56, 236, 440, 236, THICK),
      line(56, 236, 56, 64, THICK),
      path('M 62,214 Q 160,96 250,92 Q 340,90 428,88', FAINT),
      ground(),
      placeAll(slots, figures),
    ].join(''),
    reveal: () => [
      line(168, 86, 268, 134, THICK),
      path('M 62,214 Q 180,196 428,194', MEDIUM),
      path('M 62,214 Q 200,168 428,120', MEDIUM),
      path('M 62,214 Q 260,180 428,64', MEDIUM),
    ].join(''),
  },
  {
    id: 'art-one-number-four-situations',
    title: 'One number, four situations',
    purpose: 'Refuse a universal figure by drawing it once, striking it out, and handing the identical amount to people standing in visibly different places.',
    settled: 'A price tag hangs at the top with its number struck through. Below it, four figures hold the identical tag, each standing on different ground with something different beside them.',
    minFigures: 1,
    maxFigures: 4,
    slots: (count) => {
      const places = [[58, 252], [166, 252], [290, 232], [404, 214]];
      return places.slice(0, Math.max(count, 1)).map(([x, y]) => ({ x, y, scale: 0.52, pose: 'carry' }));
    },
    base: ({ slots, figures }) => {
      const places = [[58, 252], [166, 252], [290, 232], [404, 214]];
      const tagAt = (slot) => {
        const [left, right] = handPoints(slot);
        return rect(left.x - 2, left.y - 14, right.x - left.x + 4, 14, { ...MEDIUM, fill: '#ffffff' });
      };
      const everyone = places.map(([x, y]) => ({ x, y, scale: 0.52, pose: 'carry' }));
      return [
        ground(),
        polyline([[196, 46], [296, 46], [296, 96], [196, 96], [180, 71], [196, 46]], MEDIUM),
        circle(206, 71, 5, MEDIUM),
        line(216, 71, 286, 71, THICK),
        ...places.slice(2).map(([x, y]) => footing(x, 84, y)),
        ...everyone.slice(slots.length).map((slot) => placeFigure(slot, { figure: 'unnamed', expression: 'reflection' })),
        placeAll(slots, figures),
        ...everyone.map(tagAt),
        rect(120, 214, 22, 38, MEDIUM),
        polyline([[352, 186], [352, 232]], FAINT),
        polyline([[364, 186], [364, 232]], FAINT),
      ].join('');
    },
  },
  {
    id: 'art-smile-and-bill',
    title: 'A smile and an unpaid bill, both at full weight',
    purpose: 'Hold a reported joy and a real deprivation in the same frame without letting either one fade the other out.',
    settled: 'A figure holds a ruled sheet of paper. Neither the figure nor the sheet is drawn more faintly than the other.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.8, spread: 160, centre: 200, poses: ['carry', 'stand'] }),
    base: ({ slots, figures }) => {
      const [left, right] = handPoints(slots[0]);
      return [
        ground(),
        placeAll(slots, figures),
        rect(left.x - 6, left.y - 12, right.x - left.x + 12, 38, { ...MEDIUM, fill: '#ffffff' }),
        ...[-2, 6, 14].map((offset) => line(left.x, left.y + offset, right.x, left.y + offset, THIN)),
      ].join('');
    },
  },
  {
    id: 'art-pouring-twice',
    title: 'The same pour, from a full container and from a nearly empty one',
    purpose: 'Separate giving from depletion by drawing the identical act twice and changing only what is left behind.',
    settled: 'Two panels hold the same pour. In the first the container stays mostly full; in the second the same pour empties it.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.68, spread: 70, centre: 58 }),
    base: ({ slots, figures }) => {
      const pour = (x, y, remaining) => [
        polyline([[x, y - 56], [x + 44, y - 56], [x + 38, y], [x + 6, y]], MEDIUM),
        rect(x + 7, y - remaining, 30, remaining, { ...MEDIUM, 'stroke-dasharray': '4 4' }),
        curve([x + 46, y - 48], [x + 70, y - 28], [x + 86, y - 6], THIN),
        polyline([[x + 84, y - 44], [x + 128, y - 44], [x + 122, y], [x + 90, y]], MEDIUM),
      ].join('');
      return [
        ground(),
        panel(126, 96, 152, 124),
        panel(296, 96, 152, 124),
        pour(142, 212, 38),
        pour(312, 212, 4),
        placeAll(slots, figures),
      ].join('');
    },
  },
  {
    id: 'art-hour-moved',
    title: 'An hour that moved rather than vanished',
    purpose: 'Show time bought as time transferred: the block leaves one day and arrives in another, and the two rows still hold the same number of blocks.',
    settled: 'Two rows of blocks stand for two days. One row has a gap; the other has the extra block, with an arrow between them.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => row(count, { scale: 0.5, spread: 190, centre: 240 }),
    base: ({ slots, figures }) => {
      const strip = (y, cells) => cells.map((x) => rect(x, y, 30, 22, { ...MEDIUM, fill: '#ffffff' })).join('');
      return [
        ground(),
        strip(72, [96, 130, 164, 232, 266, 300]),
        rect(198, 72, 30, 22, FAINT),
        strip(130, [96, 130, 164, 198, 232, 266, 300]),
        line(80, 68, 80, 98, THIN),
        line(80, 126, 80, 156, THIN),
        placeAll(slots, figures),
      ].join('');
    },
    reveal: () => [
      arrow(348, 86, 348, 126),
      line(336, 130, 360, 130, THIN),
    ].join(''),
  },
  {
    id: 'art-connected-positions',
    title: 'Positions that hold each other up',
    purpose: 'Draw a distribution as a set of relations rather than a set of individuals: moving any figure on the slope would move where the others stand.',
    settled: 'Figures stand at different heights on one slope, joined to each other by lines.',
    minFigures: 0,
    maxFigures: 3,
    slots: (count) => {
      const slopeY = (x) => 252 - ((x - 36) * 132) / 420;
      return [110, 220, 330].slice(0, count).map((x) => ({ x, y: slopeY(x), scale: 0.52 }));
    },
    base: ({ slots, figures }) => {
      const slopeY = (x) => 252 - ((x - 36) * 132) / 420;
      const places = [110, 220, 330];
      return [
        polyline([[36, 252], [456, 120]], THICK),
        ...places.slice(slots.length).map((x, index) => anybody(x, slopeY(x), 0.52, 'stand', index % 2 ? 'reflection' : 'fatigue')),
        anybody(420, slopeY(420), 0.52, 'stand', 'joy'),
        placeAll(slots, figures),
      ].join('');
    },
    reveal: () => {
      const slopeY = (x) => 252 - ((x - 36) * 132) / 420;
      const points = [110, 220, 330, 420];
      return points
        .slice(0, -1)
        .map((x, index) => line(x, slopeY(x) - 50, points[index + 1], slopeY(points[index + 1]) - 50, FAINT))
        .join('');
    },
  },
  {
    id: 'art-self-as-enterprise',
    title: 'A person with a business attached to them',
    purpose: 'Draw the demand that a person manage themselves like a firm, by attaching the firm to an otherwise ordinary stickman.',
    settled: 'An ordinary figure stands with a signboard on a post beside it, a target chart behind its shoulder, and a growth arrow rising from its back.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.82, spread: 120, centre: 150 }),
    base: ({ slots, figures }) => `${ground()}${placeAll(slots, figures)}`,
    reveal: () => [
      line(300, 252, 300, 166, MEDIUM),
      rect(268, 124, 66, 42, { ...MEDIUM, fill: '#ffffff' }),
      line(276, 140, 326, 140, THIN),
      line(276, 152, 310, 152, THIN),
      rect(356, 170, 76, 62, MEDIUM),
      ...[0, 1, 2].map((index) => rect(366 + index * 22, 214 - index * 18, 14, 18 + index * 18, MEDIUM)),
      arrow(228, 206, 262, 170),
    ].join(''),
  },
  {
    id: 'art-frame-they-had-not-noticed',
    title: 'The frame around the people talking',
    purpose: 'Show a standpoint as a frame the people inside it are not looking at, rather than as a flaw in what they are saying.',
    settled: 'Figures stand mid-conversation, turned toward each other. A measured rectangle has been drawn around all of them, and nobody in it is looking at it.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => row(count, { scale: 0.74, spread: 190, centre: 240, poses: ['point', 'stand', 'point'], flips: [false, false, true] }),
    base: ({ slots, figures }) => `${ground()}${placeAll(slots, figures)}`,
    reveal: () => [
      rect(58, 84, 364, 168, MEDIUM),
      ...[118, 178, 238, 298, 358].map((x) => line(x, 84, x, 96, THIN)),
      ...[124, 168, 212].map((y) => line(58, y, 70, y, THIN)),
    ].join(''),
  },
  {
    id: 'art-icon-over-a-gap',
    title: 'An icon laid across a gap it does not cover',
    purpose: 'Test a tool against the size of the problem by drawing both to scale, without saying the tool is useless.',
    settled: 'Two ledges stand either side of a gap. A small rounded icon lies across the gap, far narrower than the distance it is laid over, and the distance is measured.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => [
      { x: 102, y: 210, scale: 0.6, pose: 'reach' },
      { x: 384, y: 210, scale: 0.6, pose: 'stand', flip: true },
    ].slice(0, Math.max(count, 1)),
    base: ({ slots, figures }) => [
      rect(20, 210, 170, 42, MEDIUM),
      rect(300, 210, 160, 42, MEDIUM),
      placeAll(slots, figures),
    ].join(''),
    reveal: () => [
      rect(222, 196, 46, 34, { ...MEDIUM, rx: 9, fill: '#ffffff' }),
      circle(245, 213, 6, MEDIUM),
      span(190, 300, 268),
    ].join(''),
  },
  {
    id: 'art-offered-not-handed',
    title: 'Set down within reach, not handed over',
    purpose: 'Draw a suggestion as something put within reach rather than pressed on anybody, because the beat refuses to turn its list into a rule.',
    settled: 'Four small objects sit on the ground beside the figures, within reach. No hand is holding any of them out.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => row(count, { scale: 0.78, spread: 170, centre: 302 }),
    base: ({ slots, figures }) => [
      ground(),
      rect(34, 230, 26, 22, MEDIUM),
      circle(86, 240, 12, MEDIUM),
      polyline([[122, 252], [138, 228], [154, 252]], MEDIUM),
      curve([174, 252], [186, 230], [198, 252], MEDIUM),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-bench-no-purchase',
    title: 'A bench you can sit on without buying anything',
    purpose: 'Draw the cheapest kind of provision at the size the argument gives it: somewhere to sit, with nothing in the frame that has to be paid for.',
    settled: 'People sit along a plain bench. Nobody is holding a cup and there is no counter anywhere in the frame.',
    minFigures: 1,
    maxFigures: 4,
    slots: (count) => [130, 206, 282, 358].slice(0, Math.max(count, 1)).map((x) => ({ x, y: 206, scale: 0.5, pose: 'sit' })),
    base: ({ slots, figures }) => [
      ground(),
      rect(80, 206, 300, 12, { ...MEDIUM, fill: '#ffffff' }),
      line(104, 218, 104, VIEW.ground, MEDIUM),
      line(356, 218, 356, VIEW.ground, MEDIUM),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-barrier-reduced',
    title: 'The barrier made smaller, and still drawn',
    purpose: 'Show reducing an obstacle rather than abolishing it, because the beat is a direction and not a promise.',
    settled: 'The break in the ground is narrow and the fence is low. Both are still drawn, and the figure can get over them.',
    minFigures: 1,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.7, spread: 90, centre: 110, poses: ['walk'] }),
    base: ({ slots, figures }) => [
      line(20, VIEW.ground, 186, VIEW.ground, THICK),
      line(214, VIEW.ground, 460, VIEW.ground, THICK),
      ...[306, 322, 338].map((x) => line(x, 218, x, VIEW.ground, THIN)),
      line(300, 218, 344, 218, MEDIUM),
      placeAll(slots, figures),
    ].join(''),
    reveal: () => [
      curve([178, 244], [200, 216], [222, 244], FAINT),
      curve([292, 230], [322, 196], [352, 230], FAINT),
      span(186, 214, 276),
    ].join(''),
  },
  {
    id: 'art-empty-evidence-column',
    title: 'The proposals, and the column that is empty',
    purpose: 'Say what has not been done by giving it the same space as what has: two columns of the same size, one full and one deliberately blank.',
    settled: 'Two headed columns stand side by side. The left is full of items; the right has its heading and its outline and nothing in it.',
    minFigures: 0,
    maxFigures: 2,
    slots: (count) => row(count, { scale: 0.56, spread: 80, centre: 60 }),
    base: ({ slots, figures }) => [
      ground(),
      rect(130, 62, 150, 170, MEDIUM),
      rect(292, 62, 150, 170, MEDIUM),
      line(130, 88, 280, 88, MEDIUM),
      line(292, 88, 442, 88, MEDIUM),
      ...[106, 128, 150, 172, 194, 216].map((y, index) => line(142, y, 142 + [120, 96, 128, 104, 116, 88][index], y, THIN)),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-two-kinds-of-effort',
    title: 'Two kinds of effort at the same obstacle',
    purpose: 'Refuse a choice between care and organising by drawing both at the same size, pointed at the same thing.',
    settled: 'One obstacle stands in the middle. On one side people are helping each other over it; on the other, people have their hands on the obstacle itself. Neither group is drawn smaller.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => [
      { x: 96, y: VIEW.ground, scale: 0.7, pose: 'reach' },
      { x: 368, y: VIEW.ground, scale: 0.7, pose: 'point', flip: true },
      { x: 150, y: VIEW.ground, scale: 0.7, pose: 'stand' },
    ].slice(0, Math.max(count, 1)),
    base: ({ slots, figures }) => [
      ground(),
      rect(220, 146, 44, 106, { ...MEDIUM, fill: '#ffffff' }),
      slots.length < 3 ? anybody(152, VIEW.ground, 0.7, 'celebrate', 'frustration') : '',
      anybody(310, VIEW.ground, 0.7, 'point', 'frustration', true),
      curve([120, 190], [214, 108], [300, 190], FAINT),
      placeAll(slots, figures),
    ].join(''),
  },
  {
    id: 'art-facing-pairs',
    title: 'Pairs that did not close the gap',
    purpose: 'Draw a disagreement as a gap that stayed open, with no arrow pointing from one side to the other.',
    settled: 'Four pairs face each other across small gaps. None of the gaps has closed, and nothing in the frame points from one figure to the other.',
    minFigures: 1,
    maxFigures: 4,
    slots: (count) => [68, 178, 288, 400].slice(0, Math.max(count, 1)).map((x) => ({ x: x - 22, y: VIEW.ground, scale: 0.42 })),
    base: ({ slots, figures }) => {
      const centres = [68, 178, 288, 400];
      return [
        ground(),
        ...centres.map((x) => anybody(x + 22, VIEW.ground, 0.42, 'stand', 'frustration', true)),
        ...centres.slice(slots.length).map((x) => anybody(x - 22, VIEW.ground, 0.42, 'stand', 'curiosity')),
        ...centres.map((x) => line(x - 6, 236, x + 6, 236, FAINT)),
        placeAll(slots, figures),
      ].join('');
    },
  },
  {
    id: 'art-questions-above',
    title: 'A question where a conclusion would be',
    purpose: 'End on the question each person is still holding, by putting a question mark exactly where a summing-up would have gone.',
    settled: 'The figures stand side by side with their names above them. Beside each head, where a conclusion would sit, there is a question mark instead.',
    minFigures: 1,
    maxFigures: 3,
    slots: (count) => row(count, { scale: 0.78, spread: 200, centre: 228 }),
    base: ({ slots, figures }) => `${ground()}${placeAll(slots, figures)}`,
    reveal: ({ slots }) => slots.map((slot) => questionMark(slot.x + 48, 92, 1)).join(''),
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
