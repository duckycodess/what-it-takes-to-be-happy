/**
 * Which drawing each authored beat uses.
 *
 * [The storyboard](../../docs/storyboard.md) holds 87 scene identifiers. This
 * file answers, for every one of them, which motif draws it and in which state.
 * Eighty-six of the 87 are drawn. It is still not a claim that 86 bespoke
 * illustrations exist: a composition is a motif that several beats can make the
 * same move with, and where one is reused the two beats are making that move.
 *
 * `state` is what the reader sees settled:
 *   `situation` — the base layer only: the scene as it first appears.
 *   `revealed`  — the base layer with the condition layer under or around it.
 * The same motif in the two states is how a beat can return to an earlier
 * scene and show what was always inside it.
 *
 * `absence` says why a beat has no drawing, and matches `visual.artAbsence` in
 * the content document. Exactly one beat carries it: `s087` is the source
 * register, which is a readable list rather than an illustrated situation, so
 * `text-only` is the decision rather than a drawing nobody got to. `note` says
 * what each drawing makes visible.
 *
 * `tools/check-storyboard.sh` owns the editorial storyboard; `test/art.test.js`
 * owns this file, and fails if the storyboard gains or loses a scene.
 */

/** @typedef {{art: string|null, state: 'situation'|'revealed'|null, absence: 'text-only'|null, note: string}} SceneArt */

const textOnly = (note) => ({ art: null, state: null, absence: 'text-only', note });
const motif = (art, state, note) => ({ art, state, absence: null, note });

/** @type {Record<string, SceneArt>} */
export const STORYBOARD_ART = {
  // c0 — Opening
  s001: motif('art-opening-question', 'revealed', 'The landing: the question with the cast around it and a different answer stroke under each of them.'),
  s002: motif('art-apart-together', 'revealed', 'Three contributors on their own patches of ground, and the unnamed dashed figure that marks the invented ones.'),

  // c1 — What counts as happiness?
  s003: motif('art-three-panels', 'situation', 'Three equal panels of ordinary activity, side by side, with nothing said about them yet.'),
  s004: motif('art-three-readings', 'revealed', 'One ordinary moment with a path to each reader of it, each path ending in a different shape.'),
  s005: motif('art-sequence-of-states', 'situation', 'The same figure four times along one unbroken line, in four unlike states.'),
  s006: motif('art-list-as-objects', 'situation', 'Koj’s list as drawn objects placed around the figure, not as a bulleted slide.'),
  s007: motif('art-life-line', 'situation', 'A life as a marked length with one bright point on it.'),
  s008: motif('art-life-line', 'revealed', 'The same length, with the stretches of it that were fenced off made visible.'),
  s009: motif('art-three-dials', 'situation', 'Three dials whose needles point in three different directions at once.'),
  s010: motif('art-two-instruments', 'revealed', 'A dial and a ruler aimed at the same person, giving readings that do not line up.'),
  s011: motif('art-cleared-space', 'situation', 'A small cleared space around a figure: room to live in, not a perfect life.'),
  s012: motif('art-blocks-that-split', 'revealed', 'Three offered words as blocks, each one cracking as weight is put on it.'),
  s013: motif('art-writing-the-line', 'revealed', 'A figure drawing the next stretch of the uneven line it is standing on.'),
  s014: motif('art-three-readings', 'revealed', 'The three readings again, each ending in its own shape, with no shape becoming the others.'),
  s015: motif('art-two-instruments', 'revealed', 'The measuring instruments turned back on us \u2014 on the one of us this beat\u2019s cast line places.'),

  // c2 — Must enjoyment become meaningful or productive?
  s016: motif('art-joy-and-conditions', 'situation', 'The game itself, enjoyed and tiring, with nothing drawn underneath it yet.'),
  s017: motif('art-same-game-two-ways', 'revealed', 'The same game drawn twice, once with the other players far off and once with them close. The beat places a figure in each court rather than the same one twice; see docs/verification.md.'),
  s018: motif('art-two-evenings', 'situation', 'Two evenings in panels of the same size, with the harder one hanging lower.'),
  s019: motif('art-rest-and-the-frame', 'situation', 'An afternoon with nothing attached to it: no frame, no arrow, no outcome.'),
  s020: motif('art-balance', 'situation', 'The afternoon weighed on a plain balance.'),
  s021: motif('art-ranked-before-weighing', 'situation', 'The balance with its pans already at different heights, and a hand resting on the higher one.'),
  s022: motif('art-balance', 'revealed', 'The figure doing the ranking steps up beside the balance it is judging.'),
  s023: motif('art-life-line', 'situation', 'The afternoon as one marked point on the long life line.'),
  s024: motif('art-three-threads', 'situation', 'Three differently drawn threads running through one ordinary activity at once.'),
  s025: motif('art-two-climbs', 'revealed', 'Two identical slopes: one climbed with empty hands, one climbed under a load.'),
  s026: motif('art-rest-and-the-frame', 'revealed', 'The same rest as s019, with the productivity frame somebody draws around it. Taking the frame away is s019 again.'),
  s027: motif('art-one-block-grows', 'situation', 'A day as a row of blocks, with one block widening until it reaches both edges.'),
  s028: motif('art-pyramid-and-partial-fills', 'revealed', 'The familiar pyramid struck through, beside five bars each partly filled at once.'),
  s029: motif('art-ring-of-four', 'situation', 'Four elements held in a ring with no ranking between them.'),

  // c3 — Whose definition are we following?
  s030: motif('art-grown-into-a-frame', 'revealed', 'The beat\u2019s figures small and playing with nothing around them, then the first of them again, taller, inside a measured frame.'),
  s031: motif('art-handed-template', 'situation', 'Identical outline figures handed the identical shape to carry.'),
  s032: motif('art-paths-erased', 'revealed', 'Five paths leaving one point, with only one of them still drawn the whole way.'),
  s033: motif('art-own-leash', 'situation', 'A figure holding its own leash, with nobody else in the frame.'),
  s034: motif('art-desire-with-a-trail', 'situation', 'A want above a head, with the faint trail of where it came from running off the frame.'),
  s035: motif('art-four-answers', 'situation', 'One boxed object with four arrows leaving it, each ending somewhere different.'),
  s036: motif('art-two-columns-that-leak', 'situation', 'Two columns with items sitting on the line between them, and one item in both.'),
  s037: motif('art-one-screen-two-things', 'revealed', 'One screen carrying contact and ranking at the same time.'),
  s038: motif('art-claim-against-its-size', 'situation', 'A small effect drawn to scale beside the claim it is used to make.'),
  s039: motif('art-shared-timeline', 'revealed', 'One marked timeline above four figures standing on four different ground levels.'),
  s040: motif('art-one-burden-lifted', 'revealed', 'One weight lifted clear of the stack, with the rest of it where it was.'),
  s041: motif('art-second-pressure', 'revealed', 'A figure already under a weight, with a second pressure arriving from outside the frame.'),
  s042: motif('art-split-face', 'revealed', 'Two feelings on one face, split down the middle: one figure, not two.'),
  s043: motif('art-set-points', 'situation', 'Five lines dipping together and returning to different levels, and one that does not return.'),
  s044: motif('art-handed-template', 'revealed', 'The same template, set down rather than carried or escaped.'),

  // c4 — How do relationships help, and when does care become pressure?
  s045: motif('art-equal-panels', 'situation', 'A milestone and an ordinary exchange drawn in panels of identical size.'),
  s046: motif('art-quoted-panel-outside', 'situation', 'An empty bordered panel standing outside the cast’s own space.'),
  s047: motif('art-accumulating-care', 'situation', 'Small repeated gestures accumulating into something with a shape.'),
  s048: motif('art-care-undone', 'revealed', 'The stack from s047 with marks taken away, and the figure standing lower on what is left.'),
  s049: motif('art-weak-ties-scatter', 'revealed', 'A scatter of people at several distances, with faint ties drawn to each of them.'),
  s050: motif('art-two-instruments', 'revealed', 'Two differently labelled instruments, clearly not interchangeable.'),
  s051: motif('art-shared-table', 'situation', 'A shared table in the middle, with the league table small and faded in the corner.'),
  s052: motif('art-messages-one-way', 'revealed', 'Messages travelling mostly one way, with a few coming back.'),
  s053: motif('art-overlapping-selves', 'situation', 'The self drawn as an outline that runs into other people rather than closing.'),
  s054: motif('art-overlapping-selves', 'revealed', 'The same overlap, with the beat\u2019s first figure \u2014 the one it names as tense \u2014 in the middle and pressed inward by the shape it is inside.'),
  s055: motif('art-figure-row', 'situation', 'One figure alone and at ease, drawn with the same warmth as the group scenes.'),
  s056: motif('art-accumulating-care', 'revealed', 'The same repeated gestures, with what each one cost attached to it.'),

  // c5 — Who has room for happiness?
  s057: motif('art-invitation-conditions', 'situation', 'The invitation as it arrives, with the friends attached to it.'),
  s058: motif('art-invitation-conditions', 'revealed', 'The identical composition, with the conditions that were always under it made visible.'),
  s059: motif('art-invitation-conditions', 'revealed', 'The free evening filled in with the travel, the tasks, and the care it already contained.'),
  s060: motif('art-one-burden-lifted', 'revealed', 'Money as a set of specific removable worries: one lifted away, the rest unmoved.'),
  s061: motif('art-short-box-long-statement', 'situation', 'A short statement in a box beside a longer one that will not fit in the same box.'),
  s062: motif('art-curves-replaced', 'revealed', 'One flattening curve struck through and replaced by three that behave differently.'),
  s063: motif('art-one-number-four-situations', 'situation', 'A single number struck through, and four people holding it in four different situations.'),
  s064: motif('art-smile-and-bill', 'situation', 'A smile and an unpaid bill in one frame, neither drawn more faintly than the other.'),
  s065: motif('art-spread-and-average', 'situation', 'The same question answered at many different heights.'),
  s066: motif('art-pouring-twice', 'situation', 'The same pour from a full container and from one it empties.'),
  s067: motif('art-hour-moved', 'revealed', 'An hour leaving one day’s row of blocks and arriving in another’s.'),
  s068: motif('art-door-distance', 'revealed', 'An open door with no usable route to it, and the distance measured.'),
  s069: motif('art-door-distance', 'revealed', 'The gap between what is possible and what is allowed, drawn as a measurable distance.'),
  s070: motif('art-connected-positions', 'revealed', 'Positions on one slope, connected to each other rather than standing alone.'),
  s071: motif('art-self-as-enterprise', 'revealed', 'An ordinary stickman with a signboard, a target chart and a growth arrow attached.'),
  s072: motif('art-door-distance', 'revealed', 'Several figures at different distances from the same door.'),
  s073: motif('art-frame-they-had-not-noticed', 'revealed', 'The three contributors mid-conversation inside a frame they are not looking at.'),
  s074: motif('art-icon-over-a-gap', 'revealed', 'An app icon laid across a gap far wider than it is, with the distance measured.'),
  s075: motif('art-joy-and-conditions', 'revealed', 'The joy of s016 again, with the conditions that were holding it up drawn underneath.'),

  // c6 — What could change, and what do we still disagree about?
  s076: motif('art-opening-question', 'revealed', 'The opening question returned to, with the answers written under it.'),
  s077: motif('art-offered-not-handed', 'situation', 'Practices set down within reach beside the figures rather than handed to them.'),
  s078: motif('art-bench-no-purchase', 'situation', 'A plain bench with nobody holding a cup and no counter in the frame.'),
  s079: motif('art-barrier-reduced', 'revealed', 'The break in the ground and the fence from c5, both smaller and both still drawn.'),
  s080: motif('art-spread-and-average', 'revealed', 'An average line drawn over a distribution, with its tail visible.'),
  s081: motif('art-empty-evidence-column', 'situation', 'A column of proposals beside an evidence column drawn empty, with its outline intact.'),
  s082: motif('art-two-kinds-of-effort', 'situation', 'Two kinds of effort pointed at the same obstacle, drawn at the same size.'),
  s083: motif('art-facing-pairs', 'situation', 'Pairs of figures facing each other across gaps that have not closed.'),
  s084: motif('art-questions-above', 'revealed', 'Three figures with a question mark where a conclusion would sit.'),
  s085: motif('art-joy-and-conditions', 'revealed', 'The s016 composition redrawn with the s075 layer kept in place.'),
  s086: motif('art-figure-row', 'situation', 'The whole cast facing outward, toward the reader.'),
  s087: textOnly('No drawing, and not a drawing that is missing: the source register is a plain readable list, and a frame around it would read as an illustration that failed to arrive.'),
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
