/**
 * The markup the renderer produces.
 *
 * `test/transfer.test.js` proves the words are the approved ones. This file
 * proves the shape around them: that the landing carries only what the
 * approved script lists, that every scene is written into the document whether
 * or not it is on screen, that a drawing sits where the production note puts
 * it, that names and view labels are browser text over a frameless image, and
 * that a reader following a citation can get back to where they were.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { renderEssay, renderSourcesPage, sourceAnchor, esc } from '../src/runtime/render.js';
import { loadValidContent } from './helpers.js';
import { parseHtml } from './support/dom.js';

const content = loadValidContent();

const hostedOptions = {
  mode: 'hosted',
  stylesheetUrl: 'styles.css',
  scriptUrl: 'reader.js',
  sourcesHref: 'sources.html',
  sourceHref: (number, sceneId) => `sources.html?from=${sceneId}&view=scene#${sourceAnchor(number)}`,
};

const essay = renderEssay(content, hostedOptions);
const document = parseHtml(essay);
const sourcesPage = parseHtml(renderSourcesPage(content, { ...hostedOptions, essayUrl: 'index.html' }));

/* --- The landing --------------------------------------------------------- */

test('the landing carries the title, the opening drawing, Begin and Sources & Credits', () => {
  const landing = document.querySelector('.landing');
  assert.equal(landing.querySelector('h1').textContent, 'What it takes to be happy');

  const image = landing.querySelector('img');
  assert.equal(image.getAttribute('src'), 'assets/generated/rewrite-opening-v1/opening.png');
  assert.deepEqual(
    landing.querySelectorAll('.art-label').map((label) => label.textContent),
    ['TJ', 'Koj', 'Vier'],
  );

  const actions = landing.querySelectorAll('.landing-actions a');
  assert.deepEqual(actions.map((link) => link.textContent), ['Begin', 'Sources & Credits']);
  assert.equal(actions[0].getAttribute('href'), '#s088');
  assert.equal(actions[1].getAttribute('href'), 'sources.html');
});

test('the landing shows nothing the approved script does not list', () => {
  const landing = document.querySelector('.landing');
  const paragraphs = landing.querySelectorAll('p').map((node) => node.textContent.trim());
  // One paragraph: the two actions. No subtitle, no byline, no summary, no
  // reading-time promise, no progress score.
  assert.deepEqual(paragraphs, ['Begin\nSources & Credits']);
  for (const phrase of ['minute', 'minutes to read', 'by TJ', 'Written by', 'words']) {
    assert.ok(!landing.textContent.includes(phrase), `the landing still says "${phrase}"`);
  }
});

test('no progress counter or reading-time estimate appears anywhere', () => {
  for (const phrase of ['Beat ', ' of 45', 'minutes to read', 'About ']) {
    assert.ok(!essay.includes(phrase), `the essay still shows "${phrase}"`);
  }
});

/* --- Scenes -------------------------------------------------------------- */

test('all 45 scenes are in the document, in reading order', () => {
  const scenes = document.querySelectorAll('[data-scene]');
  assert.equal(scenes.length, 45);
  assert.deepEqual(
    scenes.map((node) => node.getAttribute('data-scene')),
    content.chapters.flatMap((chapter) => chapter.sceneIds),
  );
  // Every scene is focusable so a move can land on it and announce its title.
  for (const node of scenes) {
    assert.equal(node.getAttribute('tabindex'), '-1');
    assert.equal(node.getAttribute('aria-labelledby'), `${node.getAttribute('data-scene')}-title`);
  }
});

test('the eight chapter titles are the menu and the headings', () => {
  const menu = document.querySelectorAll('.chapter-menu a');
  assert.deepEqual(menu.map((link) => link.textContent), content.chapters.map((chapter) => chapter.title));
  assert.deepEqual(
    document.querySelectorAll('.chapter-title').map((node) => node.textContent),
    content.chapters.map((chapter) => chapter.title),
  );
});

test('a drawing sits where the production note puts it', () => {
  const blocksBefore = (sceneId) => {
    const scene = document.querySelector(`[data-scene="${sceneId}"]`);
    const children = scene.childNodes.filter((node) => node.nodeType === 1);
    const art = children.findIndex((node) => node.localName === 'figure');
    // The title is the first child, so subtract it to count authored blocks.
    return art < 0 ? null : art - 1;
  };

  // A group scene opens with the first narrator block above the art.
  assert.equal(blocksBefore('s088'), 1);
  // A single scene whose first authored block is dialogue keeps that order.
  assert.equal(blocksBefore('s093'), 1);
  assert.equal(blocksBefore('s094'), 1);
  // A text scene has no drawing at all, and no substitute.
  assert.equal(blocksBefore('s090'), null);
  assert.equal(document.querySelector('[data-scene="s090"]').querySelectorAll('img').length, 0);
});

test('every scene with a drawing matches its content entry', () => {
  for (const scene of content.scenes) {
    const node = document.querySelector(`[data-scene="${scene.id}"]`);
    const images = node.querySelectorAll('img');
    assert.equal(images.length, scene.visual.views.length, scene.id);
    scene.visual.views.forEach((view, index) => {
      const asset = content.assets.find((entry) => entry.ref === view.ref);
      const image = asset.images[view.image];
      assert.equal(images[index].getAttribute('src'), image.path);
      assert.equal(images[index].getAttribute('alt'), image.alt);
      assert.equal(images[index].getAttribute('width'), String(image.width));
      assert.equal(images[index].getAttribute('height'), String(image.height));
    });
  }
});

/* --- Artwork presentation ------------------------------------------------ */

test('the artwork is frameless: no stage, no border element, no caption', () => {
  assert.equal(document.querySelectorAll('.scene-visual-frame').length, 0);
  assert.equal(document.querySelectorAll('figcaption').length, 0);
  // Nothing in the markup draws a box around a drawing or fixes its height.
  assert.ok(!essay.includes('scene-visual'));
  assert.ok(!essay.includes('art-stage'));
  // The image declares its own proportions and nothing overrides them.
  for (const image of document.querySelectorAll('img')) {
    assert.equal(image.getAttribute('style'), null, 'a drawing was given an inline size');
  }
});

test('names and prop labels are browser text positioned over the image', () => {
  const expectations = new Map(content.assets.map((asset) => [asset.ref, asset.labels]));
  for (const view of document.querySelectorAll('.art-view')) {
    const labels = view.querySelectorAll('.art-label');
    const expected = expectations.get(view.getAttribute('data-ref'));
    assert.deepEqual(labels.map((node) => node.textContent), expected.map((label) => label.text));
    labels.forEach((node, index) => {
      const style = node.getAttribute('style');
      assert.match(style, /--x:/);
      assert.match(style, /--y-desktop:/);
      assert.match(style, /--y-phone:/);
      assert.equal(node.getAttribute('data-kind'), expected[index].kind);
    });
  }

  // Both A08's four prop labels and A10's dialogue label are real text.
  assert.ok(essay.includes('>Grades</span>'));
  assert.ok(essay.includes('>Cheer up!</span>'));
});

test('only the first drawing loads eagerly', () => {
  const images = document.querySelectorAll('img');
  assert.equal(images[0].getAttribute('loading'), null);
  for (const image of images.slice(1)) {
    assert.equal(image.getAttribute('loading'), 'lazy', image.getAttribute('src'));
  }
  for (const image of images) assert.equal(image.getAttribute('decoding'), 'async');
});

test('a pair writes both drawings with their exact labels in authored order', () => {
  for (const scene of content.scenes.filter((entry) => entry.visual.layout === 'pair')) {
    const figure = document.querySelector(`[data-scene="${scene.id}"] figure.art`);
    assert.equal(figure.getAttribute('data-layout'), 'pair');
    assert.equal(figure.getAttribute('data-active'), null, 'a pair is not an optional comparison');
    assert.deepEqual(
      figure.querySelectorAll('.art-view-label').map((node) => node.textContent),
      scene.visual.views.map((view) => view.label),
    );
  }
});

test('an optional comparison offers native buttons with the approved labels', () => {
  for (const scene of content.scenes.filter((entry) => entry.visual.control !== null)) {
    const figure = document.querySelector(`[data-scene="${scene.id}"] figure.art`);
    assert.ok(figure.getAttribute('class').includes('art-comparison'));
    assert.equal(figure.getAttribute('data-active'), '0');

    const buttons = figure.querySelectorAll('button');
    assert.equal(buttons.length, 2);
    assert.deepEqual(buttons.map((node) => node.textContent), scene.visual.control.labels);
    for (const button of buttons) {
      // A real button, so Enter and Space already work and a screen reader
      // already calls it a button.
      assert.equal(button.localName, 'button');
      assert.equal(button.getAttribute('type'), 'button');
      assert.ok(['true', 'false'].includes(button.getAttribute('aria-pressed')));
    }
    assert.deepEqual(buttons.map((node) => node.getAttribute('aria-pressed')), ['true', 'false']);

    // Both drawings are in the markup, so print and the continuous view carry
    // both without a control.
    assert.equal(figure.querySelectorAll('img').length, 2);
    // The control is script-only; with no script both drawings and both
    // labels are simply there.
    assert.ok(figure.querySelector('.art-control').getAttribute('class').includes('js-only'));
  }
});

test('every paragraph of a comparison scene sits outside the figure', () => {
  for (const id of ['s105', 's114']) {
    const scene = content.scenes.find((entry) => entry.id === id);
    const node = document.querySelector(`[data-scene="${id}"]`);
    const figure = node.querySelector('figure.art');
    const inFigure = figure.textContent;
    for (const block of scene.blocks) {
      const text = block.parts.filter((part) => part.text !== undefined).map((part) => part.text).join('');
      assert.ok(!inFigure.includes(text.slice(0, 40)), `${id} hides a paragraph inside the control`);
    }
  }
});

/* --- Controls ------------------------------------------------------------ */

test('the shared controls use the approved names and are script-only', () => {
  const controls = document.querySelector('.reader-controls');
  assert.ok(controls.getAttribute('class').includes('js-only'));
  assert.equal(controls.querySelector('[data-back]').textContent, 'Back');
  assert.equal(controls.querySelector('[data-next]').textContent, 'Next');
  assert.equal(controls.querySelector('[data-read-again]').textContent, 'Read again');
  assert.equal(controls.querySelector('[data-print]').textContent, 'Print');
  assert.equal(controls.querySelector('[data-sources]').textContent, 'Sources & Credits');

  const toggle = controls.querySelector('[data-view-toggle]');
  assert.equal(toggle.textContent, 'Read continuously');
  assert.equal(toggle.getAttribute('data-scene-label'), 'Scene view');

  // Read again is offered only at the end; the script reveals it there.
  assert.notEqual(controls.querySelector('[data-read-again]').getAttribute('hidden'), null);
});

test('the skip link uses the approved wording', () => {
  const skip = document.querySelector('.skip-link');
  assert.equal(skip.textContent, 'Skip to scene');
  assert.equal(skip.getAttribute('href'), '#essay');
});

/* --- Citations and the separate page ------------------------------------- */

test('a citation carries where the reader was and which entry they want', () => {
  const link = document.querySelector('[data-scene="s105"] .citation');
  assert.equal(link.getAttribute('href'), 'sources.html?from=s105&view=scene#source-9');
  assert.equal(link.getAttribute('aria-label'), 'Source 9');
  assert.equal(link.textContent, '[9]');

  // Every citation names its own scene, so the return is never a guess.
  for (const scene of document.querySelectorAll('[data-scene]')) {
    const id = scene.getAttribute('data-scene');
    for (const citation of scene.querySelectorAll('.citation')) {
      assert.equal(citation.getAttribute('data-from'), id);
      assert.match(citation.getAttribute('href'), new RegExp(`^sources\\.html\\?from=${id}&view=scene#source-\\d+$`));
    }
  }
});

test('the first, a middle and the final citing scene all link out and back', () => {
  const citing = content.scenes.filter((scene) =>
    scene.blocks.some((block) => block.parts.some((part) => part.citation !== undefined)));
  const sample = [citing[0], citing[Math.floor(citing.length / 2)], citing.at(-1)];
  assert.deepEqual(sample.map((scene) => scene.id), ['s092', 's109', 's126']);

  for (const scene of sample) {
    const links = document.querySelectorAll(`[data-scene="${scene.id}"] .citation`);
    assert.ok(links.length > 0);
    for (const link of links) {
      const number = Number(link.getAttribute('data-citation'));
      assert.ok(sourcesPage.querySelector(`#${sourceAnchor(number)}`), `entry ${number} is missing from the page`);
    }
  }
});

test('the Sources & Credits page is a separate document with a return control', () => {
  assert.equal(sourcesPage.documentElement.getAttribute('data-page'), 'sources');
  assert.equal(sourcesPage.querySelector('h1').textContent, 'Sources & Credits');

  const entries = sourcesPage.querySelectorAll('.source');
  assert.equal(entries.length, 26);
  entries.forEach((entry, index) => {
    assert.equal(entry.getAttribute('id'), sourceAnchor(index + 1));
    assert.equal(entry.querySelector('.source-number').textContent, `[${index + 1}]`);
    // Each entry says what was actually opened.
    assert.ok(entry.querySelector('.source-note').textContent.includes('Read:'));
  });

  const back = sourcesPage.querySelector('[data-return]');
  assert.equal(back.textContent, 'Back to reading');
  // Written for a reader with no script; the script rewrites it to the scene
  // and mode the citation carried.
  assert.equal(back.getAttribute('href'), 'index.html');
});

test('the essay does not repeat the register beside every claim', () => {
  assert.equal(document.querySelectorAll('.source').length, 0);
  assert.equal(document.querySelectorAll('.source-note').length, 0);
  for (const citation of ['Read: full article', 'Read: abstract only']) {
    assert.ok(!essay.includes(citation), 'an access note leaked into the scenes');
  }
});

/* --- The single-file export ---------------------------------------------- */

test('the retained export carries the register inside itself', () => {
  const inline = parseHtml(renderEssay(content, {
    mode: 'offline',
    inlineStyles: 'body{}',
    inlineScript: '',
    inlineSources: true,
    assetUrl: () => 'data:image/png;base64,AA==',
    sourcesHref: '#sources',
    sourceHref: (number) => `#${sourceAnchor(number)}`,
  }));
  assert.ok(inline.querySelector('#sources'));
  assert.equal(inline.querySelectorAll('.source').length, 26);
  assert.equal(inline.querySelector('.citation').getAttribute('href'), '#source-1');
});

test('escaping covers attribute and element content alike', () => {
  assert.equal(esc(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  // The ampersand in the approved control name survives into the markup.
  assert.ok(essay.includes('Sources &amp; Credits'));
});
