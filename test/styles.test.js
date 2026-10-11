/**
 * Three promises the stylesheet makes that no amount of checking the rendered
 * text can catch, because each is about what a *browser* does with markup
 * that is already there.
 *
 * The first is that print carries the whole argument. Every output already
 * contains all 45 scenes; a single `display: none` that print forgets to
 * answer would drop part of the essay from the printed page while every
 * content check kept passing.
 *
 * The second is that the text can be read: the palette is declared once, in
 * custom properties, so it can be measured once.
 *
 * The third is that a reader can see where the script just sent them. Focus
 * moves to a scene, to a register entry or back to the landing title, and
 * none of those is reached by tabbing, so none of them can rely on
 * `:focus-visible` to paint the ring.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { repoRoot } from './helpers.js';
import { HOSTED_ONLY_CSS, PROJECT_FONT, FONT_URL_TOKEN, PROJECT_FONT_URL_TOKEN } from '../src/build/assets.js';
import { withoutHostedOnly } from '../src/build/inline.js';

const css = readFileSync(join(repoRoot, 'src/runtime/styles.css'), 'utf8');

/** Strips comments, then splits into `{ selector, body }` rules. */
function rules(source) {
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: match[1].trim().replace(/\s+/g, ' '),
    body: match[2].trim(),
  }));
}

/** The rules inside `@media print`, and everything outside it. */
function split(source) {
  const start = source.indexOf('@media print');
  assert.ok(start > 0, 'the stylesheet should have a print block');
  const open = source.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) { end = i; break; }
    }
  }
  return {
    screen: rules(source.slice(0, start) + source.slice(end + 1)),
    print: rules(source.slice(open + 1, end)),
  };
}

const { screen, print } = split(css);

/** The class names a selector targets, ignoring state and attributes. */
const classesIn = (selector) => [...selector.matchAll(/\.([\w-]+)/g)].map((match) => match[1]);

/**
 * The class names a rule actually acts on: the last compound of each
 * comma-separated selector. `html.js[data-view] .landing` hides the landing,
 * not `html.js`, and counting the qualifier would report the script flag as a
 * piece of the essay that print forgot.
 */
const subjectsOf = (selector) => selector
  .split(',')
  .flatMap((part) => classesIn(part.trim().split(/\s+/).at(-1)));

test('a name is positioned against the image box, so it cannot drift off the head', () => {
  // The earlier build positioned names against an outer frame, so any rule
  // that resized the drawing alone left the names behind. They are now
  // absolutely positioned inside `.art-anchor`, which is the image's own box:
  // whatever width the image takes, at any viewport or on paper, the labels
  // take with it. That is a structural guarantee, so it is checked
  // structurally rather than by naming the rules that must not exist.
  const anchor = screen.find((rule) => rule.selector === '.art-anchor');
  assert.match(anchor.body, /position:\s*relative/, 'the label\'s containing block is the image box');

  const image = screen.find((rule) => rule.selector === '.art-anchor img');
  assert.match(image.body, /width:\s*100%/, 'and the image fills that box exactly');
  assert.match(image.body, /height:\s*auto/, 'at its own proportions, uncropped');

  const label = screen.find((rule) => rule.selector === '.art-label');
  assert.match(label.body, /position:\s*absolute/);
  assert.match(label.body, /left:\s*var\(--x\)/, 'at the fraction the asset was inspected at');
  assert.match(label.body, /transform:\s*translate\(-50%, -100%\)/, 'sitting above its anchor point');

  // A name sits above the top of the drawing, so the figure reserves room for
  // it. Without that reserve the first row of names is clipped by whatever
  // sits above the illustration.
  const art = screen.find((rule) => rule.selector === '.art');
  assert.match(art.body, /padding-top:\s*2\.2em/, 'the reserve is in em, so larger type gets more room');
});

test('everything a view hides on screen is either restored in print or is screen apparatus', () => {
  // Apparatus: controls and shortcuts that carry no part of the argument.
  // Anything new that hides content has to be added to the print restore
  // rules, or added here with a reason, rather than silently disappearing.
  const APPARATUS = new Set([
    'reader-controls',
    'chapter-menu',
    'art-control',
    'sources-return',
    'skip-link',
    'js-only',
  ]);

  const hiddenByView = new Set();
  for (const rule of screen) {
    if (!/display:\s*none/.test(rule.body)) continue;
    if (!rule.selector.includes('[data-view')) continue;
    for (const name of subjectsOf(rule.selector)) hiddenByView.add(name);
  }
  assert.ok(hiddenByView.size > 0, 'the views should hide something, or there are no views');

  const restored = new Set();
  for (const rule of print) {
    if (!/display:\s*(block|flex|grid|inline|revert)/.test(rule.body)) continue;
    for (const name of subjectsOf(rule.selector)) restored.add(name);
  }

  for (const name of hiddenByView) {
    if (APPARATUS.has(name)) continue;
    assert.ok(restored.has(name), `.${name} is hidden by a view and never shown again in print`);
  }
});

test('print shows the argument whichever view the screen was left in', () => {
  const restoring = print.filter((rule) => /display:\s*revert\s*!important/.test(rule.body));
  const covered = new Set(restoring.flatMap((rule) => classesIn(rule.selector)));

  for (const part of ['landing', 'essay-body', 'chapter-title', 'scene']) {
    assert.ok(covered.has(part), `.${part} must print whatever the view state is`);
  }
  // A restore written against one named view would leave the other views
  // printing an incomplete essay, so the attribute is matched bare.
  for (const rule of restoring) {
    if (!rule.selector.includes('[data-view')) continue;
    assert.ok(!/\[data-view=/.test(rule.selector), `the print restore "${rule.selector}" only answers one view`);
  }
});

test('both drawings of an optional comparison print, with their labels', () => {
  // On screen a comparison shows the state its control names. On paper there
  // is no control, so a printed page that showed one state would be missing
  // half of what the scene compares. Nothing here depends on the script
  // having run: the rule answers the markup, not an event.
  const restoring = print.filter((rule) => /display:\s*revert\s*!important/.test(rule.body))
    .map((rule) => rule.selector)
    .join(' ');
  assert.ok(restoring.includes('.art-comparison .art-view'), 'both states must print');
  assert.ok(restoring.includes('.art-comparison .art-view-label'), 'and each must be labelled');

  const hidden = print.find((rule) => /display:\s*none\s*!important/.test(rule.body));
  assert.ok(hidden.selector.includes('.art-control'), 'the control itself does not print');
});

/* --- Contrast ------------------------------------------------------------- */

const tokens = Object.fromEntries(
  [...css.matchAll(/^\s*(--[\w-]+):\s*(#[0-9a-fA-F]{6});/gm)].map((match) => [match[1], match[2].toLowerCase()]),
);

const channel = (value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

test('every text colour the palette declares is readable on every surface it sits on', () => {
  const surfaces = { paper: tokens['--paper'], highlight: tokens['--highlight'], white: '#ffffff' };
  const text = ['--ink', '--ink-soft', '--accent'];

  for (const name of [...text, '--paper', '--highlight', '--rule', '--rule-strong']) {
    assert.ok(tokens[name], `${name} should be declared as a hex colour so it can be measured`);
  }

  for (const name of text) {
    for (const [surface, background] of Object.entries(surfaces)) {
      const ratio = contrast(tokens[name], background);
      assert.ok(ratio >= 4.5, `${name} on ${surface} is ${ratio.toFixed(2)}:1, below the 4.5:1 body text needs`);
    }
  }

  // Reversed, for the one place paper sits on ink.
  assert.ok(contrast(tokens['--paper'], tokens['--ink']) >= 4.5);
});

test('a boundary a reader has to see meets the ratio a boundary needs', () => {
  for (const background of [tokens['--paper'], tokens['--highlight']]) {
    const ratio = contrast(tokens['--rule-strong'], background);
    assert.ok(ratio >= 3, `--rule-strong is ${ratio.toFixed(2)}:1, below the 3:1 a meaningful boundary needs`);
  }
});

/* --- Reflow and motion ----------------------------------------------------- */

test('long unbroken text is allowed to break rather than scroll the page sideways', () => {
  const breaking = screen.filter((rule) => /overflow-wrap:\s*(break-word|anywhere)/.test(rule.body));
  const selectors = breaking.map((rule) => rule.selector).join(' ');

  // The register's longest runs are a DOI and a bare URL, and both are inside
  // a paragraph, so covering the element rather than a class is what reaches
  // them. A phone at 375px is where this shows up as sideways scrolling.
  for (const element of ['p', 'li', 'h1', 'h2', 'h3']) {
    assert.ok(new RegExp(`(^|[\\s,])${element}([\\s,]|$)`).test(selectors), `<${element}> needs it`);
  }
  assert.ok(
    breaking.some((rule) => /\bli\b/.test(rule.selector)),
    'a register entry is a list item and can be one long unbroken run',
  );
});

test('a reader who asked for less motion is answered', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(block, /animation-duration:\s*0\.001ms\s*!important/);
  assert.match(block, /transition-duration:\s*0\.001ms\s*!important/);
});

test('every target the script focuses carries a ring without waiting for :focus-visible', () => {
  // A programmatic focus move after a pointer click does not satisfy
  // `:focus-visible`, so none of these can rely on it. Each one is somewhere
  // the browser script sends the reader: a beat, the register, and the single
  // source entry a citation links to.
  const ringed = screen
    .filter((rule) => /outline:\s*\d+px solid/.test(rule.body))
    .map((rule) => rule.selector)
    .join(' ');
  for (const target of ['.scene:focus', '.source:focus', '#landing-title:focus']) {
    // Not `:focus-visible`, which the browser withholds after a pointer click.
    assert.ok(ringed.includes(target), `${target} is focused by the script but is never ringed`);
  }

  // Nothing may take the ring away again. The one element deliberately left
  // unringed is the skip link's target, which is the whole essay: outlining
  // everything a reader skipped to marks nothing.
  const removed = screen.filter((rule) => /outline:\s*none/.test(rule.body)).map((rule) => rule.selector);
  assert.deepEqual(removed, ['#essay[tabindex="-1"]:focus']);

  // And a ring marks where a reader is looking, which paper does not have.
  const reset = print.filter((rule) => /outline:\s*none/.test(rule.body)).map((rule) => rule.selector).join(' ');
  for (const target of ['.scene:focus', '.source:focus', '#landing-title:focus']) {
    assert.ok(reset.includes(target), `${target} would print its focus ring`);
  }
});

test('everything that depends on the project typeface is inside the region the offline file drops', () => {
  const start = css.indexOf(HOSTED_ONLY_CSS.start);
  const end = css.indexOf(HOSTED_ONLY_CSS.end);
  assert.ok(start > 0 && end > start, 'the stylesheet marks its hosted-only region');

  const hostedOnly = css.slice(start, end);
  const elsewhere = css.slice(0, start) + css.slice(end);

  assert.ok(hostedOnly.includes(`'${PROJECT_FONT.family}'`), 'the project typeface is declared in there');
  assert.ok(
    !elsewhere.replace(/\/\*[\s\S]*?\*\//g, '').includes(PROJECT_FONT.family),
    'and nowhere else, so stripping the region cannot leave a rule asking for a face that is not packaged',
  );

  // Both outputs must still have a font stack and a readable leading, so the
  // region can only ever retune what is already declared outside it.
  const base = rules(elsewhere).find((rule) => rule.selector === ':root');
  assert.match(base.body, /--body:\s*'Bundled Fallback'/, 'the fallback stack stands on its own');
  assert.match(base.body, /--body-line-height:/, 'and so does the leading it was drawn with');
  assert.match(base.body, /--measure:/, 'and the measure');
});

test('the offline stylesheet is what is left when that region goes', () => {
  const offlineCss = withoutHostedOnly(css, HOSTED_ONLY_CSS);

  assert.ok(!offlineCss.includes(HOSTED_ONLY_CSS.start) && !offlineCss.includes(HOSTED_ONLY_CSS.end));
  assert.ok(!offlineCss.includes(PROJECT_FONT_URL_TOKEN), 'with no placeholder left for a font it does not carry');
  assert.ok(offlineCss.includes(FONT_URL_TOKEN), 'and the fallback still to be packaged');

  // Nothing half-removed: the braces still balance and the last rule in the
  // stylesheet is still the last rule in the stylesheet.
  assert.equal(
    (offlineCss.match(/\{/g) || []).length,
    (offlineCss.match(/\}/g) || []).length,
    'the braces balance',
  );
  assert.equal(offlineCss.trimEnd().endsWith('}'), true);
  assert.throws(() => withoutHostedOnly(offlineCss, HOSTED_ONLY_CSS), /no longer marks its hosted-only region/);
});
