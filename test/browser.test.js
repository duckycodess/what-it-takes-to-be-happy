/**
 * The reader in a real browser.
 *
 * Everything here is a question `test/reader.test.js` cannot answer, because
 * the answer comes from the stylesheet and the browser rather than from the
 * script: what a view actually hides, whether a focus ring is painted, where
 * focus goes when a native disclosure is clicked, and whether a 360-pixel
 * window scrolls sideways.
 *
 * The page under test is the real offline build — one file, opened through a
 * `file://` URL with no network — so this doubles as a check that the
 * submission artifact works the way it is meant to be opened.
 *
 * Without a browser installed these skip. `npm test` stays honest either
 * way, and docs/verification.md records which happened.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildOutputs } from '../src/build/build.js';
import { loadContent } from '../src/content/load.js';
import { repoRoot } from './helpers.js';
import { findChrome, runInChrome } from './support/chrome.js';
import { join } from 'node:path';

const chrome = findChrome();
const skip = chrome ? false : 'no browser is installed on this host';

const content = await loadContent(join(repoRoot, 'content/content.json'));
const ORDER = content.chapters.flatMap((chapter) => chapter.sceneIds);
const { offline } = chrome ? await buildOutputs(content) : { offline: '' };

/* --- The journey a reader takes, at phone width --------------------------- */

const JOURNEY = `
probe
  .step(function () {
    report.landing = {
      landingVisible: probe.visible(probe.q('.landing')),
      essayVisible: probe.visible(probe.q('.essay-body')),
      registerVisible: probe.visible(probe.q('.source-register')),
      beginVisible: probe.visible(probe.q('[data-begin]')),
      returnOffered: probe.visible(probe.q('.register-return')),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })
  .step(function () { probe.q('[data-begin]').click(); })
  .step(function () {
    var current = probe.q('[data-scene][data-current]');
    report.firstBeat = {
      view: document.documentElement.getAttribute('data-view'),
      scene: probe.sceneId(),
      focused: probe.activeId(),
      outlineWidth: probe.style(current, 'outlineWidth'),
      outlineStyle: probe.style(current, 'outlineStyle'),
      onlyCurrentVisible: probe.all('[data-scene]').filter(probe.visible).length,
      topOfWindow: Math.round(current.getBoundingClientRect().top),
      registerVisible: probe.visible(probe.q('.source-register')),
      controlsVisible: probe.visible(probe.q('.beat-controls')),
      backDisabled: probe.q('[data-back]').disabled,
      boundary: probe.q('[data-position-boundary]').textContent,
      hash: location.hash,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      controlHeights: ['[data-back]', '[data-next]', '[data-view-toggle]'].map(function (selector) {
        return Math.round(probe.q(selector).getBoundingClientRect().height);
      }),
    };
  })
  .step(function () { probe.q('[data-next]').click(); })
  .step(function () { probe.q('[data-next]').click(); })
  .step(function () {
    report.afterNext = {
      topOfWindow: Math.round(probe.q('[data-scene][data-current]').getBoundingClientRect().top),
      scene: probe.sceneId(),
      focused: probe.activeId(),
      hash: location.hash,
      position: probe.q('[data-position-current]').textContent,
      where: probe.q('[data-position-where]').textContent,
    };
  })
  .step(function () { probe.q('[data-chapter-link="${content.chapters[4].id}"]').click(); })
  .step(function () {
    report.afterChapterJump = {
      topOfWindow: Math.round(probe.q('[data-scene][data-current]').getBoundingClientRect().top),
      scene: probe.sceneId(),
      focused: probe.activeId(),
      hash: location.hash,
      visibleChapters: probe.all('.chapter').filter(probe.visible).length,
    };
  })
  // On to the beat that carries both an optional panel and its own sources,
  // so every control touched below is one a reader can actually see.
  .step(function () { probe.q('[data-next]').click(); })
  .step(function () {
    var panel = probe.q('[data-scene][data-current] details.detail');
    report.panelBefore = { open: panel.open, visible: probe.visible(probe.q('summary', panel)) };
    // A real pointer or keyboard activation focuses the control first;
    // element.click() alone skips that, so the focus question would be
    // answered by the harness rather than by the page.
    probe.q('summary', panel).focus();
    probe.q('summary', panel).click();
  })
  .step(function () {
    var panel = probe.q('[data-scene][data-current] details.detail');
    report.panelAfterClick = {
      open: panel.open,
      bodyVisible: probe.visible(probe.q('.detail-body', panel)),
      focusStayedOnSummary: document.activeElement === probe.q('summary', panel),
      sceneUnchanged: probe.sceneId(),
      nextStillAvailable: !probe.q('[data-next]').disabled,
    };
  })
  .step(function () { probe.q('[data-view-toggle]').click(); })
  .step(function () {
    report.reading = {
      view: document.documentElement.getAttribute('data-view'),
      toggleLabel: probe.q('[data-view-toggle]').textContent,
      togglePressed: probe.q('[data-view-toggle]').getAttribute('aria-pressed'),
      visibleScenes: probe.all('[data-scene]').filter(probe.visible).length,
      registerVisible: probe.visible(probe.q('.source-register')),
      controlsVisible: probe.visible(probe.q('.beat-controls')),
      panelsOpen: probe.all('details.detail').map(function (panel) { return panel.open; }),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })
  .step(function () { probe.q('[data-view-toggle]').click(); })
  .step(function () {
    report.backAmongBeats = {
      view: document.documentElement.getAttribute('data-view'),
      panelKeptOpen: probe.q('[data-scene][data-current] details.detail').open,
      untouchedPanelClosed: probe.all('details.detail')[0].open,
    };
  })
  .step(function () { probe.q('[data-scene][data-current] .source [data-source-link]').click(); })
  .step(function () {
    var entry = probe.q('.source-register .source:not([hidden])');
    report.sources = {
      view: document.documentElement.getAttribute('data-view'),
      registerVisible: probe.visible(probe.q('.source-register')),
      focused: probe.activeId(),
      hash: location.hash,
      entryVisible: probe.visible(entry),
      returnOffered: probe.visible(probe.q('.register-return')),
    };
  })
  .step(function () { probe.q('[data-return-to-beats]').click(); })
  .step(function () {
    report.returned = {
      view: document.documentElement.getAttribute('data-view'),
      scene: probe.sceneId(),
      focused: probe.activeId(),
    };
  })
  .step(function () { history.back(); })
  .step(function () {
    report.backOnce = { scene: probe.sceneId(), hash: location.hash, view: document.documentElement.getAttribute('data-view') };
  })
  .step(function () { history.back(); })
  .step(function () {
    report.backTwice = { scene: probe.sceneId(), hash: location.hash, view: document.documentElement.getAttribute('data-view') };
  })
  .run(function () { probe.done(report); });
`;

test('the reader behaves in a real browser at phone width', { skip }, () => {
  const { value } = runInChrome({
    html: offline,
    driver: `var report = {};\n${JOURNEY}`,
    width: 360,
    height: 780,
  });

  assert.equal(value.landing.landingVisible, true);
  assert.equal(value.landing.essayVisible, false, 'the landing is the landing, not the whole essay');
  assert.equal(value.landing.registerVisible, false);
  assert.equal(value.landing.returnOffered, false, 'nothing has been left behind yet');
  assert.equal(value.landing.horizontalOverflow, 0, 'the landing does not scroll sideways at 360px');

  assert.equal(value.firstBeat.view, 'beat');
  assert.equal(value.firstBeat.scene, ORDER[0]);
  assert.equal(value.firstBeat.focused, ORDER[0], 'Begin moves focus into the beat it opened');
  assert.equal(value.firstBeat.outlineStyle, 'solid');
  assert.notEqual(value.firstBeat.outlineWidth, '0px', 'the focused beat is painted with a ring, not just focused');
  assert.equal(value.firstBeat.onlyCurrentVisible, 1, 'one beat is on screen at a time');
  assert.equal(value.firstBeat.topOfWindow, 0, 'the beat is at the top of the window, not below the banner and the chapter list');
  assert.equal(value.firstBeat.registerVisible, false);
  assert.equal(value.firstBeat.controlsVisible, true);
  assert.equal(value.firstBeat.backDisabled, true);
  assert.match(value.firstBeat.boundary, /first beat/);
  assert.equal(value.firstBeat.hash, `#${ORDER[0]}`);
  assert.equal(value.firstBeat.horizontalOverflow, 0, 'a beat does not scroll sideways at 360px');
  for (const height of value.firstBeat.controlHeights) {
    assert.ok(height >= 44, `a control is ${height}px tall, under the 44px a finger needs`);
  }

  assert.equal(value.afterNext.topOfWindow, 0, 'and stays there on every move');
  assert.equal(value.afterNext.scene, ORDER[2]);
  assert.equal(value.afterNext.focused, ORDER[2]);
  assert.equal(value.afterNext.hash, `#${ORDER[2]}`);
  assert.equal(value.afterNext.position, '3');
  assert.match(value.afterNext.where, /^Chapter 2 of 6: /);

  assert.equal(value.afterChapterJump.topOfWindow, 0);
  assert.equal(value.afterChapterJump.scene, content.chapters[4].sceneIds[0]);
  assert.equal(value.afterChapterJump.focused, content.chapters[4].sceneIds[0]);
  assert.equal(value.afterChapterJump.hash, `#${content.chapters[4].sceneIds[0]}`);
  assert.equal(value.afterChapterJump.visibleChapters, 1);

  assert.equal(value.panelBefore.open, false, 'a panel is a reveal while moving beat by beat');
  assert.equal(value.panelBefore.visible, true, 'and its control is on screen to be used');
  assert.equal(value.panelAfterClick.open, true);
  assert.equal(value.panelAfterClick.bodyVisible, true);
  assert.equal(value.panelAfterClick.focusStayedOnSummary, true, 'opening a panel does not take focus away from its own control');
  assert.equal(value.panelAfterClick.sceneUnchanged, ORDER[7], 'and does not move the reader off the beat');
  assert.equal(value.panelAfterClick.nextStillAvailable, true, 'a panel never gates progression');

  assert.equal(value.reading.view, 'reading');
  assert.equal(value.reading.toggleLabel, 'Back to the beats');
  assert.equal(value.reading.togglePressed, null, 'the label carries the state; aria-pressed would contradict it');
  assert.equal(value.reading.visibleScenes, ORDER.length, 'the continuous view is the whole essay');
  assert.equal(value.reading.registerVisible, true);
  assert.equal(value.reading.controlsVisible, false);
  assert.deepEqual(value.reading.panelsOpen, [true, true], 'every panel reads in place in the continuous view');
  assert.equal(value.reading.horizontalOverflow, 0);

  assert.equal(value.backAmongBeats.view, 'beat');
  assert.equal(value.backAmongBeats.panelKeptOpen, true, 'the reader opened it, so it stays open');
  assert.equal(value.backAmongBeats.untouchedPanelClosed, false, 'a panel they never touched follows the view');

  assert.equal(value.sources.view, 'reading');
  assert.equal(value.sources.registerVisible, true);
  assert.equal(value.sources.entryVisible, true);
  assert.equal(value.sources.returnOffered, true);
  assert.ok(value.sources.hash.startsWith('#R'), `expected a source fragment, got ${value.sources.hash}`);
  assert.equal(value.sources.focused, value.sources.hash.slice(1), 'the reader lands on the entry they followed');

  assert.equal(value.returned.view, 'beat');
  assert.equal(value.returned.scene, ORDER[7], 'and comes back to the beat they left');
  assert.equal(value.returned.focused, value.returned.scene);

  // Back works on a local file, and restores how the reader was reading as
  // well as where they were.
  assert.equal(value.backOnce.view, 'reading', 'Back returns to the register they had opened');
  assert.ok(value.backOnce.hash.startsWith('#R'), `expected the source fragment, got ${value.backOnce.hash}`);
  assert.equal(value.backTwice.view, 'beat', 'and Back again returns to the beats, not just to the fragment');
  assert.equal(value.backTwice.scene, ORDER[7]);
  assert.equal(value.backTwice.hash, `#${ORDER[7]}`);
});

/* --- A deep link, and the wide layout ------------------------------------- */

test('a deep link opens that beat without taking the reader\'s focus', { skip }, () => {
  const target = ORDER[5];
  const { value } = runInChrome({
    // Full window width: this is about focus, and a narrow layout viewport
    // has to be measured inside a frame, where "nothing is focused yet" is
    // the frame's business rather than the page's.
    width: 1024,
    height: 900,
    html: offline,
    hash: `#${target}`,
    driver: `
      var report = {};
      probe.step(function () {
        report.view = document.documentElement.getAttribute('data-view');
        report.scene = probe.sceneId();
        report.topOfWindow = Math.round(probe.q('[data-scene][data-current]').getBoundingClientRect().top);
        report.visibleScenes = probe.all('[data-scene]').filter(probe.visible).length;
        report.focused = document.activeElement === document.body ? 'body' : probe.activeId();
      }).run(function () { probe.done(report); });`,
  });

  assert.equal(value.view, 'beat');
  assert.equal(value.scene, target);
  assert.equal(value.visibleScenes, 1);
  assert.equal(value.topOfWindow, 0, 'a reader who followed a link sees the beat, not the page above it');
  assert.equal(value.focused, 'body', 'a reader who has just arrived keeps their focus');
});

test('nothing scrolls sideways at phone width, on any beat or in any view', { skip }, () => {
  const { value } = runInChrome({
    html: offline,
    width: 320,
    height: 780,
    driver: `
      var report = { viewport: 0, widest: [] };
      function widest(label) {
        var root = document.documentElement;
        report.viewport = root.clientWidth;
        var worst = { label: label, over: root.scrollWidth - root.clientWidth, element: null };
        probe.all('body *').forEach(function (element) {
          var box = element.getBoundingClientRect();
          if (box.width === 0) return;
          var over = Math.round(box.right - root.clientWidth);
          if (over > worst.over) {
            worst = { label: label, over: over, element: element.tagName + '.' + (typeof element.className === 'string' ? element.className : '') };
          }
        });
        report.widest.push(worst);
      }
      probe.step(function () { widest('landing'); }).step(function () { probe.q('[data-begin]').click(); });
      ${ORDER.map((id, index) => `probe
        .step(function () { widest('beat ${index + 1}'); })
        .step(function () { var next = probe.q('[data-next]'); if (!next.disabled) next.click(); });`).join('\n')}
      probe
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () { widest('continuous view with the register'); })
        .run(function () { probe.done(report); });`,
  });

  assert.ok(value.viewport > 0 && value.viewport <= 320, `expected a phone-width viewport, got ${value.viewport}`);
  assert.equal(value.widest.length, ORDER.length + 2, 'every beat, the landing, and the continuous view were measured');
  for (const measured of value.widest) {
    assert.ok(measured.over <= 0, `${measured.label} is ${measured.over}px wider than the window (${measured.element})`);
  }
});

test('a wide window gets two columns and still fits', { skip }, () => {
  const { value } = runInChrome({
    html: offline,
    width: 1280,
    height: 900,
    driver: `
      var report = {};
      probe
        .step(function () { probe.q('[data-begin]').click(); })
        .step(function () {
          var scene = probe.q('[data-scene][data-current]');
          var narration = probe.q('.narration', scene).getBoundingClientRect();
          var visual = probe.q('.scene-visual', scene).getBoundingClientRect();
          report.sideBySide = visual.left >= narration.right - 1;
          report.horizontalOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          report.navColumns = probe.style(probe.q('.chapter-nav ol'), 'gridTemplateColumns').split(' ').length;
        })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.sideBySide, true, 'the illustration sits beside the prose rather than under it');
  assert.equal(value.horizontalOverflow, 0);
  assert.equal(value.navColumns, 2, 'the chapter list uses the width it has');
});

test('a reader who asked for less motion gets the same essay', { skip }, () => {
  const { value } = runInChrome({
    html: offline,
    flags: ['--force-prefers-reduced-motion'],
    driver: `
      var report = {};
      probe
        .step(function () { report.honoured = window.matchMedia('(prefers-reduced-motion: reduce)').matches; })
        .step(function () { probe.q('[data-begin]').click(); })
        .step(function () {
          var scene = probe.q('[data-scene][data-current]');
          report.scene = probe.sceneId();
          report.visible = probe.visible(scene);
          report.animation = probe.style(scene, 'animationDuration');
          report.describedInText = probe.q('figcaption', scene).textContent.length;
        })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.honoured, true, 'the browser reported the preference, so the result means something');
  assert.equal(value.visible, true);
  assert.equal(value.scene, ORDER[0], 'the beat is simply there, with nothing to wait for');
  assert.ok(value.describedInText > 0, 'and what the picture would show is written out');
});
