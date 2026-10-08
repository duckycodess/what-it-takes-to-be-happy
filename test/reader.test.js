/**
 * The reader's behaviour, run against the markup the renderer really produces
 * and the browser script as it really ships.
 *
 * These are journeys a reader takes, not a transcript of the implementation:
 * each one states what a reader should be able to do and then does it. The
 * harness is `test/support/dom.js`, whose own limits are pinned in
 * `test/dom.test.js`; `test/browser.test.js` repeats the same journeys in
 * Chrome where one is installed.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { renderDocument } from '../src/runtime/render.js';
import { openDocument } from './support/dom.js';
import { loadValidContent } from './helpers.js';

const content = loadValidContent();
const ORDER = content.chapters.flatMap((chapter) => chapter.sceneIds);
const LAST = ORDER.length - 1;

const html = renderDocument(content, {
  mode: 'hosted',
  stylesheetUrl: 'styles.css',
  scriptUrl: 'reader.js',
  fontNotice: 'Bundled fallback font.',
  fontLicense: 'Test licence.\n',
  illustration: { url: 'art.png', alt: 'Concept sheet.', caption: 'Provisional.', width: 10, height: 10 },
});

const open = (options) => openDocument(html, options);
const begin = (options) => {
  const page = open(options);
  page.click(page.find('[data-begin]'));
  return page;
};

const focusedSceneId = (page) => {
  const active = page.document.activeElement;
  return active ? active.getAttribute('data-scene') : null;
};

/* --- Moving through the essay -------------------------------------------- */

test('the essay opens on the question, not inside it', () => {
  const page = open();
  assert.equal(page.view(), 'landing');
  assert.equal(page.find('[data-begin]').getAttribute('href'), `#${ORDER[0]}`);
});

test('Begin and Next walk the authored order, and Back walks it in reverse', () => {
  const page = begin();
  assert.equal(page.currentSceneId(), ORDER[0]);

  const forwards = [page.currentSceneId()];
  for (let i = 0; i < LAST; i += 1) {
    page.click(page.find('[data-next]'));
    forwards.push(page.currentSceneId());
  }
  assert.deepEqual(forwards, ORDER, 'Next follows the chapters\' declared scene order');

  const backwards = [page.currentSceneId()];
  for (let i = 0; i < LAST; i += 1) {
    page.click(page.find('[data-back]'));
    backwards.push(page.currentSceneId());
  }
  assert.deepEqual(backwards, [...ORDER].reverse());
});

test('the two ends are disabled and said out loud', () => {
  const page = begin();
  assert.equal(page.find('[data-back]').disabled, true, 'there is nothing before the first beat');
  assert.equal(page.find('[data-next]').disabled, false);
  assert.match(page.text('[data-position-boundary]'), /first beat/);

  for (let i = 0; i < LAST; i += 1) page.click(page.find('[data-next]'));
  assert.equal(page.find('[data-next]').disabled, true, 'there is nothing after the last beat');
  assert.equal(page.find('[data-back]').disabled, false);
  assert.match(page.text('[data-position-boundary]'), /last beat/);
});

test('progress names the beat and the chapter it belongs to', () => {
  const page = begin();
  page.click(page.find('[data-next]'));
  page.click(page.find('[data-next]'));

  assert.equal(page.text('[data-position-current]'), '3');
  assert.equal(page.text('[data-position-where]'), `Chapter 2 of ${content.chapters.length}: ${content.chapters[1].title}`);
  assert.equal(page.text('[data-position-boundary]'), '', 'nothing is said about a boundary in the middle');
});

test('a move is announced once: focus carries it and nothing is a live region', () => {
  const page = begin();
  assert.equal(focusedSceneId(page), ORDER[0], 'Begin moves focus to the beat it opened');

  page.click(page.find('[data-next]'));
  assert.equal(focusedSceneId(page), ORDER[1]);

  const scene = page.currentScene();
  assert.equal(scene.getAttribute('aria-labelledby'), `${ORDER[1]}-title`, 'the focused beat is named by its own title');
  assert.equal(page.find('.beat-position').hasAttribute('aria-live'), false, 'a live region would report the same move a second time');
});

test('arrow keys move between beats, but never inside something that owns them', () => {
  const page = begin();
  page.press('ArrowRight');
  assert.equal(page.currentSceneId(), ORDER[1]);
  page.press('ArrowLeft');
  assert.equal(page.currentSceneId(), ORDER[0]);

  page.press('ArrowLeft');
  assert.equal(page.currentSceneId(), ORDER[0], 'the first beat is the floor');

  for (const selector of ['summary', '[data-next]', '.source-head a']) {
    const inside = page.find(selector);
    assert.ok(inside, `the fixture should contain ${selector}`);
    const before = page.currentSceneId();
    page.press('ArrowRight', inside);
    assert.equal(page.currentSceneId(), before, `an arrow key inside ${selector} belongs to ${selector}`);
  }
});

/* --- Chapters ------------------------------------------------------------- */

test('arriving at a beat brings that beat to the top of the window', () => {
  // The page is taller than one beat: the draft notice and the chapter list
  // sit above it. Scrolling to the document's top would land a reader on the
  // banner rather than on the beat they asked for.
  const page = begin();
  assert.equal(page.document.lastScrolledInto, page.currentScene());

  page.click(page.find('[data-next]'));
  assert.equal(page.document.lastScrolledInto, page.currentScene());

  page.click(page.find(`[data-chapter-link="${content.chapters[2].id}"]`));
  assert.equal(page.document.lastScrolledInto, page.currentScene());
});

test('a chapter shortcut revisits that chapter from its first beat', () => {
  const page = begin();
  for (const chapter of content.chapters) {
    page.click(page.find(`[data-chapter-link="${chapter.id}"]`));
    assert.equal(page.currentSceneId(), chapter.sceneIds[0], `${chapter.id} should open at its first beat`);
    assert.equal(focusedSceneId(page), chapter.sceneIds[0], 'and focus should follow');
    assert.equal(page.find(`[data-chapter-link="${chapter.id}"]`).getAttribute('aria-current'), 'true');
  }
});

test('revisiting a chapter needs nothing that was done earlier', () => {
  const page = begin();
  const lastChapter = content.chapters[content.chapters.length - 1];
  page.click(page.find(`[data-chapter-link="${lastChapter.id}"]`));
  assert.equal(page.currentSceneId(), lastChapter.sceneIds[0], 'no beat in between had to be visited first');
  assert.equal(page.view(), 'beat');
});

/* --- Deep links and the Back button --------------------------------------- */

test('every beat and every chapter can be linked to directly', () => {
  for (const sceneId of ORDER) {
    const page = open({ hash: `#${sceneId}` });
    assert.equal(page.view(), 'beat');
    assert.equal(page.currentSceneId(), sceneId);
  }
  for (const chapter of content.chapters) {
    const page = open({ hash: `#${chapter.id}` });
    assert.equal(page.currentSceneId(), chapter.sceneIds[0], 'a chapter link lands on its first beat');
  }
});

test('an unknown fragment opens the essay rather than failing', () => {
  const page = open({ hash: '#not-a-thing' });
  assert.equal(page.view(), 'landing');
});

test('arriving by link does not steal focus, but moving afterwards does', () => {
  const page = open({ hash: `#${ORDER[3]}` });
  assert.equal(page.document.activeElement, null, 'a reader who has just arrived keeps their focus');

  page.click(page.find('[data-next]'));
  assert.equal(focusedSceneId(page), ORDER[4]);
});

test('each move is recorded, so the browser Back button walks back through them', () => {
  const page = begin();
  page.click(page.find('[data-next]'));
  page.click(page.find('[data-next]'));
  assert.equal(page.location.hash, `#${ORDER[2]}`);

  page.goBack();
  assert.equal(page.currentSceneId(), ORDER[1]);
  page.goBack();
  assert.equal(page.currentSceneId(), ORDER[0]);
  page.goBack();
  assert.equal(page.view(), 'landing', 'back past the first beat leaves the essay the way it was opened');
});

// A file:// document can be refused the History API in two different ways,
// and the fallback has to be reached by both. Missing is the easy one; a
// method that is present and throws is the one a browser actually does.
for (const [label, history] of [['is missing', false], ['throws a SecurityError', 'throws']]) {
  test(`Back works where pushState ${label}, as it can on a local file`, () => {
    const page = openDocument(html, { history });
    page.click(page.find('[data-begin]'));
    page.click(page.find('[data-next]'));
    assert.equal(page.location.hash, `#${ORDER[1]}`, 'the fragment is still written');

    page.goBack();
    assert.equal(page.currentSceneId(), ORDER[0]);
    page.goBack();
    assert.equal(page.view(), 'landing');
  });
}

test('a refused pushState is refused on every move, not detected once', () => {
  const page = openDocument(html, { history: 'throws' });
  page.click(page.find('[data-begin]'));
  page.click(page.find('[data-next]'));
  page.click(page.find('[data-next]'));

  assert.ok(page.historyRefusals >= 3, `expected every move to try and be refused, saw ${page.historyRefusals}`);
  assert.equal(page.currentSceneId(), ORDER[2], 'and the reader moved anyway');
  assert.equal(page.location.hash, `#${ORDER[2]}`);
});

test('a fragment the script itself wrote does not send it round again', () => {
  const page = begin();
  const applied = [];
  for (let i = 0; i < 3; i += 1) {
    page.click(page.find('[data-next]'));
    applied.push(page.currentSceneId());
  }
  assert.deepEqual(applied, ORDER.slice(1, 4), 'each click moved exactly one beat');
});

/* --- Sources -------------------------------------------------------------- */

/* --- Landmarks that are not the reader's state ---------------------------- */

// The document has fragments of its own that mean "move within this page":
// the skip link's #essay, the chapter list's #chapters. Following one must
// not be read as "go somewhere else in the essay".
for (const landmark of ['essay', 'chapters', 'landing']) {
  test(`following #${landmark} from a beat leaves the reader on that beat`, () => {
    const page = begin();
    page.click(page.find('[data-next]'));
    const where = page.currentSceneId();

    page.navigateTo(`#${landmark}`);

    assert.equal(page.view(), 'beat', `#${landmark} is a place on the page, not a change of view`);
    assert.equal(page.currentSceneId(), where);
  });
}

test('#essay from the continuous view keeps the continuous view', () => {
  const page = begin();
  page.click(page.find('[data-view-toggle]'));

  page.navigateTo('#essay');

  assert.equal(page.view(), 'reading');
  assert.equal(page.scenes().length, ORDER.length);
});

test('the skip link points at a target that can take focus', () => {
  const page = open();
  const target = page.find('#essay');
  assert.equal(page.find('.skip-link').getAttribute('href'), '#essay');
  assert.equal(target.getAttribute('tabindex'), '-1', 'a main element is not focusable without this, so the skip link would do nothing');
});

test('an unknown fragment still opens the essay on a first load', () => {
  // Only on a first load: that is the one moment with no reader state to lose.
  const page = open({ hash: '#not-a-thing' });
  assert.equal(page.view(), 'landing');
});

test('the register is reachable from the landing and from inside a beat', () => {
  const fromLanding = open();
  fromLanding.click(fromLanding.find('.landing-sources a'));
  assert.equal(fromLanding.view(), 'reading');
  assert.equal(fromLanding.location.hash, '#sources');

  const fromBeat = begin();
  fromBeat.click(fromBeat.find('.nav-aside a'));
  assert.equal(fromBeat.view(), 'reading', 'the register is readable as a whole, not a beat at a time');
  assert.equal(fromBeat.document.activeElement, fromBeat.find('#sources'));
});

test('a source beside a beat keeps its evidence level and links its full entry', () => {
  const page = begin();
  const reference = page.find('.scene .source');
  assert.ok(reference, 'the fixture should cite a source inside a beat');

  const id = reference.getAttribute('data-source');
  const source = content.sources.find((entry) => entry.id === id);
  const text = reference.textContent;
  assert.ok(text.includes(source.limitation), 'the limitation is on the page, not behind the link');
  assert.match(text, /Limitation/);

  page.click(reference.querySelector('[data-source-link]'));
  assert.equal(page.location.hash, `#${id}`);
  assert.equal(page.document.activeElement.getAttribute('data-source'), id, 'the reader lands on that entry');
});

test('a single source entry can be linked to directly', () => {
  const source = content.sources[2];
  const page = open({ hash: `#${source.id}` });
  assert.equal(page.view(), 'reading');
  assert.equal(page.find('#sources').textContent.includes(source.label), true);
});

test('leaving for the sources and coming back keeps the beat the reader was on', () => {
  const page = begin();
  page.click(page.find('[data-next]'));
  page.click(page.find('[data-next]'));
  const where = page.currentSceneId();

  page.click(page.find('.nav-aside a'));
  assert.equal(page.view(), 'reading');

  page.click(page.find('[data-return-to-beats]'));
  assert.equal(page.view(), 'beat');
  assert.equal(page.currentSceneId(), where);
  assert.equal(focusedSceneId(page), where);
});

test('the return control is offered only when there is a beat to return to', () => {
  const landing = open();
  assert.equal(landing.find('.register-return').hidden, true, 'nothing has been left behind yet');

  landing.click(landing.find('[data-begin]'));
  assert.equal(landing.find('.register-return').hidden, false);
});

/* --- Optional panels ------------------------------------------------------ */

test('a panel is a reveal between beats and plain text in the continuous view', () => {
  const page = begin();
  assert.deepEqual(page.panels().map((panel) => panel.open), [false, false], 'collapsed while moving beat by beat');

  page.click(page.find('[data-view-toggle]'));
  assert.deepEqual(page.panels().map((panel) => panel.open), [true, true], 'open where the text simply reads');
});

test('a panel the reader opened or closed stays that way across view switches', () => {
  const page = begin();
  const [first, second] = page.panels();

  page.togglePanel(first, true);
  assert.equal(first.open, true);

  page.click(page.find('[data-view-toggle]'));
  page.click(page.find('[data-view-toggle]'));
  assert.equal(first.open, true, 'the reader opened it, so it is still open back among the beats');
  assert.equal(second.open, false, 'a panel they never touched still follows the view');

  page.togglePanel(second, true);
  page.togglePanel(first, false);
  page.click(page.find('[data-view-toggle]'));
  assert.deepEqual(page.panels().map((panel) => panel.open), [false, true], 'both choices survive the continuous view');
});

test('opening or dismissing a panel changes nothing else about where the reader is', () => {
  const page = begin();
  page.click(page.find('[data-next]'));
  const where = page.currentSceneId();
  const view = page.view();

  page.togglePanel(page.panels()[0], true);
  page.togglePanel(page.panels()[0], false);

  assert.equal(page.currentSceneId(), where, 'the beat did not move');
  assert.equal(page.view(), view);
  assert.equal(page.find('[data-next]').disabled, false, 'and Next is still there to take');
  assert.equal(page.location.hash, `#${where}`);
});

test('printing opens every panel and then gives the reader their choices back', () => {
  const page = begin();
  page.togglePanel(page.panels()[1], true);

  const whilePrinting = page.print();
  assert.deepEqual(whilePrinting, [true, true], 'the printed argument is complete, whatever is collapsed on screen');
  assert.deepEqual(page.panels().map((panel) => panel.open), [false, true], 'and the reader gets their own panels back');
});

/* --- Views ---------------------------------------------------------------- */

test('the view switch says what it will do and does not also claim a state', () => {
  const page = begin();
  const toggle = page.find('[data-view-toggle]');
  assert.equal(toggle.textContent, 'Read the whole thing');
  assert.equal(toggle.hasAttribute('aria-pressed'), false, 'a changing label and aria-pressed would contradict each other');

  page.click(toggle);
  assert.equal(page.view(), 'reading');
  assert.equal(toggle.textContent, 'Back to the beats');

  page.click(toggle);
  assert.equal(page.view(), 'beat');
  assert.equal(toggle.textContent, 'Read the whole thing');
});

test('Back out of the sources returns to the beats, not just to the fragment', () => {
  const page = begin();
  page.click(page.find('[data-next]'));
  const where = page.currentSceneId();

  page.click(page.find('.nav-aside a'));
  page.click(page.find('[data-return-to-beats]'));
  assert.equal(page.view(), 'beat');

  page.goBack();
  assert.equal(page.view(), 'reading', 'the register is where they were');
  assert.equal(page.location.hash, '#sources');

  page.goBack();
  assert.equal(page.view(), 'beat', 'and before that they were among the beats');
  assert.equal(page.currentSceneId(), where);
});

test('switching view updates where the reader is rather than adding somewhere to go back to', () => {
  const page = begin();
  const entries = page.historyEntries.length;

  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.historyEntries.length, entries, 'how you read is not a place');
  assert.equal(page.location.hash, `#${ORDER[0]}`);

  page.click(page.find('[data-view-toggle]'));
  assert.equal(page.historyEntries.length, entries);
});

test('the continuous view is how the reader is reading, and a jump does not change it', () => {
  const page = begin();
  page.click(page.find('[data-view-toggle]'));

  const chapter = content.chapters[3];
  page.click(page.find(`[data-chapter-link="${chapter.id}"]`));
  assert.equal(page.view(), 'reading', 'they asked to go somewhere, not to change how they read');
  assert.equal(page.currentSceneId(), chapter.sceneIds[0]);

  page.goBack();
  assert.equal(page.view(), 'reading', 'and Back does not change it either');
});

test('every beat stays in the document in every view, so nothing depends on the script', () => {
  const page = begin();
  for (const view of ['beat', 'reading']) {
    if (page.view() !== view) page.click(page.find('[data-view-toggle]'));
    assert.equal(page.scenes().length, ORDER.length, `all beats are present in the ${view} view`);
    for (const scene of content.scenes) {
      const element = page.find(`[data-scene="${scene.id}"]`);
      for (const paragraph of scene.narration) {
        assert.ok(element.textContent.includes(paragraph), `${scene.id} keeps its narration in the ${view} view`);
      }
    }
  }
});
