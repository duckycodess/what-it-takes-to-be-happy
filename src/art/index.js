/**
 * The artwork package's public interface.
 *
 * Three stable vocabularies, all of them referenced by identifier from the
 * content document: figures (who can be drawn), expressions (how they can
 * feel), and compositions (what a scene can show). The content contract names
 * these identifiers; `src/content/validate.js` rejects a document that asks for
 * a drawing this package cannot produce, so a missing illustration is a failed
 * validation rather than an empty frame in a published essay.
 *
 * Nothing here loads at runtime in the reader's browser: every drawing is
 * generated during the build and inlined into the markup.
 */

export { ANATOMY, EXPRESSIONS, FIGURES, POSES, drawFigure, labelAnchor, placeFigure } from './figures.js';
export { COMPOSITIONS, COMPOSITION_IDS, VIEW, drawComposition, hasComposition } from './compositions.js';
export { STORYBOARD_ART, storyboardCoverage } from './storyboard-map.js';

import { EXPRESSIONS, FIGURES } from './figures.js';
import { COMPOSITIONS, drawComposition } from './compositions.js';

/** Every drawable identity, as identifiers the content document may name. */
export const FIGURE_IDS = Object.keys(FIGURES);

/** Every drawable emotional state, as identifiers the content document may name. */
export const EXPRESSION_IDS = Object.keys(EXPRESSIONS);

/**
 * What a scene says it is showing.
 *
 * `situation` draws the base layer: the scene as it first appears.
 * `revealed` draws the base layer with the condition layer that explains it.
 * A beat that returns to an earlier scene uses the same composition in the
 * other state, which is how "it was always there" is shown rather than claimed.
 */
export const ART_STATES = ['situation', 'revealed'];

export const hasFigure = (id) => Object.hasOwn(FIGURES, id);
export const hasExpression = (id) => Object.hasOwn(EXPRESSIONS, id);

/** Whether a composition can actually show a condition layer. */
export const compositionHasReveal = (id) => Boolean(COMPOSITIONS[id]?.reveal);

/** How many figures a composition can place. */
export function figureRange(id) {
  const composition = COMPOSITIONS[id];
  return composition ? { min: composition.minFigures, max: composition.maxFigures } : null;
}

/**
 * Draws one scene's artwork.
 *
 * @param {object} scene
 * @param {string} scene.artId   a composition identifier
 * @param {'situation'|'revealed'} scene.artState which layers are settled
 * @param {Array<{figure: string, expression: string}>} scene.figures in cast order
 * @returns {{svg: string, anchors: Array<{x: number, y: number}>, state: string}}
 */
export function renderSceneArt({ artId, artState = 'situation', figures = [] }) {
  if (!ART_STATES.includes(artState)) {
    throw new Error(`Unknown art state ${JSON.stringify(artState)}. Known states: ${ART_STATES.join(', ')}.`);
  }
  const drawn = drawComposition(artId, figures, { reveal: artState === 'revealed' });
  return { ...drawn, state: artState };
}
