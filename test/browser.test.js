/**
 * The reader in a real browser.
 *
 * Everything here is a question `test/reader.test.js` cannot answer, because
 * the answer comes from the stylesheet and the browser rather than from the
 * script: what a view actually hides, whether a focus ring is painted,
 * whether a drawing really loaded, whether two names sit on top of each
 * other, whether a 360-pixel window scrolls sideways, what a reader with no
 * scripting receives, and what comes out of the printer.
 *
 * It runs against the real hosted build — index.html and sources.html with
 * their stylesheet, script, fonts and every selected PNG beside them at the
 * paths they are linked at — because the hosted website is the deliverable
 * and a drawing the browser never had to fetch proves nothing.
 *
 * Without a browser installed these skip. `npm test` stays honest either
 * way, and docs/verification.md records which happened.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';

import { buildOutputs } from '../src/build/build.js';
import { PROJECT_FONT, FALLBACK_FONT, FALLBACK_FONT_LICENSE } from '../src/build/assets.js';
import { loadContent } from '../src/content/load.js';
import { sourceAnchor } from '../src/runtime/render.js';
import { repoRoot } from './helpers.js';
import { findChrome, runInChrome, printInChrome, withoutScriptInChrome } from './support/chrome.js';

const chrome = findChrome();
const skip = chrome ? false : 'no browser is installed on this host';

const content = await loadContent(join(repoRoot, 'content/content.json'));
const ORDER = content.chapters.flatMap((chapter) => chapter.sceneIds);
const sceneById = new Map(content.scenes.map((scene) => [scene.id, scene]));
const built = chrome ? await buildOutputs(content) : null;

/**
 * The hosted output as a browser meets it: the pages, and every file they
 * link to at the path they link it at. The fonts and the artwork are the
 * point — both have to be fetched over real requests before anything can be
 * asked about them.
 */
const hostedFiles = {};
if (built) {
  hostedFiles['styles.css'] = built.hostedCss;
  hostedFiles['reader.js'] = built.script;
  hostedFiles['sources.html'] = built.sources;
  hostedFiles[PROJECT_FONT.published] = built.projectFontBytes;
  hostedFiles[FALLBACK_FONT.published] = built.fontBytes;
  hostedFiles[FALLBACK_FONT_LICENSE.published] = built.fontLicense;
  for (const [path, bytes] of built.artwork) hostedFiles[path] = bytes;
}

const hosted = built ? built.hosted : '';
const sources = built ? built.sources : '';

/** The essay, as the browser is given it. */
const essayPage = (options) => runInChrome({ html: hosted, files: hostedFiles, ...options });

/** The separate Sources & Credits page, at the address a citation leads to. */
const sourcesPage = (options) => runInChrome({
  html: sources,
  files: { ...hostedFiles, 'index.html': hosted },
  ...options,
});

/** A driver that waits for the fonts before it reports anything. */
const afterFonts = (body) => `
document.fonts.ready.then(function () {
  var report = {};
  ${body}
  probe.done(report);
});`;

/**
 * Width of a string set in one family at 16px, measured by the browser.
 *
 * Through a canvas rather than an element, so the page's own layout — a
 * centred column with a maximum width — cannot change the answer. A canvas
 * draws with the document's loaded fonts, so this measures the real face.
 */
const MEASURE_IN = `
var measuringContext = document.createElement('canvas').getContext('2d');
function measureIn(text, family) {
  measuringContext.font = '16px ' + family;
  return measuringContext.measureText(text).width;
}`;

/* --- The journey a reader takes, at phone width --------------------------- */

const JOURNEY = `
probe
  .step(function () {
    report.landing = {
      landingVisible: probe.visible(probe.q('.landing')),
      essayVisible: probe.visible(probe.q('.essay-body')),
      menuVisible: probe.visible(probe.q('.chapter-menu')),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      title: probe.q('h1').textContent,
      actions: probe.all('.landing-actions a').map(function (a) { return a.textContent; }),
    };
  })
  .step(function () { probe.q('[data-begin]').click(); })
  .step(function () {
    var scene = probe.q('[data-scene][data-current]');
    report.firstScene = {
      view: document.documentElement.getAttribute('data-view'),
      scene: probe.sceneId(),
      onlyCurrentVisible: probe.all('[data-scene]').filter(probe.visible).length,
      topOfWindow: Math.round(scene.getBoundingClientRect().top),
      hash: location.hash,
      backVisible: probe.visible(probe.q('[data-back]')),
      nextVisible: probe.visible(probe.q('[data-next]')),
      readAgainVisible: probe.visible(probe.q('[data-read-again]')),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      controlHeights: probe.all('.reader-controls button, .reader-controls .button')
        .filter(probe.visible)
        .map(function (control) { return Math.round(control.getBoundingClientRect().height); }),
    };
  })
  .step(function () { probe.q('[data-next]').click(); })
  .step(function () { probe.q('[data-next]').click(); })
  .step(function () {
    report.afterNext = {
      scene: probe.sceneId(),
      hash: location.hash,
      topOfWindow: Math.round(probe.q('[data-scene][data-current]').getBoundingClientRect().top),
      scrolledAsFarAsItGoes: Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1,
      inViewport: probe.inViewport(probe.q('[data-scene][data-current]')),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })
  .step(function () { probe.q('[data-chapter-link="c6"]').click(); })
  .step(function () {
    report.afterChapterJump = {
      scene: probe.sceneId(),
      hash: location.hash,
      visibleScenes: probe.all('[data-scene]').filter(probe.visible).length,
    };
  })
  .step(function () { probe.q('[data-view-toggle]').click(); })
  .step(function () {
    report.continuous = {
      view: document.documentElement.getAttribute('data-view'),
      toggleLabel: probe.q('[data-view-toggle]').textContent,
      visibleScenes: probe.all('[data-scene]').filter(probe.visible).length,
      chapterTitlesVisible: probe.all('.chapter-title').filter(probe.visible).length,
      comparisonStatesVisible: probe.all('.art-comparison .art-view').filter(probe.visible).length,
      comparisonLabelsVisible: probe.all('.art-comparison .art-view-label').filter(probe.visible).length,
      controlsVisible: probe.visible(probe.q('[data-back]')),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })
  .step(function () { probe.q('[data-view-toggle]').click(); })
  .step(function () {
    report.backAmongScenes = {
      view: document.documentElement.getAttribute('data-view'),
      scene: probe.sceneId(),
      visibleScenes: probe.all('[data-scene]').filter(probe.visible).length,
    };
  })
  .run(function () { probe.done(report); });
`;

test('the reader behaves in a real browser at phone width', { skip }, () => {
  const { value } = essayPage({
    driver: `var report = {};\n${JOURNEY}`,
    width: 375,
    height: 780,
  });

  assert.equal(value.landing.landingVisible, true);
  assert.equal(value.landing.essayVisible, false, 'the landing is the landing, not the whole essay');
  assert.equal(value.landing.menuVisible, false);
  assert.equal(value.landing.title, content.landing.title);
  assert.deepEqual(value.landing.actions, ['Begin', 'Sources & Credits']);
  assert.equal(value.landing.horizontalOverflow, 0, 'the landing does not scroll sideways at 375px');

  assert.equal(value.firstScene.view, 'beat');
  assert.equal(value.firstScene.scene, ORDER[0]);
  assert.equal(value.firstScene.onlyCurrentVisible, 1, 'one scene is on screen at a time');
  assert.equal(value.firstScene.topOfWindow, 0, 'the scene is at the top of the window, not below the chapter list');
  assert.equal(value.firstScene.hash, `#${ORDER[0]}`);
  assert.equal(value.firstScene.backVisible, true);
  assert.equal(value.firstScene.nextVisible, true);
  assert.equal(value.firstScene.readAgainVisible, false, 'Read again belongs at the end, not the beginning');
  assert.equal(value.firstScene.horizontalOverflow, 0);
  for (const height of value.firstScene.controlHeights) {
    assert.ok(height >= 44, `a control is ${height}px tall, under the 44px a finger needs`);
  }

  assert.equal(value.afterNext.scene, ORDER[2]);
  assert.equal(value.afterNext.hash, `#${ORDER[2]}`);
  // A short scene near the end of a short document cannot be brought to the
  // top, because there is nothing below it left to scroll. What has to hold
  // either way is that the reader is looking at the scene they moved to.
  assert.equal(value.afterNext.inViewport, true);
  assert.ok(
    value.afterNext.topOfWindow === 0 || value.afterNext.scrolledAsFarAsItGoes,
    `the scene sits ${value.afterNext.topOfWindow}px down a page that could still scroll`,
  );
  assert.equal(value.afterNext.horizontalOverflow, 0);

  const chapterSix = content.chapters.find((chapter) => chapter.id === 'c6');
  assert.equal(value.afterChapterJump.scene, chapterSix.sceneIds[0]);
  assert.equal(value.afterChapterJump.hash, `#${chapterSix.sceneIds[0]}`);
  assert.equal(value.afterChapterJump.visibleScenes, 1);

  assert.equal(value.continuous.view, 'reading');
  assert.equal(value.continuous.toggleLabel, content.interface.scene);
  assert.equal(value.continuous.visibleScenes, ORDER.length, 'the continuous view is the whole essay');
  assert.equal(value.continuous.chapterTitlesVisible, content.chapters.length);
  assert.equal(value.continuous.comparisonStatesVisible, 4, 'both drawings of both comparisons read in place');
  assert.equal(value.continuous.comparisonLabelsVisible, 4, 'each with its own label');
  assert.equal(value.continuous.controlsVisible, false, 'scene controls mean nothing in continuous reading');
  assert.equal(value.continuous.horizontalOverflow, 0);

  assert.equal(value.backAmongScenes.view, 'beat');
  assert.equal(value.backAmongScenes.scene, chapterSix.sceneIds[0], 'and comes back to where it left');
  assert.equal(value.backAmongScenes.visibleScenes, 1);
});

test('the end of the essay offers Read again rather than a dead Next', { skip }, () => {
  const last = ORDER.at(-1);
  const { value } = essayPage({
    width: 1024,
    height: 900,
    hash: `#${last}`,
    driver: `
      var report = {};
      probe.step(function () {
        report.scene = probe.sceneId();
        report.nextVisible = probe.visible(probe.q('[data-next]'));
        report.backVisible = probe.visible(probe.q('[data-back]'));
        report.readAgain = probe.visible(probe.q('[data-read-again]'))
          ? probe.q('[data-read-again]').getAttribute('href') : null;
        report.sources = probe.q('[data-sources]').getAttribute('href');
      }).run(function () { probe.done(report); });`,
  });

  assert.equal(value.scene, last);
  assert.equal(value.nextVisible, false, 'there is nothing after the last scene');
  assert.equal(value.backVisible, true);
  assert.equal(value.readAgain, `#${ORDER[0]}`);
  assert.equal(value.sources, 'sources.html');
});

/* --- Deep links, focus and the keyboard ----------------------------------- */

test('a deep link opens that scene, and the script takes no focus of its own', { skip }, () => {
  const target = ORDER[5];
  const { value } = essayPage({
    // Full window width: this is about focus, and a narrow layout viewport
    // has to be measured inside a frame, where "nothing is focused yet" is
    // the frame's business rather than the page's.
    width: 1024,
    height: 900,
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
  assert.equal(value.topOfWindow, 0, 'a reader who followed a link sees the scene, not the page above it');

  // The browser focuses the fragment's target itself, because a scene is
  // focusable so that the script can send a reader to it. That is the
  // browser answering the link the reader followed, and it lands on the
  // scene they asked for -- never anywhere else.
  assert.equal(value.focused, target);

  // What the script must not do is take focus when the reader asked for
  // nothing. Opened with no fragment, the page leaves focus where it was.
  const { value: plain } = essayPage({
    width: 1024,
    height: 900,
    driver: `
      var report = {};
      probe.step(function () {
        report.view = document.documentElement.getAttribute('data-view');
        report.focused = document.activeElement === document.body ? 'body' : probe.activeId();
      }).run(function () { probe.done(report); });`,
  });
  assert.equal(plain.view, 'landing');
  assert.equal(plain.focused, 'body', 'a reader who has just arrived keeps their focus');
});

test('focus moves with the reader, and the move is painted', { skip }, () => {
  const { value } = essayPage({
    width: 1024,
    height: 900,
    driver: `
      var report = {};
      function ring(element) {
        return {
          id: element.getAttribute('data-scene') || element.getAttribute('id'),
          style: probe.style(element, 'outlineStyle'),
          width: probe.style(element, 'outlineWidth'),
        };
      }
      probe
        .step(function () { probe.q('[data-begin]').click(); })
        .step(function () { report.afterBegin = ring(document.activeElement); })
        .step(function () { probe.q('[data-next]').click(); })
        .step(function () { report.afterNext = ring(document.activeElement); })
        .step(function () {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        })
        .step(function () { report.afterArrowRight = { scene: probe.sceneId(), focused: ring(document.activeElement) }; })
        .step(function () {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        })
        .step(function () { report.afterArrowLeft = probe.sceneId(); })
        .step(function () { probe.q('[data-chapter-link="c8"]').click(); })
        .step(function () { report.afterChapterJump = ring(document.activeElement); })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.afterBegin.id, ORDER[0], 'Begin moves focus into the scene it opened');
  assert.equal(value.afterBegin.style, 'solid', 'and the move is painted, not just announced');
  assert.notEqual(value.afterBegin.width, '0px');

  assert.equal(value.afterNext.id, ORDER[1]);
  assert.equal(value.afterArrowRight.scene, ORDER[2], 'the arrow keys walk the scenes');
  assert.equal(value.afterArrowRight.focused.id, ORDER[2]);
  assert.equal(value.afterArrowLeft, ORDER[1]);

  const chapterEight = content.chapters.find((chapter) => chapter.id === 'c8');
  assert.equal(value.afterChapterJump.id, chapterEight.sceneIds[0]);
  assert.equal(value.afterChapterJump.style, 'solid');
});

test('an in-page landmark moves the reader within the scene, not out of it', { skip }, () => {
  const { value } = essayPage({
    width: 1024,
    height: 900,
    driver: `
      var report = {};
      probe
        .step(function () { probe.q('[data-begin]').click(); })
        .step(function () { probe.q('[data-next]').click(); })
        .step(function () { report.before = { view: document.documentElement.getAttribute('data-view'), scene: probe.sceneId() }; })
        .step(function () { probe.q('.skip-link').click(); })
        .step(function () {
          report.afterSkipLink = {
            view: document.documentElement.getAttribute('data-view'),
            scene: probe.sceneId(),
            hash: location.hash,
            focused: probe.activeId(),
            sceneStillVisible: probe.visible(probe.q('[data-scene][data-current]')),
          };
        })
        .step(function () { location.hash = '#chapters'; })
        .step(function () {
          report.afterChaptersFragment = {
            view: document.documentElement.getAttribute('data-view'),
            scene: probe.sceneId(),
          };
        })
        .step(function () { location.hash = '#nothing-here'; })
        .step(function () {
          report.afterUnknownFragment = { view: document.documentElement.getAttribute('data-view'), scene: probe.sceneId() };
        })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.before.view, 'beat');
  assert.equal(value.afterSkipLink.view, 'beat', 'the skip link must not throw the reader back to the landing');
  assert.equal(value.afterSkipLink.scene, value.before.scene);
  assert.equal(value.afterSkipLink.hash, '#essay');
  assert.equal(value.afterSkipLink.focused, 'essay', 'and it does what a skip link is for: focus moves to the essay');
  assert.equal(value.afterSkipLink.sceneStillVisible, true);

  assert.equal(value.afterChaptersFragment.view, 'beat');
  assert.equal(value.afterChaptersFragment.scene, value.before.scene);

  assert.equal(value.afterUnknownFragment.view, 'beat', 'an unrecognised fragment is not a reason to move anyone');
  assert.equal(value.afterUnknownFragment.scene, value.before.scene);
});

/* --- Reflow --------------------------------------------------------------- */

test('nothing scrolls sideways at phone width, on any scene or in any view', { skip }, () => {
  const { value } = essayPage({
    width: 360,
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
        .step(function () { widest('scene ${index + 1} (${id})'); })
        .step(function () { var next = probe.q('[data-next]'); if (probe.visible(next)) next.click(); });`).join('\n')}
      probe
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () { widest('continuous reading'); })
        .run(function () { probe.done(report); });`,
  });

  assert.ok(value.viewport > 0 && value.viewport <= 360, `expected a phone-width viewport, got ${value.viewport}`);
  assert.equal(value.widest.length, ORDER.length + 2, 'every scene, the landing, and the continuous view were measured');
  for (const measured of value.widest) {
    assert.ok(measured.over <= 0, `${measured.label} is ${measured.over}px wider than the window (${measured.element})`);
  }
});

test('the register does not scroll sideways either, where the long URLs are', { skip }, () => {
  const { value } = sourcesPage({
    width: 360,
    height: 780,
    driver: `
      var report = {};
      probe.step(function () {
        var root = document.documentElement;
        report.viewport = root.clientWidth;
        report.over = root.scrollWidth - root.clientWidth;
        report.entries = probe.all('.source').length;
        var worst = { over: -9999, element: null };
        probe.all('body *').forEach(function (element) {
          var box = element.getBoundingClientRect();
          if (box.width === 0) return;
          var over = Math.round(box.right - root.clientWidth);
          if (over > worst.over) worst = { over: over, element: element.tagName + '.' + (typeof element.className === 'string' ? element.className : '') };
        });
        report.worst = worst;
      }).run(function () { probe.done(report); });`,
  });

  assert.equal(value.entries, content.sourcesPage.sources.length);
  assert.ok(value.over <= 0, `the register is ${value.over}px wider than the window`);
  assert.ok(value.worst.over <= 0, `${value.worst.element} overflows by ${value.worst.over}px`);
});

/* --- The artwork ---------------------------------------------------------- */

/** Every drawing and every label on every scene, at one layout width. */
function artwork(width) {
  const { value } = essayPage({
    width,
    height: 900,
    driver: `
      var report = { scenes: [] };
      probe.step(function () { probe.q('[data-begin]').click(); });
      ${ORDER.map(() => `probe
        .step(function () {
          var scene = probe.q('[data-scene][data-current]');
          report.scenes.push({
            scene: probe.sceneId(),
            views: probe.all('.art-view', scene).map(function (view) {
              var image = probe.q('img', view);
              var anchor = probe.q('.art-anchor', view);
              var box = anchor.getBoundingClientRect();
              return {
                ref: view.getAttribute('data-ref'),
                src: image.getAttribute('src'),
                loaded: image.complete && image.naturalWidth > 0,
                naturalWidth: image.naturalWidth,
                drawnWidth: Math.round(box.width),
                visible: probe.visible(view),
                viewLabel: probe.q('.art-view-label', view) ? probe.q('.art-view-label', view).textContent : null,
                labels: probe.all('.art-label', view).map(function (label) {
                  var labelBox = label.getBoundingClientRect();
                  return {
                    text: label.textContent,
                    kind: label.getAttribute('data-kind'),
                    left: Math.round(labelBox.left), right: Math.round(labelBox.right),
                    top: Math.round(labelBox.top), bottom: Math.round(labelBox.bottom),
                    insideImage: labelBox.left >= box.left - 1 && labelBox.right <= box.right + 1,
                    aboveTheHead: labelBox.bottom <= box.top + box.height * 0.55,
                    inViewport: probe.inViewport(label),
                    selectable: probe.style(label, 'userSelect') !== 'none',
                  };
                }),
              };
            }),
          });
        })
        .step(function () { var next = probe.q('[data-next]'); if (probe.visible(next)) next.click(); });`).join('\n')}
      probe.run(function () { probe.done(report); });`,
  });
  return value.scenes;
}

test('every selected drawing really loads, at its own proportions', { skip }, () => {
  const scenes = artwork(375);
  assert.equal(scenes.length, ORDER.length);

  let drawn = 0;
  for (const scene of scenes) {
    const authored = sceneById.get(scene.scene);
    assert.equal(scene.views.length, authored.visual.views.length, `${scene.scene} shows a different number of drawings`);

    scene.views.forEach((view, index) => {
      const expected = authored.visual.views[index];
      const asset = content.assets.find((entry) => entry.ref === expected.ref);
      assert.equal(view.ref, expected.ref);
      assert.equal(view.src, asset.images[expected.image].path, `${scene.scene} serves a file the document does not name`);

      // The unshown state of a comparison is deliberately not fetched: it is
      // lazy and display:none, which is the whole point of loading it only
      // when a reader asks for it. Switching to it is checked below.
      if (!view.visible) return;
      drawn += 1;
      assert.equal(view.loaded, true, `${scene.scene}: ${view.src} did not load in the browser`);
      assert.equal(view.naturalWidth, asset.images[expected.image].width,
        `${scene.scene}: the file served is not the inspected one`);
      assert.ok(view.drawnWidth > 0, `${scene.scene}: ${view.ref} was laid out with no width`);
    });
  }
  assert.ok(drawn >= 28, `the essay should show every delivered drawing, found ${drawn}`);
});

test('a name sits over its own head, inside the drawing, as selectable text', { skip }, () => {
  for (const width of [375, 1200]) {
    const scenes = artwork(width);
    let labelled = 0;

    for (const scene of scenes) {
      for (const view of scene.views) {
        if (!view.visible) continue;
        const asset = content.assets.find((entry) => entry.ref === view.ref);
        assert.equal(view.labels.length, asset.labels.length,
          `${scene.scene} at ${width}px: ${view.ref} shows a different number of labels`);

        for (const label of view.labels) {
          labelled += 1;
          assert.ok(asset.labels.some((entry) => entry.text === label.text),
            `${scene.scene}: "${label.text}" is not a label this asset was inspected with`);
          assert.equal(label.insideImage, true,
            `${scene.scene} at ${width}px: "${label.text}" hangs outside the drawing`);
          if (label.kind === 'name') {
            // A name belongs over the head it names. A prop label is anchored
            // to the prop it names, which is wherever the drawing put it.
            assert.equal(label.aboveTheHead, true,
              `${scene.scene} at ${width}px: the name "${label.text}" has slipped down the figure`);
          }
          assert.equal(label.inViewport, true,
            `${scene.scene} at ${width}px: "${label.text}" is clipped out of the window`);
          assert.equal(label.selectable, true, 'a name is text a reader can select');
        }

        // Two names on one drawing must not overlap at either width: a
        // reserved band above the image is no use if the names collide in it.
        for (let a = 0; a < view.labels.length; a += 1) {
          for (let b = a + 1; b < view.labels.length; b += 1) {
            const one = view.labels[a];
            const other = view.labels[b];
            const apart = one.right <= other.left || other.right <= one.left
              || one.bottom <= other.top || other.bottom <= one.top;
            assert.ok(apart, `${scene.scene} at ${width}px: "${one.text}" and "${other.text}" overlap`);
          }
        }
      }
    }
    assert.ok(labelled > 20, `expected the names to be measured, found ${labelled} at ${width}px`);
  }
});

/** Every box of a pair scene's figure, at one layout width. */
function pairBoxes(width, { printRulesOnScreen = false } = {}) {
  // Print cannot be emulated without a DevTools socket, which a Windows
  // browser driven from WSL cannot be given. Rewriting the print block to
  // `@media all` and rendering it is the honest way to see what those rules
  // actually do to a layout; it is the same technique that caught a print
  // fault in the superseded build.
  const files = printRulesOnScreen
    ? { ...hostedFiles, 'styles.css': built.hostedCss.replace('@media print', '@media all') }
    : hostedFiles;

  const { value } = runInChrome({
    html: hosted,
    files,
    width,
    height: 1000,
    hash: '#s097',
    driver: `
      var report = {};
      probe.step(function () {
        var figure = probe.q('.art[data-layout="pair"]', probe.q('#s097'));
        report.views = probe.all('.art-view', figure).map(function (view) {
          var anchor = probe.q('.art-anchor', view);
          var label = probe.q('.art-view-label', view);
          var a = anchor.getBoundingClientRect();
          var l = label.getBoundingClientRect();
          return {
            state: view.getAttribute('data-state'),
            label: label.textContent,
            image: { top: Math.round(a.top), left: Math.round(a.left), right: Math.round(a.right), bottom: Math.round(a.bottom), width: Math.round(a.width) },
            caption: { top: Math.round(l.top), left: Math.round(l.left), right: Math.round(l.right), width: Math.round(l.width) },
          };
        });
      }).run(function () { probe.done(report); });`,
  });
  return value.views;
}

test('a pair shows its two drawings side by side, each above its own label', { skip }, () => {
  const scene = content.scenes.find((entry) => entry.id === 's097');
  const labels = scene.visual.views.map((view) => view.label);

  for (const printRulesOnScreen of [false, true]) {
    const where = printRulesOnScreen ? 'with the print rules applied' : 'on screen';
    const views = pairBoxes(1200, { printRulesOnScreen });
    assert.equal(views.length, 2);
    assert.deepEqual(views.map((view) => view.label), labels, `the labels are out of authored order ${where}`);

    const [first, second] = views;
    // Side by side: the drawings share a row and sit in different columns.
    assert.equal(first.image.top, second.image.top, `the drawings do not share a row ${where}`);
    assert.ok(
      first.image.right <= second.image.left,
      `the drawings overlap or are stacked ${where}: ${JSON.stringify([first.image, second.image])}`,
    );

    // Each label belongs to the drawing above it, not to the one beside it.
    for (const view of views) {
      assert.ok(
        view.caption.top >= view.image.bottom,
        `"${view.label}" is beside its drawing rather than under it ${where}`,
      );
      assert.equal(view.caption.left, view.image.left, `"${view.label}" is not aligned with its drawing ${where}`);
    }
    // And the second label is under the second drawing, which is what
    // auto-placement got wrong: it put the first label where the second
    // drawing belonged.
    assert.ok(second.caption.left > first.caption.left, `both labels are in one column ${where}`);
  }
});

test('a pair stacks in label order on a phone', { skip }, () => {
  const views = pairBoxes(375);
  const [first, second] = views;

  assert.equal(first.image.left, second.image.left, 'one column');
  assert.ok(first.caption.top >= first.image.bottom, 'the first label is under the first drawing');
  assert.ok(second.image.top >= first.caption.top, 'and the second drawing follows that label');
  assert.ok(second.caption.top >= second.image.bottom);
  assert.ok(first.image.width > 0 && second.image.width > 0);
});

test('the landing offers only what the approved landing lists', { skip }, () => {
  const { value } = essayPage({
    width: 1024,
    height: 900,
    driver: `
      var report = {};
      function controls() {
        return probe.all('.reader-controls button, .reader-controls .button')
          .filter(probe.visible)
          .map(function (control) { return control.textContent.trim(); });
      }
      probe
        .step(function () {
          report.onLanding = {
            view: document.documentElement.getAttribute('data-view'),
            controls: controls(),
            landingActions: probe.all('.landing-actions a').filter(probe.visible).map(function (a) { return a.textContent; }),
          };
        })
        .step(function () { probe.q('[data-begin]').click(); })
        .step(function () { report.reading = controls(); })
        .step(function () { probe.q('[data-back]').click(); })
        .step(function () { report.backOnLanding = { view: document.documentElement.getAttribute('data-view'), controls: controls() }; })
        .run(function () { probe.done(report); });`,
  });

  // Read continuously and Print would let a first-time visitor switch view or
  // print the essay without ever meeting it. Sources & Credits is on the
  // approved landing, so it stays.
  assert.equal(value.onLanding.view, 'landing');
  assert.deepEqual(value.onLanding.controls, [content.interface.sources]);
  assert.deepEqual(value.onLanding.landingActions, [content.landing.beginLabel, content.landing.sourcesLabel]);

  assert.ok(value.reading.includes(content.interface.continuous), 'they arrive once there is something to read');
  assert.ok(value.reading.includes(content.interface.print));

  assert.equal(value.backOnLanding.view, 'landing');
  assert.deepEqual(value.backOnLanding.controls, [content.interface.sources], 'and go again on the way out');
});

test('the shared Sources control returns the reader to where they were', { skip }, () => {
  const last = ORDER.at(-1);
  const { value } = essayPage({
    width: 1024,
    height: 900,
    hash: `#${last}`,
    driver: `
      var report = {};
      probe
        .step(function () {
          report.atLastScene = probe.q('.reader-controls [data-sources]').getAttribute('href');
          report.citationsHere = probe.all('.citation', probe.q('[data-scene][data-current]')).length;
        })
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () { report.continuous = probe.q('.reader-controls [data-sources]').getAttribute('href'); })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.citationsHere, 0, 'the final scene cites nothing, so this control is the only route');
  assert.equal(value.atLastScene, `sources.html?from=${last}&view=scene`);
  assert.equal(value.continuous, `sources.html?from=${last}&view=continuous`);

  // And following it really does come back, in the mode it was left in.
  for (const [query, expected] of [
    [`?from=${last}&view=scene`, `index.html#${last}`],
    [`?from=${last}&view=continuous`, `index.html?view=continuous#${last}`],
  ]) {
    const { value: page } = runInChrome({
      html: sources,
      files: { ...hostedFiles, 'index.html': hosted },
      query,
      width: 1024,
      height: 900,
      driver: `
        var report = {};
        probe.step(function () {
          report.href = probe.q('[data-return]').getAttribute('href');
          report.label = probe.q('[data-return]').textContent;
        }).run(function () { probe.done(report); });`,
    });
    assert.equal(page.href, expected);
    assert.equal(page.label, content.sourcesPage.returnLabel);
  }
});

test('reading continuously, the shared Sources control follows the scroll', { skip }, () => {
  // Entering continuous reading at one scene and scrolling to another is the
  // case the script is otherwise uninvolved in: nothing tells it the reader
  // moved. If the shared control still carried the scene the view was entered
  // at, leaving for the register and coming back would drop the reader pages
  // away from the passage they left.
  const entered = ORDER[4];
  const target = ORDER[30];

  const { value } = essayPage({
    width: 1024,
    height: 900,
    hash: `#${entered}`,
    driver: `
      var report = {};
      probe
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () {
          report.view = document.documentElement.getAttribute('data-view');
          report.beforeScroll = probe.q('.reader-controls [data-sources]').getAttribute('href');
          report.focusedBefore = document.activeElement === document.body ? 'body' : probe.activeId();
        })
        .step(function () {
          // A reader scrolling, not a script navigating: no fragment is
          // written and nothing is focused.
          var scene = probe.q('#${target}');
          window.scrollTo(0, scene.getBoundingClientRect().top + window.scrollY + 10);
        })
        // The link is rewritten on a short timer after the scroll settles, so
        // wait for it. A reader does not read the DOM a millisecond later.
        .step(function () {})
        .wait(250)
        .step(function () {
          report.afterScroll = probe.q('.reader-controls [data-sources]').getAttribute('href');
          report.hash = location.hash;
          report.focusedAfter = document.activeElement === document.body ? 'body' : probe.activeId();
          report.stillContinuous = document.documentElement.getAttribute('data-view');
          report.visibleScenes = probe.all('[data-scene]').filter(probe.visible).length;
        })
        .step(function () {
          // Back to the top, to prove it tracks rather than only ratchets.
          window.scrollTo(0, 0);
        })
        .wait(250)
        .step(function () {
          // Read it the way a reader reaches it. The passive listener keeps
          // the link fresh while scrolling, and the link recomputes as it is
          // used, which is the path that matters and the one a browser that
          // coalesced the last scroll event away still takes.
          var link = probe.q('.reader-controls [data-sources]');
          report.afterScrollBackPassive = link.getAttribute('href');
          link.focus();
          report.afterScrollBack = link.getAttribute('href');
          report.focusedOnLink = document.activeElement === link;
        })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.view, 'reading');
  assert.equal(value.beforeScroll, `sources.html?from=${entered}&view=continuous`);

  assert.equal(value.afterScroll, `sources.html?from=${target}&view=continuous`,
    'the control still points at the scene continuous reading was entered at');
  assert.equal(value.stillContinuous, 'reading', 'and the reader is still reading continuously');
  assert.equal(value.visibleScenes, ORDER.length);

  // Scrolling is the reader's move, not the script's: tracking it takes no
  // focus and writes no history entry. Focus is wherever switching to
  // continuous reading left it — that move the reader did make — and scrolling
  // must not disturb it.
  assert.equal(value.focusedBefore, entered, 'the view switch focuses the scene it was made from');
  assert.equal(value.focusedAfter, value.focusedBefore, 'tracking the scroll must not move focus');
  assert.equal(value.hash, `#${entered}`, 'and must not rewrite the address bar as the reader scrolls');

  assert.equal(value.focusedOnLink, true);
  assert.equal(value.afterScrollBack, `sources.html?from=${ORDER[0]}&view=continuous`,
    'scrolling back to the top should follow the reader back');
});

test('leaving continuous reading keeps the passage, not the way in', { skip }, () => {
  // A reader enters continuous reading at one scene, reads on by scrolling,
  // then presses Scene view. Scene view has to open the passage in front of
  // them. Opening the scene they came in at would silently undo the reading
  // they just did -- here, thirty scenes of it.
  const entered = ORDER[4];
  const target = ORDER[34];

  const { value } = essayPage({
    width: 1024,
    height: 900,
    hash: `#${entered}`,
    driver: `
      var report = {};
      probe
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () {
          report.entered = { view: document.documentElement.getAttribute('data-view'), hash: location.hash };
          var scene = probe.q('#${target}');
          window.scrollTo(0, scene.getBoundingClientRect().top + window.scrollY + 10);
        })
        .wait(250)
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () {
          report.afterToggle = {
            view: document.documentElement.getAttribute('data-view'),
            scene: probe.sceneId(),
            hash: location.hash,
            focused: probe.activeId(),
            onScreen: probe.inViewport(probe.q('[data-scene][data-current]')),
            topOfWindow: Math.round(probe.q('[data-scene][data-current]').getBoundingClientRect().top),
            scrolledAsFarAsItGoes: Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1,
            visibleScenes: probe.all('[data-scene]').filter(probe.visible).length,
          };
        })
        .step(function () { probe.q('[data-next]').click(); })
        .step(function () { report.afterNext = probe.sceneId(); })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.entered.view, 'reading');
  assert.equal(value.entered.hash, `#${entered}`);

  assert.equal(value.afterToggle.view, 'beat');
  assert.equal(value.afterToggle.scene, target,
    'Scene view reopened the scene continuous reading was entered at, not the one being read');
  assert.equal(value.afterToggle.hash, `#${target}`, 'and the address bar says so');
  assert.equal(value.afterToggle.visibleScenes, 1);
  assert.equal(value.afterToggle.onScreen, true);
  // Brought to the top of the window, unless the page has already run out of
  // room to scroll -- a short scene near the end of a one-scene document.
  assert.ok(
    value.afterToggle.topOfWindow === 0 || value.afterToggle.scrolledAsFarAsItGoes,
    `the scene sits ${value.afterToggle.topOfWindow}px down a page that could still scroll`,
  );
  assert.equal(value.afterToggle.focused, target, 'and focus moves with the reader, as it does on any move they make');

  // Reading continues from there rather than from where they came in.
  assert.equal(value.afterNext, ORDER[35]);
});

test('the shared control returns to the scrolled-to passage, in continuous mode', { skip }, () => {
  // The other half of the journey: the address the control produced really
  // does bring the reader back to that passage, still reading continuously.
  const target = ORDER[30];
  const { value: back } = sourcesPage({
    width: 1024,
    height: 900,
    query: `?from=${target}&view=continuous`,
    driver: `
      var report = {};
      probe.step(function () { report.href = probe.q('[data-return]').getAttribute('href'); })
        .run(function () { probe.done(report); });`,
  });
  assert.equal(back.href, `index.html?view=continuous#${target}`);

  const { value: restored } = essayPage({
    width: 1024,
    height: 900,
    query: '?view=continuous',
    hash: `#${target}`,
    driver: `
      var report = {};
      probe.step(function () {
        report.view = document.documentElement.getAttribute('data-view');
        report.scrolledTo = probe.inViewport(probe.q('#${target}'));
        report.visibleScenes = probe.all('[data-scene]').filter(probe.visible).length;
      }).run(function () { probe.done(report); });`,
  });
  assert.equal(restored.view, 'reading', 'and comes back reading continuously');
  assert.equal(restored.scrolledTo, true, 'at the passage that was left');
  assert.equal(restored.visibleScenes, ORDER.length);
});

test('a comparison control is not offered where it would do nothing', { skip }, () => {
  // In the continuous view both drawings are shown with their labels, so the
  // buttons have nothing left to switch. Leaving them on screen offers a
  // control that reports a state change and changes nothing a reader can see.
  const scene = content.scenes.find((entry) => entry.visual.control !== null);

  const { value } = essayPage({
    width: 1024,
    height: 900,
    hash: `#${scene.id}`,
    driver: `
      var report = {};
      function snapshot() {
        var figure = probe.q('.art-comparison', probe.q('#${scene.id}'));
        var controls = probe.all('.art-control', figure);
        return {
          view: document.documentElement.getAttribute('data-view'),
          controlVisible: controls.length > 0 && probe.visible(controls[0]),
          buttonsVisible: probe.all('.art-control button', figure).filter(probe.visible).length,
          focusable: probe.all('.art-control button', figure).filter(function (button) {
            return button.getClientRects().length > 0;
          }).length,
          drawingsVisible: probe.all('.art-view', figure).filter(probe.visible).length,
          labelsVisible: probe.all('.art-view-label', figure).filter(probe.visible).map(function (p) { return p.textContent; }),
        };
      }
      probe
        .step(function () { report.inScene = snapshot(); })
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () { report.inContinuous = snapshot(); })
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () { report.backInScene = snapshot(); })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.inScene.view, 'beat');
  assert.equal(value.inScene.controlVisible, true, 'in the scene view the control does something');
  assert.equal(value.inScene.buttonsVisible, 2);
  assert.equal(value.inScene.drawingsVisible, 1, 'one drawing at a time there');

  assert.equal(value.inContinuous.view, 'reading');
  assert.equal(value.inContinuous.controlVisible, false, 'a control that cannot change anything is not offered');
  assert.equal(value.inContinuous.buttonsVisible, 0);
  assert.equal(value.inContinuous.focusable, 0, 'and is out of the keyboard order with it');
  assert.equal(value.inContinuous.drawingsVisible, 2, 'because both drawings are already shown');
  assert.deepEqual(
    value.inContinuous.labelsVisible, scene.visual.control.labels,
    'with the approved state names still on the page, under their own drawings',
  );

  assert.equal(value.backInScene.controlVisible, true, 'and it returns with the scene view');
  assert.equal(value.backInScene.drawingsVisible, 1);
});

test('an optional comparison switches between two drawn states', { skip }, () => {
  const optional = content.scenes.filter((scene) => scene.visual.control !== null);
  for (const scene of optional) {
    const { value } = essayPage({
      width: 1024,
      height: 900,
      hash: `#${scene.id}`,
      driver: `
        var report = {};
        function state() {
          var current = probe.q('[data-scene][data-current]');
          var figure = probe.q('.art-comparison', current);
          return {
            active: figure.getAttribute('data-active'),
            visibleStates: probe.all('.art-view', figure).filter(probe.visible).map(function (view) {
              return view.getAttribute('data-state');
            }),
            pressed: probe.all('.art-control button', figure).map(function (button) { return button.getAttribute('aria-pressed'); }),
            labels: probe.all('.art-control button', figure).map(function (button) { return button.textContent; }),
            paragraphs: probe.all('p.narration, p.line', probe.q('[data-scene][data-current]')).filter(probe.visible).length,
            nextAvailable: probe.visible(probe.q('[data-next]')),
            shownImageLoaded: probe.all('.art-view', figure).filter(probe.visible).every(function (view) {
              var image = probe.q('img', view);
              return image.complete && image.naturalWidth > 0;
            }),
          };
        }
        probe
          .step(function () { report.atFirst = state(); })
          .step(function () {
            probe.all('.art-control button', probe.q('[data-scene][data-current]'))[1].click();
          })
          .step(function () { report.afterClick = state(); })
          .step(function () {
            // Enter and Space are the browser's business: a native button
            // activates on both, and a synthetic key event deliberately does
            // not, so what is checked here is that the control really is one
            // and that a keyboard reader can reach and fire it. click() is
            // what the browser itself dispatches when Enter is pressed.
            var button = probe.all('.art-control button', probe.q('[data-scene][data-current]'))[0];
            report.control = {
              tag: button.tagName,
              type: button.getAttribute('type'),
              role: button.getAttribute('role'),
              group: button.parentNode.getAttribute('role'),
              groupLabel: button.parentNode.getAttribute('aria-label'),
              tabIndex: button.tabIndex,
            };
            button.focus();
            report.reachable = document.activeElement === button;
            report.ring = probe.style(button, 'outlineStyle');
            button.click();
          })
          .step(function () { report.afterKeyboard = state(); report.focusKept = document.activeElement.textContent; })
          .run(function () { probe.done(report); });`,
    });

    const labels = scene.visual.control.labels;
    assert.deepEqual(value.atFirst.labels, labels, `${scene.id} offers different state names`);
    assert.deepEqual(value.atFirst.visibleStates, ['0'], `${scene.id} starts showing one drawing`);
    assert.deepEqual(value.atFirst.pressed, ['true', 'false']);

    assert.equal(value.atFirst.shownImageLoaded, true, `${scene.id}: the first drawing never arrived`);
    assert.deepEqual(value.afterClick.visibleStates, ['1'], `${scene.id} did not switch drawings`);
    assert.equal(value.afterClick.shownImageLoaded, true,
      `${scene.id}: the second drawing was asked for and did not arrive`);
    assert.deepEqual(value.afterClick.pressed, ['false', 'true']);
    assert.equal(value.afterClick.paragraphs, value.atFirst.paragraphs,
      `${scene.id} hides copy behind the control`);
    assert.equal(value.afterClick.nextAvailable, true, 'a comparison never gates progression');

    assert.equal(value.control.tag, 'BUTTON', `${scene.id}'s control is not a native button`);
    assert.equal(value.control.type, 'button');
    assert.equal(value.control.role, null, 'a button needs no role to be a button');
    assert.equal(value.control.group, 'group');
    assert.ok(value.control.groupLabel, 'the pair of controls is named');
    assert.equal(value.control.tabIndex, 0, 'and is in the tab order');
    assert.equal(value.reachable, true, `${scene.id}'s control cannot be reached from the keyboard`);

    assert.deepEqual(value.afterKeyboard.visibleStates, ['0'], `${scene.id} did not switch back`);
    assert.deepEqual(value.afterKeyboard.pressed, ['true', 'false']);
    assert.equal(value.focusKept, labels[0], 'switching a state does not move the reader off the control');
  }
});

/* --- Leaving for a source, and coming back -------------------------------- */

test('a citation leads to the entry it names, and the way back to the scene', { skip }, () => {
  // The first, a middle and the final citing scene, so a return is checked at
  // each end of the essay rather than once in the comfortable middle.
  const citing = ORDER.filter((id) => sceneById.get(id).blocks
    .some((block) => block.parts.some((part) => part.citation)));
  const chosen = [citing[0], citing[Math.floor(citing.length / 2)], citing.at(-1)];

  for (const id of chosen) {
    const number = sceneById.get(id).blocks
      .flatMap((block) => block.parts)
      .find((part) => part.citation).citation;

    // 1. The link in the essay carries the scene and the reading mode.
    const { value: link } = essayPage({
      width: 1024,
      height: 900,
      hash: `#${id}`,
      driver: `
        var report = {};
        probe.step(function () {
          var citation = probe.q('[data-scene][data-current] .citation');
          report.href = citation.getAttribute('href');
          report.label = citation.textContent;
          report.accessibleName = citation.getAttribute('aria-label');
        }).run(function () { probe.done(report); });`,
    });
    assert.equal(link.label, `[${number}]`);
    assert.equal(link.accessibleName, `Source ${number}`);
    assert.equal(link.href, `sources.html?from=${id}&view=scene#${sourceAnchor(number)}`);

    // 2. Following it lands on that entry, ringed and on screen, with a way back.
    const { value: entry } = sourcesPage({
      width: 1024,
      height: 900,
      // The whole address the citation leads to, not just its fragment: the
      // query is what the return control is rewritten from.
      query: `?from=${id}&view=scene`,
      hash: `#${sourceAnchor(number)}`,
      driver: `
        var report = {};
        probe.step(function () {
          var entry = probe.q('#${sourceAnchor(number)}');
          report.focused = probe.activeId();
          report.inViewport = probe.inViewport(entry);
          report.outlineStyle = probe.style(entry, 'outlineStyle');
          report.outlineWidth = probe.style(entry, 'outlineWidth');
          report.returnLabel = probe.q('[data-return]').textContent;
          report.returnHref = probe.q('[data-return]').getAttribute('href');
        }).run(function () { probe.done(report); });`,
    });
    assert.equal(entry.inViewport, true, `entry ${number} was laid out off screen`);
    assert.equal(entry.outlineStyle, 'solid', 'the entry the reader landed on is ringed, not just focused');
    assert.notEqual(entry.outlineWidth, '0px');
    assert.equal(entry.returnLabel, content.sourcesPage.returnLabel);
    assert.equal(entry.returnHref, `index.html#${id}`, `the way back from source ${number} lost the scene`);

    // 3. And the way back restores the scene it was left from.
    const { value: back } = essayPage({
      width: 1024,
      height: 900,
      hash: `#${id}`,
      driver: `
        var report = {};
        probe.step(function () {
          report.view = document.documentElement.getAttribute('data-view');
          report.scene = probe.sceneId();
          report.onScreen = probe.inViewport(probe.q('[data-scene][data-current]'));
        }).run(function () { probe.done(report); });`,
    });
    assert.equal(back.view, 'beat');
    assert.equal(back.scene, id, `returning from source ${number} does not come back to ${id}`);
    assert.equal(back.onScreen, true);
  }
});

test('the return control carries the reading mode, not just the place', { skip }, () => {
  const scene = ORDER.at(-7);

  const { value: fromContinuous } = sourcesPage({
    width: 1024,
    height: 900,
    driver: `
      var report = {};
      probe.step(function () { report.href = probe.q('[data-return]').getAttribute('href'); })
        .run(function () { probe.done(report); });`,
    // The query a citation followed from continuous reading would carry.
    hash: '',
    files: { ...hostedFiles, 'index.html': hosted },
    html: sources.replace('<body>', '<body>'),
  });
  // A direct arrival has no place to return to, so it is offered the essay.
  assert.equal(fromContinuous.href, 'index.html');

  const { value: restored } = essayPage({
    width: 1024,
    height: 900,
    hash: `#${scene}`,
    driver: `
      var report = {};
      probe
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () {
          report.view = document.documentElement.getAttribute('data-view');
          report.citationHref = probe.q('#${scene} .citation')
            ? probe.q('#${scene} .citation').getAttribute('href') : null;
          report.visibleScenes = probe.all('[data-scene]').filter(probe.visible).length;
        })
        .run(function () { probe.done(report); });`,
  });
  assert.equal(restored.view, 'reading');
  assert.equal(restored.visibleScenes, ORDER.length, 'continuous reading shows the whole essay');
});

/* --- Without a script, and on paper --------------------------------------- */

test('a reader with no scripting receives the whole essay as one document', { skip }, () => {
  const report = withoutScriptInChrome({
    html: hosted,
    files: hostedFiles,
    driver: `
      report.jsClass = doc.documentElement.className;
      report.view = doc.documentElement.getAttribute('data-view');
      var scenes = Array.prototype.slice.call(doc.querySelectorAll('[data-scene]'));
      report.scenes = scenes.length;
      report.visibleScenes = scenes.filter(function (scene) { return scene.getClientRects().length > 0; }).length;
      report.visibleChapterTitles = Array.prototype.slice.call(doc.querySelectorAll('.chapter-title'))
        .filter(function (title) { return title.getClientRects().length > 0; }).length;
      report.controlsVisible = doc.querySelector('.reader-controls').getClientRects().length > 0;
      report.comparisonControlsVisible = Array.prototype.slice.call(doc.querySelectorAll('.art-control'))
        .filter(function (control) { return control.getClientRects().length > 0; }).length;
      report.comparisonStatesVisible = Array.prototype.slice.call(doc.querySelectorAll('.art-comparison .art-view'))
        .filter(function (view) { return view.getClientRects().length > 0; }).length;
      report.landingVisible = doc.querySelector('.landing').getClientRects().length > 0;
      report.sourcesLink = doc.querySelector('[data-sources]').getAttribute('href');
      report.text = doc.body.innerText.length;
    `,
  });

  assert.equal(report.jsClass, '', 'the script never ran, so the page is in its scriptless state');
  assert.equal(report.view, null, 'and no view was ever applied');
  assert.equal(report.scenes, ORDER.length);
  assert.equal(report.visibleScenes, ORDER.length, 'every scene reads, because nothing hid any of them');
  assert.equal(report.visibleChapterTitles, content.chapters.length);
  assert.equal(report.landingVisible, true);
  assert.equal(report.controlsVisible, false, 'controls that only work with a script are not shown without one');
  assert.equal(report.comparisonControlsVisible, 0);
  assert.equal(report.comparisonStatesVisible, 4, 'both drawings of both comparisons are simply there');
  assert.equal(report.sourcesLink, 'sources.html', 'and the register is an ordinary link');
  assert.ok(report.text > 20000, `the whole argument should be readable, measured ${report.text} characters`);
});

test('the printed pages carry the argument, not whatever was on screen', { skip }, () => {
  const essay = printInChrome({ html: hosted, files: hostedFiles });
  // 4,137 words of prose and 28 illustrated scenes cannot fit on a handful of
  // pages. A print that had kept the scene view would produce one or two.
  assert.ok(essay.pages >= 20, `the printed essay is ${essay.pages} page(s), which is not the whole argument`);
  assert.ok(essay.bytes > 100_000, `the printed essay is ${essay.bytes} bytes, which carries no drawings`);

  const register = printInChrome({ html: sources, files: hostedFiles });
  assert.ok(register.pages >= 3, `the printed register is ${register.pages} page(s)`);
});

test('a reader who asked for less motion gets the same essay', { skip }, () => {
  const { value } = essayPage({
    width: 1024,
    height: 900,
    flags: ['--force-prefers-reduced-motion=reduce'],
    driver: `
      var report = {};
      probe
        .step(function () { probe.q('[data-begin]').click(); })
        .step(function () {
          var scene = probe.q('[data-scene][data-current]');
          report.scene = probe.sceneId();
          report.visible = probe.visible(scene);
          report.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          report.imageOpacity = probe.style(probe.q('img', scene), 'opacity');
          report.animations = probe.all('*').filter(function (element) {
            return probe.style(element, 'animationName') !== 'none';
          }).length;
        })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.reduced, true, 'the browser was asked for reduced motion');
  assert.equal(value.scene, ORDER[0]);
  assert.equal(value.visible, true);
  assert.equal(value.imageOpacity, '1', 'the drawing is simply there; there is no entrance to suppress');
  assert.equal(value.animations, 0, 'nothing animates, so reduced motion changes nothing');
});

/* --- The project typeface, actually loaded -------------------------------- */

test('the hosted page fetches the project typeface and draws the essay with it', { skip }, () => {
  const { value } = essayPage({
    width: 1024,
    height: 900,
    driver: afterFonts(`
      ${MEASURE_IN}
      report.loaded = [];
      document.fonts.forEach(function (face) {
        report.loaded.push({ family: face.family, status: face.status });
      });
      report.checks = {
        project: document.fonts.check("16px '${PROJECT_FONT.family}'"),
        fallback: document.fonts.check("16px '${FALLBACK_FONT.family}'"),
      };
      var body = probe.q('p.narration');
      report.bodyFamily = probe.style(body, 'fontFamily');
      var sample = body.textContent.slice(0, 60);
      report.widths = {
        project: measureIn(sample, "'${PROJECT_FONT.family}'"),
        fallback: measureIn(sample, "'${FALLBACK_FONT.family}'"),
        asRendered: measureIn(sample, probe.style(body, 'fontFamily')),
      };
    `),
  });

  const project = value.loaded.find((face) => face.family === PROJECT_FONT.family);
  assert.ok(project, 'the project typeface is not among the faces the document loaded');
  assert.equal(project.status, 'loaded', 'the browser fetched it and it arrived');
  assert.equal(value.checks.project, true);
  assert.match(value.bodyFamily, new RegExp(PROJECT_FONT.family));

  // Measured, not assumed: the text as rendered is the width of the project
  // typeface and not of the fallback, which is what proves the face is really
  // the one setting the essay.
  assert.notEqual(value.widths.project, value.widths.fallback, 'the two faces should not measure identically');
  assert.equal(value.widths.asRendered, value.widths.project, 'the essay is set in the project typeface');
});

test('the project typeface comes from this site and nowhere else', { skip }, () => {
  const { value } = essayPage({
    width: 1024,
    height: 900,
    // Reading the rules of a stylesheet a `file:` page fetched is a
    // cross-origin read without this; the question is about the real hosted
    // stylesheet, so the browser is allowed to answer it.
    flags: ['--allow-file-access-from-files'],
    driver: afterFonts(`
      report.sources = [];
      var sheet = Array.prototype.slice.call(document.styleSheets).filter(function (candidate) {
        return (candidate.href || '').indexOf('styles.css') >= 0;
      })[0];
      Array.prototype.slice.call(sheet.cssRules).forEach(function (rule) {
        if (rule.constructor.name !== 'CSSFontFaceRule') return;
        report.sources.push({
          family: rule.style.getPropertyValue('font-family').replace(/['"]/g, ''),
          src: rule.style.getPropertyValue('src'),
          display: rule.style.getPropertyValue('font-display'),
        });
      });
    `),
  });

  const project = value.sources.find((face) => face.family === PROJECT_FONT.family);
  assert.ok(project, 'the stylesheet the browser parsed declares the project typeface');
  assert.ok(project.src.includes(PROJECT_FONT.published), 'from this site');
  assert.ok(!project.src.includes('local('), 'and never from whatever the reader happens to have installed');
  assert.ok(!/https?:/.test(project.src), 'and from no third party');
  assert.equal(project.display, 'swap');
});

test('the prose holds its measure in the real face, at both widths', { skip }, () => {
  for (const [width, maximum] of [[375, 375], [1200, 1200]]) {
    const { value } = essayPage({
      width,
      height: 900,
      driver: afterFonts(`
        report.paragraphs = probe.all('p.narration').slice(0, 12).map(function (paragraph) {
          var box = paragraph.getBoundingClientRect();
          return { width: Math.round(box.width), font: probe.style(paragraph, 'fontFamily') };
        });
        report.viewport = document.documentElement.clientWidth;
      `),
    });

    assert.ok(value.paragraphs.length > 0);
    for (const paragraph of value.paragraphs) {
      assert.ok(paragraph.width <= maximum, `a paragraph is ${paragraph.width}px wide in a ${maximum}px window`);
      assert.match(paragraph.font, new RegExp(PROJECT_FONT.family), 'set in the project typeface at every width');
    }
    if (width === 1200) {
      // A line that runs the full width of a wide window is unreadable; the
      // measure is what keeps it to something a reader's eye can track.
      const widest = Math.max(...value.paragraphs.map((paragraph) => paragraph.width));
      assert.ok(widest < 900, `the prose runs ${widest}px wide on a wide screen`);
    }
  }
});
