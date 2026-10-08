/**
 * Two promises the stylesheet makes that no amount of checking the rendered
 * text can catch, because both are about what a *browser* does with markup
 * that is already there.
 *
 * The first is that print carries the whole argument. Every output already
 * contains every beat; a single `display: none` that print forgets to answer
 * would drop part of the essay from the printed page while every content
 * check kept passing.
 *
 * The second is that the text can be read. The palette is declared once, in
 * custom properties, so it can be measured once.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { repoRoot } from './helpers.js';

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

test('everything a view hides on screen is either restored in print or is screen apparatus', () => {
  // Apparatus: controls and shortcuts that carry no part of the argument.
  // Anything new that hides content has to be added to the print restore
  // rules, or added here with a reason, rather than silently disappearing.
  const APPARATUS = new Set([
    'beat-controls',
    'view-switch',
    'chapter-nav',
    'landing-actions',
    'landing-sources',
    'source-more',
    'register-return',
    'reading-time',
    'skip-link',
    'js-only',
    'beat-boundary',
  ]);

  const hiddenByView = new Set();
  for (const rule of screen) {
    if (!/display:\s*none/.test(rule.body)) continue;
    if (!rule.selector.includes('[data-view')) continue;
    for (const name of classesIn(rule.selector)) hiddenByView.add(name);
  }
  assert.ok(hiddenByView.size > 0, 'the views should hide something, or there are no views');

  const restored = new Set();
  for (const rule of print) {
    if (!/display:\s*(block|flex|grid|inline)/.test(rule.body)) continue;
    for (const name of classesIn(rule.selector)) restored.add(name);
  }

  for (const name of hiddenByView) {
    if (APPARATUS.has(name)) continue;
    assert.ok(restored.has(name), `.${name} is hidden by a view and never shown again in print`);
  }
});

test('print shows the argument whichever view the screen was left in', () => {
  const restoring = print.filter((rule) => /display:\s*block\s*!important/.test(rule.body));
  const covered = new Set(restoring.flatMap((rule) => classesIn(rule.selector)));

  for (const part of ['landing', 'essay-body', 'source-register', 'chapter', 'scene', 'chapter-opening', 'chapter-closing']) {
    assert.ok(covered.has(part), `.${part} must print whatever the view state is`);
  }
  // A restore written against one named view would leave the other views
  // printing an incomplete essay, so the attribute is matched bare.
  for (const rule of restoring) {
    if (!rule.selector.includes('[data-view')) continue;
    assert.ok(!/\[data-view=/.test(rule.selector), `the print restore "${rule.selector}" only answers one view`);
  }
});

test('an optional panel prints open even if nothing ran before printing', () => {
  // The browser script also opens them on `beforeprint`, but a printed
  // argument must not depend on an event firing.
  const collapsed = print.find((rule) => rule.selector.includes('details:not([open])'));
  assert.ok(collapsed, 'print should reveal a collapsed panel');
  assert.match(collapsed.body, /display:\s*block/);
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
  const covered = new Set(breaking.flatMap((rule) => classesIn(rule.selector)));
  assert.ok(breaking.some((rule) => /\bp\b/.test(rule.selector)), 'ordinary paragraphs need it');
  for (const part of ['source-head', 'source-citation', 'licence-text']) {
    assert.ok(covered.has(part), `.${part} can be one long unbroken run and needs it most`);
  }
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
  for (const target of ['.scene:focus', '.source-register:focus', '.source:focus']) {
    // Not `:focus-visible`, which the browser withholds after a pointer click.
    assert.ok(new RegExp(`\\${target}(?![\\w-])`).test(ringed), `${target} is focused by the script but is never ringed`);
  }

  // And a ring marks where a reader is looking, which paper does not have.
  const reset = print.filter((rule) => /outline:\s*none/.test(rule.body)).map((rule) => rule.selector).join(' ');
  for (const target of ['.scene:focus', '.source-register:focus', '.source:focus']) {
    assert.ok(reset.includes(target), `${target} would print its focus ring`);
  }
});
