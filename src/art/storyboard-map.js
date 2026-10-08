/**
 * Which drawing each authored beat uses.
 *
 * [The storyboard](../../docs/storyboard.md) holds 87 scene identifiers. This
 * file answers, for every one of them, either "this motif in this state" or
 * "no drawing yet, and here is what one would have to show". It is not a claim
 * that 87 bespoke illustrations exist — they do not, and a map that implied
 * they did would be worse than useless to whoever integrates the essay.
 *
 * `state` is what the reader sees settled:
 *   `situation` — the base layer only: the scene as it first appears.
 *   `revealed`  — the base layer with the condition layer under or around it.
 * The same motif in the two states is how a beat can return to an earlier
 * scene and show what was always inside it.
 *
 * A `null` art entry is a declared fallback, not an omission: the scene renders
 * its cast and its written static description, which carries the meaning on its
 * own in print, under reduced motion, and to a screen reader. `note` says what
 * a bespoke drawing would have to make visible, so the gap stays specific.
 *
 * `tools/check-storyboard.sh` owns the editorial storyboard; `test/art.test.js`
 * owns this file, and fails if the storyboard gains or loses a scene.
 */

/** @typedef {{art: string|null, state: 'situation'|'revealed'|null, note: string}} SceneArt */

const bespoke = (note) => ({ art: null, state: null, note });
const motif = (art, state, note) => ({ art, state, note });

/** @type {Record<string, SceneArt>} */
export const STORYBOARD_ART = {
  // c0 — Opening
  s001: motif('art-opening-question', 'revealed', 'The landing: the question with the cast around it and a different answer stroke under each of them.'),
  s002: motif('art-apart-together', 'revealed', 'Three contributors on their own patches of ground, and the unnamed dashed figure that marks the invented ones.'),

  // c1 — What counts as happiness?
  s003: bespoke('Three small panels of recognisable ordinary activity, side by side, with nothing said about them yet.'),
  s004: motif('art-three-readings', 'revealed', 'One ordinary moment with a path to each reader of it, each path ending in a different shape.'),
  s005: bespoke('One figure carrying several states in sequence, so "not happy all the time" is visible rather than asserted.'),
  s006: bespoke('Koj’s list as drawn objects placed around the figure, not as a bulleted slide.'),
  s007: motif('art-life-line', 'situation', 'A life as a marked length with one bright point on it.'),
  s008: motif('art-life-line', 'revealed', 'The same length, with the stretches of it that were fenced off made visible.'),
  s009: bespoke('Three dials that can point in different directions at the same time.'),
  s010: motif('art-two-instruments', 'revealed', 'A dial and a ruler aimed at the same person, giving readings that do not line up.'),
  s011: bespoke('A small cleared space around a figure: room to live in, not a perfect life.'),
  s012: bespoke('Three offered words, each one cracking as weight is put on it.'),
  s013: bespoke('A figure writing the line it is standing on.'),
  s014: motif('art-three-readings', 'revealed', 'The three readings again, each ending in its own shape, with no shape becoming the others.'),
  s015: motif('art-two-instruments', 'revealed', 'The measuring instruments turned back on the three of us.'),

  // c2 — Must enjoyment become meaningful or productive?
  s016: motif('art-joy-and-conditions', 'situation', 'The game itself, enjoyed and tiring, with nothing drawn underneath it yet.'),
  s017: bespoke('The same game drawn twice, once with familiar figures in it and once without.'),
  s018: bespoke('Two evenings side by side, carrying visibly different weights.'),
  s019: motif('art-rest-and-the-frame', 'situation', 'An afternoon with nothing attached to it: no frame, no arrow, no outcome.'),
  s020: motif('art-balance', 'situation', 'The afternoon weighed on a plain balance.'),
  s021: bespoke('The same balance with the pans already sitting at different heights before anything is placed on them.'),
  s022: motif('art-balance', 'revealed', 'The figure doing the ranking steps up beside the balance it is judging.'),
  s023: motif('art-life-line', 'situation', 'The afternoon as one marked point on the long life line.'),
  s024: bespoke('Three threads running through one ordinary activity at once.'),
  s025: motif('art-two-climbs', 'revealed', 'Two identical slopes: one climbed with empty hands, one climbed under a load.'),
  s026: motif('art-rest-and-the-frame', 'revealed', 'The same rest as s019, with the productivity frame somebody draws around it. Taking the frame away is s019 again.'),
  s027: bespoke('A day with one block expanding until it touches every edge.'),
  s028: bespoke('The familiar pyramid, redrawn as overlapping partial fills.'),
  s029: bespoke('Four elements held in one frame with no ranking between them.'),

  // c3 — Whose definition are we following?
  s030: bespoke('A small figure playing, with no frame drawn around the play.'),
  s031: motif('art-handed-template', 'situation', 'Identical outline figures handed the identical shape to carry.'),
  s032: bespoke('Several paths, with all but one erased.'),
  s033: bespoke('A figure holding its own leash.'),
  s034: bespoke('A desire drawn with the visible trail of where it came from.'),
  s035: bespoke('One object with four different arrows leaving it.'),
  s036: bespoke('Two columns with items visibly crossing between them.'),
  s037: motif('art-one-screen-two-things', 'revealed', 'One screen carrying contact and ranking at the same time.'),
  s038: bespoke('A small effect drawn at its actual size beside the claim it is used to make.'),
  s039: bespoke('One timeline above several very different ground levels.'),
  s040: bespoke('A weight partly lifted, with the rest of it still resting.'),
  s041: bespoke('A sad figure with a second, external pressure arrow added to it.'),
  s042: bespoke('Two expressions held by one figure at once.'),
  s043: bespoke('Several lines returning to different levels, and some not returning.'),
  s044: motif('art-handed-template', 'revealed', 'The same template, set down rather than carried or escaped.'),

  // c4 — How do relationships help, and when does care become pressure?
  s045: bespoke('An unremarkable exchange drawn at the same scale as a milestone.'),
  s046: bespoke('A quoted panel with a visible border, outside the cast’s own space.'),
  s047: motif('art-accumulating-care', 'situation', 'Small repeated gestures accumulating into something with a shape.'),
  s048: bespoke('The same accumulation as s047, inverted, so the same ordinariness does harm.'),
  s049: bespoke('A map of familiar faces at varying distances.'),
  s050: motif('art-two-instruments', 'revealed', 'Two differently labelled instruments, clearly not interchangeable.'),
  s051: bespoke('A shared table rather than a leaderboard.'),
  s052: bespoke('Messages travelling mostly in one direction.'),
  s053: bespoke('The self drawn as overlapping with others rather than bounded.'),
  s054: bespoke('The same overlap, with one figure pressed out of shape by it.'),
  s055: motif('art-figure-row', 'situation', 'One figure alone and at ease, drawn with the same warmth as the group scenes.'),
  s056: motif('art-accumulating-care', 'revealed', 'The same repeated gestures, with what each one cost attached to it.'),

  // c5 — Who has room for happiness?
  s057: motif('art-invitation-conditions', 'situation', 'The invitation as it arrives, with the friends attached to it.'),
  s058: motif('art-invitation-conditions', 'revealed', 'The identical composition, with the conditions that were always under it made visible.'),
  s059: motif('art-invitation-conditions', 'revealed', 'The free evening filled in with the travel, the tasks, and the care it already contained.'),
  s060: bespoke('Money drawn as a set of specific removable worries.'),
  s061: bespoke('A short statement beside a longer one that does not fit inside it.'),
  s062: bespoke('One curve replaced by several that behave differently.'),
  s063: bespoke('A single figure on a price tag, crossed out.'),
  s064: bespoke('A smile and an unpaid bill in one frame, neither erasing the other.'),
  s065: motif('art-spread-and-average', 'situation', 'The same question answered at many different heights.'),
  s066: bespoke('Giving drawn from a full container and from a nearly empty one.'),
  s067: bespoke('An hour moving out of one person’s day and into another’s.'),
  s068: motif('art-door-distance', 'revealed', 'An open door with no usable route to it, and the distance measured.'),
  s069: motif('art-door-distance', 'revealed', 'The gap between what is possible and what is allowed, drawn as a measurable distance.'),
  s070: bespoke('Positions connected by lines rather than standing alone.'),
  s071: bespoke('A person drawn as a small business with its own targets.'),
  s072: motif('art-door-distance', 'revealed', 'Several figures at different distances from the same door.'),
  s073: bespoke('The three contributors drawn inside a frame they had not noticed.'),
  s074: bespoke('An app icon placed over a gap it does not fill.'),
  s075: motif('art-joy-and-conditions', 'revealed', 'The joy of s016 again, with the conditions that were holding it up drawn underneath.'),

  // c6 — What could change, and what do we still disagree about?
  s076: motif('art-opening-question', 'revealed', 'The opening question returned to, with the answers written under it.'),
  s077: bespoke('Practices set down beside a figure rather than handed to it.'),
  s078: bespoke('A bench that does not require a purchase.'),
  s079: bespoke('The barriers from c5 reduced rather than removed.'),
  s080: motif('art-spread-and-average', 'revealed', 'An average line drawn over a distribution, with its tail visible.'),
  s081: bespoke('A proposal with an explicitly empty evidence column.'),
  s082: bespoke('Two kinds of effort pointed at the same obstacle.'),
  s083: bespoke('Pairs of figures facing each other, neither moved.'),
  s084: bespoke('Three figures, each with an unanswered question above them instead of a conclusion.'),
  s085: motif('art-joy-and-conditions', 'revealed', 'The s016 composition redrawn with the s075 layer kept in place.'),
  s086: motif('art-figure-row', 'situation', 'The whole cast facing outward, toward the reader.'),
  s087: bespoke('No drawing: the source register is a plain readable list, and stays legible in print and offline.'),
};

/** Scenes with a motif, and scenes still relying on their written description. */
export function storyboardCoverage(map = STORYBOARD_ART) {
  const entries = Object.entries(map);
  const drawn = entries.filter(([, entry]) => entry.art !== null);
  return {
    total: entries.length,
    drawn: drawn.length,
    fallback: entries.length - drawn.length,
    byComposition: drawn.reduce((tally, [, entry]) => {
      tally[entry.art] = (tally[entry.art] ?? 0) + 1;
      return tally;
    }, {}),
  };
}
