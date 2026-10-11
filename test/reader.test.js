/**
 * The browser script, run against the markup the renderer actually produces.
 *
 * `test/support/dom.js` is a small DOM that runs `src/runtime/reader.js`
 * unmodified. It answers what the script does; `test/browser.test.js` answers
 * what a browser does with the stylesheet, and runs the same journeys in
 * Chrome when one is installed.
 *
 * The journeys here are the ones the approved contract names: moving scene by
 * scene with Back and Next, leaving the first scene back to the landing,
 * reaching the end and being offered Read again, revisiting a chapter, moving
 * between scene and continuous reading, switching an optional comparison, and
 * leaving for a source and coming back to the same place in the same mode.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { renderEssay, renderSourcesPage, sourceAnchor } from '../src/runtime/render.js';
import { loadValidContent } from './helpers.js';
import { openDocument } from './support/dom.js';

const content = loadValidContent();
const order = content.chapters.flatMap((chapter) => chapter.sceneIds);

const essay = renderEssay(content, {
  mode: 'hosted',
  stylesheetUrl: 'styles.css',
  scriptUrl: 'reader.js',
  sourcesHref: 'sources.html',
  sourceHref: (number, sceneId) => `sources.html?from=${sceneId}&view=scene#${sourceAnchor(number)}`,
});

const open = (options) => openDocument(essay, options);

/* --- Starting state ------------------------------------------------------ */

test('the page opens on the landing with every scene still in the document', () => {
  const page = open();
  assert.equal(page.view(), 'landing');
  assert.equal(page.currentSceneId(), null);
  assert.equal(page.scenes().length, 45);
});

test('Begin opens the first scene', () => {
  const page = open();
  page.click(page.find('[data-begin]'));
  assert.equal(page.view(), 'beat');
  assert.equal(page.currentSceneId(), 's088');
});

/* --- Moving -------------------------------------------------------------- */

test('Next and Back walk the consecutive scene order', () => {
  const page = open();
  page.click(page.find('[data-begin]'));
  for (let index = 1; index < 6; index += 1) {
    page.click(page.find('[data-next]'));
    assert.equal(page.currentSceneId(), order[index]);
  }
  page.click(page.find('[data-back]'));
  assert.equal(page.currentSceneId(), order[4]);
});

test('Back at the first scene returns to the landing', () => {
  const page = open();
  page.click(page.find('[data-begin]'));
  assert.equal(page.currentSceneId(), 's088');
  page.click(page.find('[data-back]'));
  assert.equal(page.view(), 'landing');
});

test('the last scene drops Next and offers Read again', () => {
  const page = open({ hash: '#s132' });
  assert.equal(page.currentSceneId(), 's132');
  assert.equal(page.find('[data-next]').hidden, true);
  assert.equal(page.find('[data-read-again]').hidden, false);
  // Sources & Credits is in the shared controls at every scene, including
  // this one, and from here it is the only route to the register. It carries
  // the scene, so "Back to reading" has somewhere to come back to.
  assert.equal(
    page.find('.reader-controls [data-sources]').getAttribute('href'),
    'sources.html?from=s132&view=scene',
  );
  // The landing's own copy is never rewritten: nothing has been read yet.
  assert.equal(page.find('.landing-actions [data-sources]').getAttribute('href'), 'sources.html');

  page.click(page.find('[data-read-again]'));
  assert.equal(page.currentSceneId(), 's088');
  assert.equal(page.find('[data-next]').hidden, false);
});

test('every other scene keeps both Back and Next', () => {
  for (const id of ['s089', 's103', 's120', 's131']) {
    const page = open({ hash: `#${id}` });
    assert.equal(page.find('[data-back]').hidden, false, id);
    assert.equal(page.find('[data-next]').hidden, false, id);
    assert.equal(page.find('[data-read-again]').hidden, true, id);
  }
});

test('focus moves to the scene a reader asked for, so the move is announced once', () => {
  const page = open();
  page.click(page.find('[data-begin]'));
  assert.equal(page.focused(), 's088');
  page.click(page.find('[data-next]'));
  assert.equal(page.focused(), 's089');
});

/* --- Keyboard ------------------------------------------------------------ */

test('arrow keys move between scenes, and left at the first one leaves to the landing', () => {
  const page = open({ hash: '#s090' });
  page.press('ArrowRight');
  assert.equal(page.currentSceneId(), 's091');
  page.press('ArrowLeft');
  assert.equal(page.currentSceneId(), 's090');

  const first = open({ hash: '#s088' });
  first.press('ArrowLeft');
  assert.equal(first.view(), 'landing');

  const last = open({ hash: '#s132' });
  last.press('ArrowRight');
  assert.equal(last.currentSceneId(), 's132', 'the end does not wrap');
});

test('arrow keys do not fire while a control has focus', () => {
  const page = open({ hash: '#s090' });
  page.press('ArrowRight', page.find('[data-next]'));
  assert.equal(page.currentSceneId(), 's090');
  page.press('ArrowRight', page.find('.citation'));
  assert.equal(page.currentSceneId(), 's090');
});

/* --- Chapters ------------------------------------------------------------ */

test('a chapter link opens that chapter from its first scene', () => {
  const page = open();
  const anchors = ['s088', 's092', 's097', 's103', 's109', 's114', 's122', 's128'];
  content.chapters.forEach((chapter, index) => {
    page.click(page.find(`[data-chapter-link="${chapter.id}"]`));
    assert.equal(page.currentSceneId(), anchors[index]);
    assert.equal(page.find(`[data-chapter-link="${chapter.id}"]`).getAttribute('aria-current'), 'true');
  });
});

test('revisiting a chapter while reading continuously keeps the continuous view', () => {
  const page = open({ hash: '#s090' });
  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.view(), 'reading');
  page.click(page.find('[data-chapter-link="c5"]'));
  assert.equal(page.view(), 'reading');
  assert.equal(page.focused(), 's109');
});

/* --- Views --------------------------------------------------------------- */

test('the view switch names the view it moves to', () => {
  const page = open({ hash: '#s090' });
  const toggle = page.find('[data-view-toggle]');
  assert.equal(toggle.textContent, 'Read continuously');
  page.click(toggle);
  assert.equal(page.view(), 'reading');
  assert.equal(toggle.textContent, 'Scene view');
  page.click(toggle);
  assert.equal(page.view(), 'beat');
  assert.equal(toggle.textContent, 'Read continuously');
});

test('the continuous view keeps the reader where they were', () => {
  const page = open({ hash: '#s117' });
  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.focused(), 's117');
  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.currentSceneId(), 's117');
});

test('Print asks the browser to print rather than changing the argument', () => {
  const page = open({ hash: '#s117' });
  const before = page.scenes().length;
  assert.equal(page.pressPrint(), 1);
  assert.equal(page.scenes().length, before);
});

/* --- Optional comparisons ------------------------------------------------ */

test('a comparison switches between two drawn states and says which is chosen', () => {
  for (const id of ['s105', 's114']) {
    const page = open({ hash: `#${id}` });
    const figure = page.find(`[data-scene="${id}"] .art-comparison`);
    const buttons = figure.querySelectorAll('[data-art-state]');

    assert.equal(figure.getAttribute('data-active'), '0');
    assert.deepEqual(buttons.map((node) => node.getAttribute('aria-pressed')), ['true', 'false']);

    page.click(buttons[1]);
    assert.equal(figure.getAttribute('data-active'), '1');
    assert.deepEqual(buttons.map((node) => node.getAttribute('aria-pressed')), ['false', 'true']);

    page.click(buttons[0]);
    assert.equal(figure.getAttribute('data-active'), '0');
    assert.deepEqual(buttons.map((node) => node.getAttribute('aria-pressed')), ['true', 'false']);
  }
});

test('switching a comparison never removes a paragraph or disables Next', () => {
  const page = open({ hash: '#s105' });
  const scene = page.find('[data-scene="s105"]');
  const before = scene.querySelectorAll('.narration').length;
  page.click(scene.querySelectorAll('[data-art-state]')[1]);
  assert.equal(scene.querySelectorAll('.narration').length, before);
  assert.equal(page.find('[data-next]').hidden, false);
  assert.equal(page.find('[data-next]').disabled ?? false, false);
  // Both drawings stay in the document; only the stylesheet chooses which is
  // on screen, and print shows both.
  assert.equal(scene.querySelectorAll('img').length, 2);
});

/* --- Leaving for a source and coming back -------------------------------- */

test('a citation link carries the scene and the current reading mode', () => {
  const page = open({ hash: '#s105' });
  const link = page.find('[data-scene="s105"] .citation');
  assert.equal(link.getAttribute('href'), 'sources.html?from=s105&view=scene#source-9');

  page.click(page.find('[data-view-toggle]'));
  assert.equal(link.getAttribute('href'), 'sources.html?from=s105&view=continuous#source-9');

  page.click(page.find('[data-view-toggle]'));
  assert.equal(link.getAttribute('href'), 'sources.html?from=s105&view=scene#source-9');
});

test('the shared Sources control carries the place too, not only a citation', () => {
  const page = open();
  const shared = () => page.find('.reader-controls [data-sources]').getAttribute('href');

  // Nothing has been read yet, so there is nowhere to come back to.
  assert.equal(page.view(), 'landing');
  assert.equal(shared(), 'sources.html');
  assert.equal(page.find('.landing-actions [data-sources]').getAttribute('href'), 'sources.html');

  page.click(page.find('[data-begin]'));
  assert.equal(shared(), 'sources.html?from=s088&view=scene');
  page.click(page.find('[data-next]'));
  assert.equal(shared(), 'sources.html?from=s089&view=scene');

  page.click(page.find('[data-view-toggle]'));
  assert.equal(shared(), 'sources.html?from=s089&view=continuous');
  page.click(page.find('[data-view-toggle]'));
  assert.equal(shared(), 'sources.html?from=s089&view=scene');

  // The last scene is where this matters most: the shared control is the only
  // route to the register from there, and s132 cites nothing.
  const end = open({ hash: '#s132' });
  assert.equal(end.find('[data-scene="s132"] .citation'), null, 's132 carries no citation');
  assert.equal(
    end.find('.reader-controls [data-sources]').getAttribute('href'),
    'sources.html?from=s132&view=scene',
  );
});

test('the reading controls are not offered before the reader has begun', () => {
  const page = open();
  // The approved landing is the title, the drawing, Begin and Sources &
  // Credits. Read continuously and Print would let someone switch view or
  // print the essay without meeting it.
  assert.equal(page.find('[data-view-toggle]').hidden, true);
  assert.equal(page.find('[data-print]').hidden, true);
  assert.equal(page.find('[data-back]').hidden, true);
  assert.equal(page.find('[data-next]').hidden, true);
  assert.equal(page.find('[data-read-again]').hidden, true);
  // Sources & Credits is on the approved landing, so it stays reachable.
  assert.equal(page.find('.reader-controls [data-sources]').hidden, false);

  page.click(page.find('[data-begin]'));
  assert.equal(page.find('[data-view-toggle]').hidden, false);
  assert.equal(page.find('[data-print]').hidden, false);

  // And they go again if the reader leaves the first scene back to the landing.
  page.click(page.find('[data-back]'));
  assert.equal(page.view(), 'landing');
  assert.equal(page.find('[data-view-toggle]').hidden, true);
  assert.equal(page.find('[data-print]').hidden, true);
});

test('the sources page sends the reader back to the scene and mode they left', () => {
  const html = renderSourcesPage(content, {
    mode: 'hosted',
    stylesheetUrl: 'styles.css',
    scriptUrl: 'reader.js',
    essayUrl: 'index.html',
  });

  const fromScene = openDocument(html, { search: '?from=s105&view=scene', hash: '#source-9' });
  assert.equal(fromScene.find('[data-return]').getAttribute('href'), 'index.html#s105');

  const fromContinuous = openDocument(html, { search: '?from=s126&view=continuous', hash: '#source-5' });
  assert.equal(fromContinuous.find('[data-return]').getAttribute('href'), 'index.html?view=continuous#s126');

  // A reader who arrived directly is offered the essay, which is the only
  // honest destination when there is no place to return to.
  const direct = openDocument(html, {});
  assert.equal(direct.find('[data-return]').getAttribute('href'), 'index.html');

  // The shared control carries the same two parameters a citation does, and
  // with no fragment, because it names no entry. The last scene cites nothing,
  // so this is the only way the register is reached from there.
  const shared = openDocument(html, { search: '?from=s132&view=scene' });
  assert.equal(shared.find('[data-return]').getAttribute('href'), 'index.html#s132');

  const sharedContinuous = openDocument(html, { search: '?from=s132&view=continuous' });
  assert.equal(sharedContinuous.find('[data-return]').getAttribute('href'), 'index.html?view=continuous#s132');
});

/*
 * Returning is three separate promises: the scene, the reading mode, and
 * being put back at that scene on the page. None of them is focus. A reader
 * arriving on a fresh document has not asked for anything yet, so the script
 * scrolls and leaves focus where the browser put it, which is why each
 * promise is checked on its own below.
 */
test('returning restores the scene, and returning from continuous restores that too', () => {
  const back = open({ hash: '#s105' });
  assert.equal(back.view(), 'beat');
  assert.equal(back.currentSceneId(), 's105');
  assert.equal(back.scrolledInto(), 's105', 'the reader is put back at the scene they left');
  assert.equal(back.focused(), 'body', 'and arriving does not take their focus');

  const continuous = openDocument(essay, { hash: '#s105', search: '?view=continuous' });
  assert.equal(continuous.view(), 'reading');
  assert.equal(continuous.scrolledInto(), 's105');
  assert.equal(continuous.focused(), 'body');
  // Nothing is "current" while the whole essay is on the page, so the place
  // the reader came back to is read from the view they switch to next.
  assert.equal(continuous.currentSceneId(), null);
  continuous.click(continuous.find('[data-view-toggle]'));
  assert.equal(continuous.view(), 'beat');
  assert.equal(continuous.currentSceneId(), 's105');
});

test('the first, middle and final citing scenes all return correctly', () => {
  const html = renderSourcesPage(content, {
    mode: 'hosted', stylesheetUrl: 's.css', scriptUrl: 'r.js', essayUrl: 'index.html',
  });
  for (const [id, number] of [['s092', 1], ['s109', 13], ['s126', 5]]) {
    const page = openDocument(html, { search: `?from=${id}&view=scene`, hash: `#${sourceAnchor(number)}` });
    assert.equal(page.find('[data-return]').getAttribute('href'), `index.html#${id}`);
    // The reader lands on the entry they followed, not the top of the list.
    assert.equal(page.focused(), sourceAnchor(number));

    const essayPage = openDocument(essay, { hash: `#${id}` });
    assert.equal(essayPage.currentSceneId(), id);
  }
});

/* --- The address bar ----------------------------------------------------- */

test('a deep link opens that scene without stealing focus', () => {
  const page = open({ hash: '#s120' });
  assert.equal(page.currentSceneId(), 's120');
  assert.equal(page.scrolledInto(), 's120', 'the scene is brought into view');
  assert.equal(page.focused(), 'body', 'nothing was focused, so nothing was taken');
});

test('a chapter fragment opens that chapter', () => {
  const page = open({ hash: '#c6' });
  assert.equal(page.currentSceneId(), 's114');
});

test('Back in the browser returns to the previous scene', () => {
  const page = open();
  page.click(page.find('[data-begin]'));
  page.click(page.find('[data-next]'));
  assert.equal(page.currentSceneId(), 's089');
  page.goBack();
  assert.equal(page.currentSceneId(), 's088');
});

test('an unrecognised fragment does not move a reader who is already reading', () => {
  const page = open({ hash: '#s120' });
  page.navigateTo('#chapters');
  assert.equal(page.currentSceneId(), 's120');
  assert.equal(page.view(), 'beat');
});

test('the script works where pushState is refused', () => {
  const page = openDocument(essay, { history: 'throws' });
  page.click(page.find('[data-begin]'));
  page.click(page.find('[data-next]'));
  assert.equal(page.currentSceneId(), 's089');
  assert.ok(page.historyRefusals > 0);
});

test('a document with no scenes does not throw', () => {
  assert.doesNotThrow(() => openDocument('<!doctype html><html><body><p>Nothing</p></body></html>'));
});
