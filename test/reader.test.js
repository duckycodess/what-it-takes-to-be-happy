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

/* Whether one exact element holds focus. Compared as a boolean rather than
   with `assert.equal`, because formatting a document element into a failure
   diff is how a test run dies of heap exhaustion instead of reporting. */
const focused = (page, selector) => page.document.activeElement === page.find(selector);

/* --- Starting state ------------------------------------------------------ */

test('the page opens on the landing with every scene still in the document', () => {
  const page = open();
  assert.equal(page.view(), 'landing');
  assert.equal(page.currentSceneId(), null);
  assert.equal(page.scenes().length, 31);
});

test('Begin opens the first scene', () => {
  const page = open();
  page.click(page.find('[data-begin]'));
  assert.equal(page.view(), 'beat');
  assert.equal(page.currentSceneId(), 's201');
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
  assert.equal(page.currentSceneId(), 's201');
  page.click(page.find('[data-back]'));
  assert.equal(page.view(), 'landing');
});

test('the last scene drops Next and offers Read again', () => {
  const page = open({ hash: '#s231' });
  assert.equal(page.currentSceneId(), 's231');
  assert.equal(page.find('[data-next]').hidden, true);
  assert.equal(page.find('[data-read-again]').hidden, false);
  // Sources & Credits is in the rail's secondary section at every scene,
  // including this one, and from here it is the only route to the register.
  // It carries the scene, so "Back to reading" has somewhere to come back to.
  assert.equal(
    page.find('.rail-secondary [data-sources]').getAttribute('href'),
    'sources.html?from=s231&view=scene',
  );
  // The landing's own copy is never rewritten: nothing has been read yet.
  assert.equal(page.find('.landing-actions [data-sources]').getAttribute('href'), 'sources.html');

  page.click(page.find('[data-read-again]'));
  assert.equal(page.currentSceneId(), 's201');
  assert.equal(page.find('[data-next]').hidden, false);
});

test('every other scene keeps both Back and Next', () => {
  for (const id of ['s202', 's211', 's220', 's230']) {
    const page = open({ hash: `#${id}` });
    assert.equal(page.find('[data-back]').hidden, false, id);
    assert.equal(page.find('[data-next]').hidden, false, id);
    assert.equal(page.find('[data-read-again]').hidden, true, id);
  }
});

test('focus moves to the scene a reader asked for, so the move is announced once', () => {
  const page = open();
  page.click(page.find('[data-begin]'));
  assert.equal(page.focused(), 's201');
  page.click(page.find('[data-next]'));
  assert.equal(page.focused(), 's202');
});

/* --- How the move was made ----------------------------------------------
   The one thing the scene's focus ring depends on. The stylesheet asks for
   this and for `:focus-visible` together, because a browser treats the
   fragment target it focuses on arrival as focus-visible too, and a deep link
   or the way back from Sources & Credits would otherwise draw the red box
   around the whole scene that the amendment removed. */

test('arriving at an address is not recorded as a keyboard move', () => {
  const moved = (page) => page.find('html').getAttribute('data-move');

  // A deep link, which is also what returning from Sources & Credits is.
  assert.equal(moved(open({ hash: '#s213' })), 'address');
  assert.equal(moved(openDocument(essay, { hash: '#s213', search: '?view=continuous' })), 'address');
  assert.equal(moved(open()), 'address', 'and so is opening the landing');

  // The browser's Back button is an address too, not a keypress.
  const page = open();
  page.click(page.find('[data-begin]'));
  page.click(page.find('[data-next]'));
  page.goBack();
  assert.equal(moved(page), 'address');
});

test('a pointer move and a keyboard move are told apart', () => {
  const moved = (page) => page.find('html').getAttribute('data-move');

  // A real click reports a `detail` of at least one; Enter and Space on a
  // control report zero, which is how a browser says the keyboard did it.
  const pointer = open({ hash: '#s203' });
  pointer.find('[data-next]').dispatchEvent({ type: 'click', detail: 1 });
  assert.equal(moved(pointer), 'pointer');
  assert.equal(pointer.currentSceneId(), 's204');

  const keyboard = open({ hash: '#s203' });
  keyboard.find('[data-next]').dispatchEvent({ type: 'click', detail: 0 });
  assert.equal(moved(keyboard), 'keyboard');
  assert.equal(keyboard.currentSceneId(), 's204');

  // Arrow keys are a keyboard move by definition.
  const arrows = open({ hash: '#s203' });
  arrows.press('ArrowRight');
  assert.equal(moved(arrows), 'keyboard');

  // And a part chosen with a pointer is a pointer move, wherever it is.
  const rail = open({ hash: '#s203' });
  rail.find('[data-part-link="s220"]').dispatchEvent({ type: 'click', detail: 1 });
  assert.equal(moved(rail), 'pointer');
  assert.equal(rail.currentSceneId(), 's220');
});

/* --- Keyboard ------------------------------------------------------------ */

test('arrow keys move between scenes, and left at the first one leaves to the landing', () => {
  const page = open({ hash: '#s203' });
  page.press('ArrowRight');
  assert.equal(page.currentSceneId(), 's204');
  page.press('ArrowLeft');
  assert.equal(page.currentSceneId(), 's203');

  const first = open({ hash: '#s201' });
  first.press('ArrowLeft');
  assert.equal(first.view(), 'landing');

  const last = open({ hash: '#s231' });
  last.press('ArrowRight');
  assert.equal(last.currentSceneId(), 's231', 'the end does not wrap');
});

test('arrow keys do not fire while a control has focus', () => {
  const page = open({ hash: '#s203' });
  page.press('ArrowRight', page.find('[data-next]'));
  assert.equal(page.currentSceneId(), 's203');
  page.press('ArrowRight', page.find('.citation'));
  assert.equal(page.currentSceneId(), 's203');
});

/* --- Chapters ------------------------------------------------------------ */

test('a chapter link opens that chapter from its first scene', () => {
  const page = open();
  const anchors = ['s201', 's204', 's208', 's211', 's215', 's219', 's225', 's229'];
  content.chapters.forEach((chapter, index) => {
    page.click(page.find(`[data-chapter-link="${chapter.id}"]`));
    assert.equal(page.currentSceneId(), anchors[index]);
    assert.equal(page.find(`[data-chapter-link="${chapter.id}"]`).getAttribute('aria-current'), 'true');
  });
});

test('revisiting a chapter while reading continuously keeps the continuous view', () => {
  const page = open({ hash: '#s203' });
  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.view(), 'reading');
  page.click(page.find('[data-chapter-link="c5"]'));
  assert.equal(page.view(), 'reading');
  assert.equal(page.focused(), 's215');
});

/* --- The chapter rail ----------------------------------------------------
   Two arrangements of one list. On a wide window it stands beside the essay
   and can be collapsed; below 60rem it is a drawer. The script keeps one
   piece of state and asks the stylesheet, through a media query, which
   arrangement it is in -- so these tests say which window they are in rather
   than measuring one, and `test/browser.test.js` checks what each actually
   looks like. */

test('the rail opens beside the essay on a wide window and is a drawer on a phone', () => {
  assert.equal(open().rail(), 'open', 'a wide window starts with the rail beside the essay');
  assert.equal(open({ narrow: true }).rail(), 'closed', 'a phone starts with the drawer shut');

  // Width and motion preferences each use the stylesheet's own query.
  assert.deepEqual(open().mediaQueries, ['(prefers-reduced-motion: reduce)', '(max-width: 59.99rem)']);
});

test('only the chapter being read is expanded, and the rest can be opened one at a time', () => {
  const page = open({ hash: '#s201' });
  assert.deepEqual(page.expandedChapters(), ['c1']);
  assert.deepEqual(page.visibleParts(), content.chapters[0].sceneIds);

  // Reading on into another chapter follows the reader.
  page.click(page.find('[data-part-link="s219"]'));
  assert.equal(page.currentSceneId(), 's219');
  assert.deepEqual(page.expandedChapters(), ['c6']);

  // Opening another chapter does not close the one being read.
  page.click(page.find('[data-chapter-toggle="c2"]'));
  assert.deepEqual(page.expandedChapters(), ['c2', 'c6']);
  assert.equal(page.find('[data-chapter-toggle="c2"]').getAttribute('aria-expanded'), 'true');

  // And a chapter the reader opened themselves stays open as they read on.
  page.click(page.find('[data-next]'));
  assert.deepEqual(page.expandedChapters(), ['c2', 'c6']);

  // Closing it again is equally their choice, including the current chapter.
  page.click(page.find('[data-chapter-toggle="c2"]'));
  page.click(page.find('[data-chapter-toggle="c6"]'));
  assert.deepEqual(page.expandedChapters(), []);
  assert.deepEqual(page.visibleParts(), [], 'a collapsed chapter cannot be tabbed into');
});

test('the rail marks the part being read, and nothing else announces the move', () => {
  const page = open({ hash: '#s208' });
  assert.equal(page.currentPart(), 's208');
  // The chapter the part belongs to is marked too, read from the document
  // rather than named here, so the two cannot drift apart.
  const chapter = content.scenes.find((scene) => scene.id === 's208').chapterId;
  assert.equal(page.find(`[data-chapter-link="${chapter}"]`).getAttribute('aria-current'), 'true');

  page.click(page.find('[data-next]'));
  assert.equal(page.currentPart(), 's209');
  assert.equal(page.find('[data-part-link="s208"]').getAttribute('aria-current'), null);

  // One mark, never two.
  assert.equal(page.find('[data-part-link][aria-current]').getAttribute('data-part-link'), 's209');
  assert.equal(page.scenes().filter((scene) => scene.hasAttribute('data-current')).length, 1);

  // Nothing on the page is a live region: the move is announced by the focus
  // that goes with it, once.
  assert.equal(page.find('[aria-live]'), null);
  assert.equal(page.find('[role="status"]'), null);
});

test('a part opens its own scene, and keeps the reading mode it was chosen from', () => {
  const page = open({ hash: '#s201' });
  page.click(page.find('[data-part-link="s220"]'));
  assert.equal(page.view(), 'beat');
  assert.equal(page.currentSceneId(), 's220');
  assert.equal(page.focused(), 's220');
  assert.equal(page.address(), '#s220');

  // In continuous reading a part is a place on the page, not a reason to
  // leave the mode.
  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.view(), 'reading');
  page.click(page.find('[data-part-link="s215"]'));
  assert.equal(page.view(), 'reading');
  assert.equal(page.scrolledInto(), 's215');
  assert.equal(page.focused(), 's215');
});

test('collapsing the rail keeps the reader on the scene, and the way back is focused', () => {
  const page = open({ hash: '#s217' });
  assert.equal(page.rail(), 'open');
  assert.equal(page.find('[data-rail-toggle]').getAttribute('aria-expanded'), 'true');

  page.click(page.find('[data-rail-toggle]'));
  assert.equal(page.rail(), 'closed');
  assert.equal(page.find('[data-rail-toggle]').getAttribute('aria-expanded'), 'false');
  assert.equal(page.find('[data-rail-restore]').getAttribute('aria-expanded'), 'false');
  // The control that just disappeared had focus; the one that replaced it has
  // it now, rather than focus falling back to the body.
  assert.ok(focused(page, '[data-rail-restore]'), 'focus fell back to the body');
  // The reading column reflows, so the scene is brought back under the eye.
  assert.equal(page.scrolledInto(), 's217');
  assert.equal(page.currentSceneId(), 's217', 'and the reader has not been moved off it');

  page.click(page.find('[data-rail-restore]'));
  assert.equal(page.rail(), 'open');
  assert.equal(page.find('[data-rail-toggle]').getAttribute('aria-expanded'), 'true');
  assert.equal(page.currentSceneId(), 's217');
});

/* --- The phone drawer ---------------------------------------------------- */

test('the drawer opens into itself and gives focus back to the trigger', () => {
  const page = open({ hash: '#s211', narrow: true });
  assert.equal(page.rail(), 'closed');

  page.click(page.find('[data-rail-restore]'));
  assert.equal(page.rail(), 'open');
  // Focus moves inside, onto the control that closes it again.
  assert.ok(focused(page, '[data-rail-toggle]'), 'opening the drawer left focus outside it');

  page.click(page.find('[data-rail-toggle]'));
  assert.equal(page.rail(), 'closed');
  assert.ok(focused(page, '[data-rail-restore]'), 'closing the drawer did not return focus to the trigger');
  assert.equal(page.currentSceneId(), 's211', 'and dismissing it is not a move through the essay');
});

test('Escape dismisses the drawer, and leaves a rail beside the essay alone', () => {
  const page = open({ hash: '#s211', narrow: true });
  page.click(page.find('[data-rail-restore]'));
  assert.equal(page.rail(), 'open');

  page.press('Escape');
  assert.equal(page.rail(), 'closed');
  assert.ok(focused(page, '[data-rail-restore]'), 'Escape did not return focus to the trigger');

  // On a wide window the rail covers nothing, so Escape has no business
  // collapsing it out from under a reader.
  const wide = open({ hash: '#s211' });
  assert.equal(wide.rail(), 'open');
  wide.press('Escape');
  assert.equal(wide.rail(), 'open');
});

test('choosing a part closes the drawer before the destination takes focus', () => {
  const page = open({ hash: '#s201', narrow: true });
  page.click(page.find('[data-rail-restore]'));
  assert.equal(page.rail(), 'open');

  page.click(page.find('[data-part-link="s227"]'));
  assert.equal(page.rail(), 'closed', 'the drawer was left over the scene it navigated to');
  assert.equal(page.currentSceneId(), 's227');
  assert.equal(page.focused(), 's227', 'and focus is on the destination, not on the trigger');

  // A chapter title does the same.
  page.click(page.find('[data-rail-restore]'));
  page.click(page.find('[data-chapter-link="c3"]'));
  assert.equal(page.rail(), 'closed');
  assert.equal(page.currentSceneId(), 's208');
  assert.equal(page.focused(), 's208');
});

test('an open drawer makes what it covers inert, and gives it back on every exit', () => {
  const covered = (page) => ['#landing', '.essay-body', '.reader-controls']
    .filter((selector) => page.find(selector).hasAttribute('inert'));
  const all = ['#landing', '.essay-body', '.reader-controls'];

  const page = open({ hash: '#s211', narrow: true });
  assert.deepEqual(covered(page), [], 'nothing is inert while the drawer is shut');

  page.click(page.find('[data-rail-restore]'));
  assert.deepEqual(covered(page), all, 'the reading column is still tabbable behind the drawer');

  // Every way out gives it back: Escape, the close control, and a part.
  page.press('Escape');
  assert.deepEqual(covered(page), []);

  page.click(page.find('[data-rail-restore]'));
  page.click(page.find('[data-rail-toggle]'));
  assert.deepEqual(covered(page), []);

  page.click(page.find('[data-rail-restore]'));
  page.click(page.find('[data-part-link="s227"]'));
  assert.deepEqual(covered(page), [], 'the destination was left inert after the drawer closed');
  assert.ok(focused(page, '[data-scene="s227"]'));

  // And a window that grows past the drawer width, where the same element
  // stops covering anything without ever being closed.
  page.click(page.find('[data-rail-restore]'));
  assert.deepEqual(covered(page), all);
  page.resizeTo(false);
  assert.equal(page.rail(), 'open', 'the rail is still open, as a rail');
  assert.deepEqual(covered(page), [], 'a rail beside the essay covers nothing');

  // Beside the essay it never makes anything inert in the first place.
  const wide = open({ hash: '#s211' });
  assert.deepEqual(covered(wide), []);
});

test('reaching the landing with the drawer open does not leave the landing inert', () => {
  // The browser's Back button can do it: the drawer is dismissed by choosing
  // a part, not by going back, so the state has to be answered by the view
  // as well as by the controls.
  const page = open({ narrow: true });
  page.click(page.find('[data-begin]'));
  page.click(page.find('[data-rail-restore]'));
  assert.equal(page.rail(), 'open');
  assert.equal(page.find('#landing').hasAttribute('inert'), true);

  page.goBack();
  assert.equal(page.view(), 'landing');
  assert.equal(page.find('#landing').hasAttribute('inert'), false, 'the landing cannot be reached');
  assert.equal(page.find('[data-begin]').hasAttribute('inert'), false);
});

test('a window that crosses the drawer width gets that arrangement default', () => {
  // A rotated phone or a dragged window edge. Carrying the old answer across
  // would leave a drawer standing open over the prose, or a wide window with
  // no rail at all.
  const page = open({ hash: '#s211', narrow: true });
  assert.equal(page.rail(), 'closed');

  page.resizeTo(false);
  assert.equal(page.rail(), 'open', 'a window wide enough for a rail is given one');

  page.resizeTo(true);
  assert.equal(page.rail(), 'closed', 'and a phone is not left with a drawer standing open');
  assert.equal(page.currentSceneId(), 's211', 'neither move takes the reader anywhere');
});

/* --- Views --------------------------------------------------------------- */

test('the view switch names the view it moves to', () => {
  const page = open({ hash: '#s203' });
  const toggle = page.find('[data-view-toggle]');
  assert.equal(toggle.textContent, content.interface.continuous);
  page.click(toggle);
  assert.equal(page.view(), 'reading');
  assert.equal(toggle.textContent, content.interface.partView);
  page.click(toggle);
  assert.equal(page.view(), 'beat');
  assert.equal(toggle.textContent, content.interface.continuous);
});

test('the continuous view keeps the reader where they were', () => {
  const page = open({ hash: '#s217' });
  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.focused(), 's217');
  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.currentSceneId(), 's217');
});

test('there is no print control left for the script to wire up', () => {
  // The 11 October amendment removed it. A browser's own print command still
  // produces the complete essay, which is what the print rules in the
  // stylesheet are for and what `test/browser.test.js` prints to check.
  const page = open({ hash: '#s217' });
  assert.equal(page.find('[data-print]'), null);
  assert.equal(page.scenes().length, 31, 'and nothing about the argument changed with it');
});

/* --- Optional comparisons ------------------------------------------------ */

test('a comparison switches between two drawn states and says which is chosen', () => {
  for (const id of ['s213', 's219']) {
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
  const page = open({ hash: '#s213' });
  const scene = page.find('[data-scene="s213"]');
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
  const page = open({ hash: '#s213' });
  const link = page.find('[data-scene="s213"] .citation');
  assert.equal(link.getAttribute('href'), 'sources.html?from=s213&view=scene#source-9');

  page.click(page.find('[data-view-toggle]'));
  assert.equal(link.getAttribute('href'), 'sources.html?from=s213&view=continuous#source-9');

  page.click(page.find('[data-view-toggle]'));
  assert.equal(link.getAttribute('href'), 'sources.html?from=s213&view=scene#source-9');
});

test('the shared Sources control carries the place too, not only a citation', () => {
  const page = open();
  const shared = () => page.find('.rail-secondary [data-sources]').getAttribute('href');

  // Nothing has been read yet, so there is nowhere to come back to.
  assert.equal(page.view(), 'landing');
  assert.equal(shared(), 'sources.html');
  assert.equal(page.find('.landing-actions [data-sources]').getAttribute('href'), 'sources.html');

  page.click(page.find('[data-begin]'));
  assert.equal(shared(), 'sources.html?from=s201&view=scene');
  page.click(page.find('[data-next]'));
  assert.equal(shared(), 'sources.html?from=s202&view=scene');

  page.click(page.find('[data-view-toggle]'));
  assert.equal(shared(), 'sources.html?from=s202&view=continuous');
  page.click(page.find('[data-view-toggle]'));
  assert.equal(shared(), 'sources.html?from=s202&view=scene');

  // The last scene is where this matters most: the shared control is the only
  // route to the register from there, and s231 cites nothing.
  const end = open({ hash: '#s231' });
  assert.equal(end.find('[data-scene="s231"] .citation'), null, 's231 carries no citation');
  assert.equal(
    end.find('.rail-secondary [data-sources]').getAttribute('href'),
    'sources.html?from=s231&view=scene',
  );
});

test('the rail, its launcher and the footer are not offered before the reader has begun', () => {
  const page = open();
  // The approved landing is the title, the drawing, Begin and Sources &
  // Credits. Read continuously would let someone switch view without meeting
  // the essay, and the rail's Sources & Credits is a second copy of the one
  // the landing itself renders.
  assert.equal(page.find('[data-view-toggle]').hidden, true);
  assert.equal(page.find('[data-back]').hidden, true);
  assert.equal(page.find('[data-next]').hidden, true);
  assert.equal(page.find('[data-read-again]').hidden, true);
  assert.equal(page.find('.reader-controls').hidden, true);
  assert.equal(page.find('#chapters').hidden, true);
  assert.equal(page.find('.rail-launcher').hidden, true);
  assert.equal(page.find('.landing-actions [data-sources]').hidden, false, 'the landing keeps its own');
  assert.deepEqual(
    page.find('.landing-actions').querySelectorAll('a').map((link) => link.textContent),
    ['Begin', 'Sources & Credits'],
  );

  page.click(page.find('[data-begin]'));
  assert.equal(page.find('.reader-controls').hidden, false);
  assert.equal(page.find('#chapters').hidden, false);
  assert.equal(page.find('[data-view-toggle]').hidden, false);
  // And now the rail's copy is the only one a reader can reach, because the
  // landing is off screen.
  assert.equal(page.find('.rail-secondary [data-sources]').hidden, false);

  // And they go again if the reader leaves the first scene back to the landing.
  page.click(page.find('[data-back]'));
  assert.equal(page.view(), 'landing');
  assert.equal(page.find('.reader-controls').hidden, true);
  assert.equal(page.find('#chapters').hidden, true);
  assert.equal(page.find('.rail-launcher').hidden, true);
  assert.equal(page.find('[data-view-toggle]').hidden, true);
});

test('the sources page sends the reader back to the scene and mode they left', () => {
  const html = renderSourcesPage(content, {
    mode: 'hosted',
    stylesheetUrl: 'styles.css',
    scriptUrl: 'reader.js',
    essayUrl: 'index.html',
  });

  const fromScene = openDocument(html, { search: '?from=s213&view=scene', hash: '#source-9' });
  assert.equal(fromScene.find('[data-return]').getAttribute('href'), 'index.html#s213');

  const fromContinuous = openDocument(html, { search: '?from=s227&view=continuous', hash: '#source-5' });
  assert.equal(fromContinuous.find('[data-return]').getAttribute('href'), 'index.html?view=continuous#s227');

  // A reader who arrived directly is offered the essay, which is the only
  // honest destination when there is no place to return to.
  const direct = openDocument(html, {});
  assert.equal(direct.find('[data-return]').getAttribute('href'), 'index.html');

  // The shared control carries the same two parameters a citation does, and
  // with no fragment, because it names no entry. The last scene cites nothing,
  // so this is the only way the register is reached from there.
  const shared = openDocument(html, { search: '?from=s231&view=scene' });
  assert.equal(shared.find('[data-return]').getAttribute('href'), 'index.html#s231');

  const sharedContinuous = openDocument(html, { search: '?from=s231&view=continuous' });
  assert.equal(sharedContinuous.find('[data-return]').getAttribute('href'), 'index.html?view=continuous#s231');
});

/*
 * Returning is three separate promises: the scene, the reading mode, and
 * being put back at that scene on the page. None of them is focus. A reader
 * arriving on a fresh document has not asked for anything yet, so the script
 * scrolls and leaves focus where the browser put it, which is why each
 * promise is checked on its own below.
 */
test('returning restores the scene, and returning from continuous restores that too', () => {
  const back = open({ hash: '#s213' });
  assert.equal(back.view(), 'beat');
  assert.equal(back.currentSceneId(), 's213');
  assert.equal(back.scrolledInto(), 's213', 'the reader is put back at the scene they left');
  assert.equal(back.focused(), 'body', 'and arriving does not take their focus');

  const continuous = openDocument(essay, { hash: '#s213', search: '?view=continuous' });
  assert.equal(continuous.view(), 'reading');
  assert.equal(continuous.scrolledInto(), 's213');
  assert.equal(continuous.focused(), 'body');
  // Nothing is "current" while the whole essay is on the page, so the place
  // the reader came back to is read from the view they switch to next.
  assert.equal(continuous.currentSceneId(), null);
  continuous.click(continuous.find('[data-view-toggle]'));
  assert.equal(continuous.view(), 'beat');
  assert.equal(continuous.currentSceneId(), 's213');
});

test('the first, middle and final citing scenes all return correctly', () => {
  const html = renderSourcesPage(content, {
    mode: 'hosted', stylesheetUrl: 's.css', scriptUrl: 'r.js', essayUrl: 'index.html',
  });
  for (const [id, number] of [['s204', 1], ['s215', 13], ['s227', 5]]) {
    const page = openDocument(html, { search: `?from=${id}&view=scene`, hash: `#${sourceAnchor(number)}` });
    assert.equal(page.find('[data-return]').getAttribute('href'), `index.html#${id}`);
    // The reader lands on the entry they followed, not the top of the list.
    assert.equal(page.focused(), sourceAnchor(number));

    const essayPage = openDocument(essay, { hash: `#${id}` });
    assert.equal(essayPage.currentSceneId(), id);
  }
});

/* --- The address bar ----------------------------------------------------- */

test('the address carries the reading mode, so reloading it opens the same view', () => {
  const page = open();
  page.click(page.find('[data-begin]'));
  assert.equal(page.address(), '#s201', 'the scene view is the default, and needs no parameter');

  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.view(), 'reading');
  assert.equal(page.address(), '?view=continuous#s201', 'continuous reading has to be in the URL to survive a reload');

  // And opening that address really does come back to continuous reading.
  const reloaded = openDocument(essay, { search: '?view=continuous', hash: '#s201' });
  assert.equal(reloaded.view(), 'reading');

  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.view(), 'beat');
  assert.equal(page.address(), '#s201', 'and leaving it has to take the parameter out again');
});

test('a stale mode in the address is cleared, not left to contradict the view', () => {
  // The way back from Sources & Credits carries the mode the reader left in.
  // Switching out of it has to rewrite the address, or the URL in the bar
  // says continuous while the reader is looking at one scene -- and reloading
  // or sending it opens the wrong view.
  const page = openDocument(essay, { search: '?view=continuous', hash: '#s213' });
  assert.equal(page.view(), 'reading');

  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.view(), 'beat');
  assert.equal(page.address(), '#s213', 'the stale parameter survived the switch');

  const reloaded = openDocument(essay, { hash: '#s213' });
  assert.equal(reloaded.view(), 'beat');
});

test('a parameter this script does not own is left alone', () => {
  const page = openDocument(essay, { search: '?utm_source=chat&view=continuous', hash: '#s213' });
  assert.equal(page.view(), 'reading');

  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.view(), 'beat');
  assert.ok(page.address().includes('utm_source=chat'), 'an unrelated parameter was discarded');
  assert.ok(!page.address().includes('view=continuous'), 'and the mode was not updated');
  assert.equal(page.address(), '?utm_source=chat#s213');

  // Still there when the mode goes back on.
  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.view(), 'reading');
  assert.equal(page.address(), '?utm_source=chat&view=continuous#s213');
});

test('Back leaves no stale mode behind in the address', () => {
  const page = open();
  page.click(page.find('[data-begin]'));
  page.click(page.find('[data-next]'));
  assert.equal(page.address(), '#s202');

  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.address(), '?view=continuous#s202');

  // How you read is not a place, so switching the view replaces the entry
  // rather than adding one: Back goes to the scene before, not back out of
  // continuous reading. What matters here is that the address it returns to
  // is the address that entry was written with -- no parameter left over.
  page.goBack();
  assert.equal(page.currentSceneId(), 's201');
  assert.equal(page.view(), 'beat');
  assert.equal(page.address(), '#s201', 'Back landed on a scene with a continuous-reading URL');
});

test('a deep link opens that scene without stealing focus', () => {
  const page = open({ hash: '#s220' });
  assert.equal(page.currentSceneId(), 's220');
  assert.equal(page.scrolledInto(), 's220', 'the scene is brought into view');
  assert.equal(page.focused(), 'body', 'nothing was focused, so nothing was taken');
});

/* --- Addresses the superseded script published ---------------------------
   The copy at s088-s132 is gone and those identifiers were deliberately not
   reused, so a link somebody shared before the rewrite would otherwise
   resolve to nothing. The approved handoff relocates each of them to the part
   that now carries the related passage. */

test('an address the old essay published still lands on the related passage', () => {
  for (const relocation of content.relocations.slice(0, 5).concat(content.relocations.slice(-3))) {
    const page = open({ hash: `#${relocation.from}` });
    assert.equal(page.currentSceneId(), relocation.to,
      `${relocation.from} did not reach ${relocation.to}`);
    assert.equal(page.scrolledInto(), relocation.to, 'and the reader is put at it');
    // The address is corrected to the part they actually reached, in place,
    // so the URL stops claiming to be somewhere that no longer exists and
    // Back does not bounce between the two.
    assert.equal(page.address(), `#${relocation.to}`);
  }
});

test('every published address is relocated exactly once, and none to itself', () => {
  assert.equal(content.relocations.length, 45);
  const from = content.relocations.map((entry) => entry.from);
  assert.equal(new Set(from).size, 45, 'an address cannot lead two places');

  const parts = new Set(content.scenes.map((scene) => scene.id));
  for (const entry of content.relocations) {
    assert.ok(!parts.has(entry.from), `${entry.from} was reused as a part`);
    assert.ok(parts.has(entry.to), `${entry.from} leads to ${entry.to}, which is not a part`);
  }

  // And the markup carries the mapping, so the script reads it rather than
  // holding a copy of its own.
  const page = open();
  for (const entry of content.relocations) {
    const answers = page.find(`[data-scene="${entry.to}"]`).getAttribute('data-relocates').split(' ');
    assert.ok(answers.includes(entry.from), `${entry.to} does not answer for ${entry.from}`);
  }
});

test('a relocated address keeps the reading mode it was shared with', () => {
  const relocation = content.relocations[12];
  const page = openDocument(essay, { hash: `#${relocation.from}`, search: '?view=continuous' });
  assert.equal(page.view(), 'reading');
  assert.equal(page.scrolledInto(), relocation.to);
  assert.equal(page.address(), `?view=continuous#${relocation.to}`);
});

test('a chapter fragment opens that chapter', () => {
  const page = open({ hash: '#c6' });
  assert.equal(page.currentSceneId(), 's219');
});

test('Back in the browser returns to the previous scene', () => {
  const page = open();
  page.click(page.find('[data-begin]'));
  page.click(page.find('[data-next]'));
  assert.equal(page.currentSceneId(), 's202');
  page.goBack();
  assert.equal(page.currentSceneId(), 's201');
});

test('an unrecognised fragment does not move a reader who is already reading', () => {
  const page = open({ hash: '#s220' });
  page.navigateTo('#chapters');
  assert.equal(page.currentSceneId(), 's220');
  assert.equal(page.view(), 'beat');
});

test('the script works where pushState is refused', () => {
  const page = openDocument(essay, { history: 'throws' });
  page.click(page.find('[data-begin]'));
  page.click(page.find('[data-next]'));
  assert.equal(page.currentSceneId(), 's202');
  assert.ok(page.historyRefusals > 0);
});

test('a document with no scenes does not throw', () => {
  assert.doesNotThrow(() => openDocument('<!doctype html><html><body><p>Nothing</p></body></html>'));
});
