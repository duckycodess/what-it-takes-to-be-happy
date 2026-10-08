/**
 * The artwork package's own contracts.
 *
 * Three of them matter most. The identifiers are stable, because the content
 * document names them and a rename would silently repoint a scene at a
 * different drawing. Every drawing is self-contained, because one HTML file has
 * to carry the whole illustrated essay with no network. And the storyboard
 * coverage map is honest: it says which of the 87 authored beats have a motif
 * and which are still carried by their written description.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ART_STATES,
  COMPOSITIONS,
  COMPOSITION_IDS,
  EXPRESSIONS,
  EXPRESSION_IDS,
  FIGURES,
  FIGURE_IDS,
  POSES,
  STORYBOARD_ART,
  drawFigure,
  renderSceneArt,
  storyboardCoverage,
} from '../src/art/index.js';
import { loadValidContent, repoRoot } from './helpers.js';

const figuresFor = (count) => Array.from({ length: count }, (_, index) => ({
  figure: FIGURE_IDS[index % FIGURE_IDS.length],
  expression: EXPRESSION_IDS[index % EXPRESSION_IDS.length],
}));

/** Every drawing a composition can produce, at both settled states. */
function everyDrawing() {
  const drawings = [];
  for (const id of COMPOSITION_IDS) {
    const { minFigures, maxFigures } = COMPOSITIONS[id];
    for (let count = minFigures; count <= maxFigures; count += 1) {
      for (const state of ART_STATES) {
        if (state === 'revealed' && !COMPOSITIONS[id].reveal) continue;
        drawings.push({ id, count, state, ...renderSceneArt({ artId: id, artState: state, figures: figuresFor(count) }) });
      }
    }
  }
  return drawings;
}

test('the drawable identifiers are stable, because content points at them by name', () => {
  // Changing any of these lists is a contract change: a scene, a cast entry, or
  // an expression in content/content.json names them.
  assert.deepEqual(FIGURE_IDS, ['tj', 'koj', 'vier', 'bob', 'nessa', 'dino', 'ivy', 'marco', 'unnamed']);
  assert.deepEqual(EXPRESSION_IDS, ['joy', 'curiosity', 'sadness', 'frustration', 'fatigue', 'reflection', 'uncertainty']);
  assert.deepEqual(COMPOSITION_IDS, [
    'art-figure-row',
    'art-opening-question',
    'art-apart-together',
    'art-three-readings',
    'art-life-line',
    'art-two-instruments',
    'art-balance',
    'art-two-climbs',
    'art-rest-without-a-frame',
    'art-handed-template',
    'art-one-screen-two-things',
    'art-invitation-conditions',
    'art-accumulating-care',
    'art-door-distance',
    'art-joy-and-conditions',
    'art-spread-and-average',
  ]);
});

test('the three contributors and the invented friends are drawn as different kinds of figure', () => {
  const content = loadValidContent();
  for (const character of content.cast) {
    const figure = FIGURES[character.artId];
    assert.ok(figure, `${character.id} points at a figure the artwork package does not draw`);
    assert.equal(figure.role, character.role, `${character.displayName} is drawn as a ${figure.role}`);
  }
  // The unnamed outline exists for figures the essay has deliberately not
  // named, and may never stand in for a contributor or a named friend.
  assert.equal(FIGURES.unnamed.role, 'placeholder');
  assert.ok(!content.cast.some((character) => character.artId === 'unnamed'));
});

test('every figure can be drawn in every state, and no state is a copy of another', () => {
  for (const figure of FIGURE_IDS) {
    const drawn = EXPRESSION_IDS.map((expression) => drawFigure({ figure, expression }));
    for (const [index, svg] of drawn.entries()) {
      assert.match(svg, /^<g data-figure="/, `${figure} should be one group`);
      assert.ok(svg.includes(`data-expression="${EXPRESSION_IDS[index]}"`));
      assert.ok(svg.length > 400, `${figure}/${EXPRESSION_IDS[index]} is suspiciously empty`);
    }
    assert.equal(new Set(drawn).size, drawn.length, `${figure} draws two states identically`);
  }

  // Each identity has to survive every state, or a member would be
  // recognisable only when they happen to be happy.
  for (const expression of EXPRESSION_IDS) {
    const drawn = FIGURE_IDS.map((figure) => drawFigure({ figure, expression }));
    assert.equal(new Set(drawn).size, drawn.length, `two figures look identical when ${expression}`);
  }
});

test('uncertainty is its own state rather than a second name for reflection', () => {
  // The storyboard's six-state vocabulary calls the settled, considering state
  // `reflection`. Not-knowing is a different thing to draw, and the brief asks
  // for it, so it is a seventh drawable state.
  const reflection = drawFigure({ figure: 'tj', expression: 'reflection' });
  const uncertainty = drawFigure({ figure: 'tj', expression: 'uncertainty' });
  assert.notEqual(reflection, uncertainty);
  assert.match(EXPRESSIONS.uncertainty.note, /\S/);

  const content = loadValidContent();
  const unsettled = content.cast.flatMap((character) => character.expressions.filter((entry) => entry.artId === 'uncertainty'));
  assert.ok(unsettled.length > 0, 'the cast should be able to be drawn unsettled');
});

test('every pose is a posture, not a different person', () => {
  for (const pose of Object.keys(POSES)) {
    const svg = drawFigure({ figure: 'koj', expression: 'reflection', pose });
    assert.ok(svg.includes(`data-pose="${pose}"`));
    assert.ok(svg.includes('data-figure="koj"'), `${pose} should keep the identity`);
    assert.equal(POSES[pose].hands.length, 2, `${pose} must say where its hands are, so a prop can be held`);
  }
});

test('a drawing carries nothing that needs anything outside the document', () => {
  // These are the same rules the build audit applies to the finished outputs;
  // here they are checked on every drawing the package can produce, including
  // the ones no scene uses yet.
  const forbidden = [
    [/<image\b/i, 'raster file'],
    [/<use\b/i, 'element reference'],
    [/<text\b/i, 'lettering inside the artwork'],
    [/<foreignObject\b/i, 'embedded HTML'],
    [/<(style|script)\b/i, 'its own stylesheet or script'],
    [/\bid\s*=/i, 'an element identifier that would collide'],
    [/\bhref\s*=/i, 'a link'],
    [/url\s*\(/i, 'an external resource'],
    [/font-family/i, 'a font'],
  ];
  for (const drawing of everyDrawing()) {
    for (const [pattern, what] of forbidden) {
      assert.ok(!pattern.test(drawing.svg), `${drawing.id} (${drawing.state}, ${drawing.count} figures) contains ${what}`);
    }
  }
});

test('every composition places the figures it says it can, and anchors each name above a head', () => {
  for (const drawing of everyDrawing()) {
    assert.equal(drawing.anchors.length, drawing.count, `${drawing.id} should anchor one name per figure`);
    for (const anchor of drawing.anchors) {
      assert.ok(anchor.x > 0 && anchor.x < 100, `${drawing.id} anchors a name off the side of the frame`);
      assert.ok(anchor.y > 0 && anchor.y < 100, `${drawing.id} anchors a name off the top or bottom of the frame`);
    }
    assert.match(drawing.svg, /^<svg class="scene-art" viewBox="0 0 \d+ \d+"/);
    assert.ok(drawing.svg.includes('aria-hidden="true"'), 'the written description is what is announced, not the drawing');
  }
});

test('asking for more figures than a composition can place is refused rather than drawn wrong', () => {
  const composition = COMPOSITIONS['art-two-instruments'];
  assert.throws(
    () => renderSceneArt({ artId: 'art-two-instruments', artState: 'situation', figures: figuresFor(composition.maxFigures + 1) }),
    /places 0 to 2 figures/,
  );
  assert.throws(() => renderSceneArt({ artId: 'art-nothing', figures: [] }), /No composition named/);
});

test('the settled state is what is drawn: the condition layer is present only when the scene says so', () => {
  for (const id of COMPOSITION_IDS) {
    const composition = COMPOSITIONS[id];
    const figures = figuresFor(Math.max(composition.minFigures, 1) <= composition.maxFigures ? Math.max(composition.minFigures, 1) : composition.minFigures);
    const situation = renderSceneArt({ artId: id, artState: 'situation', figures });
    assert.ok(situation.svg.includes('data-art-layer="base"'));
    assert.ok(!situation.svg.includes('data-art-layer="reveal"'), `${id} shows its condition layer before the scene asks for it`);

    if (composition.reveal) {
      const revealed = renderSceneArt({ artId: id, artState: 'revealed', figures });
      assert.ok(revealed.svg.includes('data-art-layer="reveal"'), `${id} should be able to show what is under the situation`);
      assert.ok(revealed.svg.length > situation.svg.length);
      assert.match(composition.settled, /\S/, `${id} must describe the state it settles into`);
    }
  }
});

test('the same scene drawn twice is byte-identical, so a build stays reproducible', () => {
  const figures = figuresFor(2);
  const once = renderSceneArt({ artId: 'art-invitation-conditions', artState: 'revealed', figures });
  const twice = renderSceneArt({ artId: 'art-invitation-conditions', artState: 'revealed', figures });
  assert.equal(once.svg, twice.svg);
  assert.deepEqual(once.anchors, twice.anchors);
});

/* ---- The storyboard coverage map ---------------------------------------- */

const storyboard = readFileSync(join(repoRoot, 'docs/storyboard.md'), 'utf8');

/** Scene identifiers and the figures each scene places, from the storyboard. */
function storyboardScenes() {
  const blocks = storyboard.split(/^#### `(s\d{3})`/m).slice(1);
  const scenes = new Map();
  for (let index = 0; index < blocks.length; index += 2) {
    const id = blocks[index];
    const castLine = (blocks[index + 1].match(/^- Cast:(.*)$/m) ?? [, ''])[1];
    const figures = castLine
      .split('—')[0]                       // expression notes follow an em dash
      .replace(/\([^)]*\)/g, '')                // or sit in brackets after a name
      .match(/`[a-z-]+`/g) ?? [];
    scenes.set(id, figures.map((token) => token.replace(/`/g, '')).filter((name) => name !== 'narrator'));
  }
  return scenes;
}

test('every authored beat in the storyboard has an art decision recorded', () => {
  const scenes = storyboardScenes();
  assert.equal(scenes.size, 87, 'the storyboard should still hold 87 authored beats');
  assert.deepEqual(
    Object.keys(STORYBOARD_ART).sort(),
    [...scenes.keys()].sort(),
    'the coverage map and the storyboard disagree about which beats exist',
  );

  for (const [id, entry] of Object.entries(STORYBOARD_ART)) {
    assert.ok(entry.note.trim().length > 20, `${id} must say what its drawing shows, or what one would have to show`);
    if (entry.art === null) {
      assert.equal(entry.state, null, `${id} declares a fallback, so it has no state`);
      continue;
    }
    assert.ok(COMPOSITIONS[entry.art], `${id} points at composition ${entry.art}, which does not exist`);
    assert.ok(ART_STATES.includes(entry.state), `${id} must settle into a state the composition can show`);
    if (entry.state === 'revealed') {
      assert.ok(COMPOSITIONS[entry.art].reveal, `${id} asks ${entry.art} for a condition layer it does not have`);
    }
  }
});

test('a mapped beat fits the composition it was given, cast and all', () => {
  const scenes = storyboardScenes();
  for (const [id, entry] of Object.entries(STORYBOARD_ART)) {
    if (entry.art === null) continue;
    const composition = COMPOSITIONS[entry.art];
    const placed = scenes.get(id).length;
    assert.ok(
      placed >= composition.minFigures && placed <= composition.maxFigures,
      `${id} places ${placed} figures, but ${entry.art} takes ${composition.minFigures} to ${composition.maxFigures}`,
    );
  }
});

test('the coverage map is honest about how much is drawn and how much is not', () => {
  const coverage = storyboardCoverage();
  assert.equal(coverage.total, 87);
  assert.equal(coverage.drawn + coverage.fallback, coverage.total);
  // The claim this package makes is representative motifs, not 87 bespoke
  // pictures. Both halves of that have to stay true.
  assert.ok(coverage.drawn >= 30, `only ${coverage.drawn} beats have a motif`);
  assert.ok(coverage.fallback > 0, 'a map claiming every beat is drawn would be a false claim');

  // Nothing in the catalogue is dead: every motif is reached by a real beat.
  for (const id of COMPOSITION_IDS) {
    assert.ok(coverage.byComposition[id] > 0, `${id} is used by no beat in the storyboard`);
  }

  // Every chapter gets at least one drawing, so no question is carried by text alone.
  const chapters = [...storyboard.matchAll(/^## `(c\d)`[\s\S]*?(?=^## |\Z)/gm)];
  assert.equal(chapters.length, 7);
  for (const [block] of chapters.map((match) => [match[0]])) {
    const ids = [...block.matchAll(/^#### `(s\d{3})`/gm)].map((match) => match[1]);
    assert.ok(ids.some((id) => STORYBOARD_ART[id].art !== null), `a chapter has no drawn beat at all: ${ids[0]}`);
  }
});
