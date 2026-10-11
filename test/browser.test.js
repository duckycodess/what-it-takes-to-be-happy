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
  for (const [path, bytes] of [...built.artwork, ...built.uiArtwork]) hostedFiles[path] = bytes;
}

const hosted = built ? built.hosted : '';
const sources = built ? built.sources : '';

/*
 * The scratch transition draws only once its sprite sheet has loaded, and a
 * page without the sheet moves at once. Every other test here is given the
 * page without it, so the moves they make are not spread over 1.6 seconds of
 * a virtual clock with an 8-second budget; these tests are given the sheet and
 * its sounds, and watch the transition itself.
 */
const scratchFiles = {
  ...hostedFiles,
  ...(built ? Object.fromEntries(built.trust) : {}),
};

/** Counts the interval timers a page leaves running. */
const COUNT_INTERVALS = `
  var running = {};
  var setI = window.setInterval, clearI = window.clearInterval;
  window.setInterval = function () { var id = setI.apply(window, arguments); running[id] = true; return id; };
  window.clearInterval = function (id) { delete running[id]; return clearI.call(window, id); };
  var intervals = function () { return Object.keys(running).length; };
`;

test('a move is scribbled over, made underneath, then rubbed out to reveal the next passage', { skip }, () => {
  const { value } = runInChrome({ html: hosted, files: scratchFiles, width: 1280, driver: `
    ${COUNT_INTERVALS}
    var report = {};
    var scratcher = probe.q('[data-scratcher]');
    var column = function () { return scratcher.style.backgroundPosition.split(' ')[0]; };
    probe
      .wait(300)
      .step(function () {
        report.sheetLoaded = scratcher.style.backgroundImage.indexOf('assets/ui/trust/scratch.png') >= 0;
        probe.q('[data-begin]').click();
        report.beginCovers = !scratcher.hidden;
        report.beginWaits = document.documentElement.getAttribute('data-view') === 'landing';
      })
      .wait(1000)
      .step(function () {
        // Revealing the essay after the landing: the rail has appeared and
        // the cover has moved off it to the reading area.
        report.beginRevealClear = !scratcher.hidden
          && scratcher.getBoundingClientRect().left >= probe.q('.chapter-rail').getBoundingClientRect().right;
      })
      .wait(700)
      .step(function () {
        report.beginArrived = probe.sceneId();
        report.beginCleared = scratcher.hidden;
        probe.q('[data-next]').click();
        report.erasing = !scratcher.hidden && column() === '0%';
        report.notYetMoved = probe.sceneId();
        var box = scratcher.getBoundingClientRect();
        report.railClear = box.left >= probe.q('.chapter-rail').getBoundingClientRect().right;
        report.footerClear = box.bottom <= probe.q('.reader-controls').getBoundingClientRect().top + 1;
        report.withinWindow = box.top >= 0 && box.right <= innerWidth;
        report.sheetScale = getComputedStyle(scratcher).backgroundSize;
        // A second press while the page is being drawn over is ignored, as in
        // the original, rather than queued or allowed to start another.
        probe.q('[data-next]').click();
        report.layers = probe.all('[data-scratcher]').length;
      })
      .wait(400)
      .step(function () {
        report.midErase = { scene: probe.sceneId(), column: column(), row: scratcher.style.backgroundPosition.split(' ')[1] };
      })
      .wait(500)
      .step(function () {
        report.revealing = { scene: probe.sceneId(), column: column(), covered: !scratcher.hidden, focus: probe.activeId() };
      })
      .wait(900)
      .step(function () {
        report.done = { scene: probe.sceneId(), cleared: scratcher.hidden, intervals: intervals(), layers: probe.all('[data-scratcher]').length };
      })
      .run(function () { probe.done(report); });
  ` });

  assert.equal(value.sheetLoaded, true, 'the original sheet is preloaded and set');
  assert.equal(value.beginRevealClear, true, 'the reveal after Begin stays off the rail');
  assert.equal(value.beginCovers, true, 'Begin is a move like any other');
  assert.equal(value.beginWaits, true, 'the landing stays until it is covered');
  assert.equal(value.beginArrived, ORDER[0]);
  assert.equal(value.beginCleared, true);
  assert.equal(value.erasing, true, 'the left column scribbles over the page');
  assert.equal(value.notYetMoved, ORDER[0], 'nothing changes before the page is covered');
  assert.equal(value.railClear, true, 'the rail is not drawn over');
  assert.equal(value.footerClear, true, 'Back and Next are not drawn over');
  assert.equal(value.withinWindow, true);
  assert.equal(value.sheetScale, '200% 2000%');
  assert.equal(value.layers, 1, 'one overlay, however often a move is asked for');
  assert.equal(value.midErase.scene, ORDER[0]);
  assert.equal(value.midErase.column, '0%');
  assert.notEqual(value.midErase.row, '0%', 'frames advance');
  assert.deepEqual(value.revealing, { scene: ORDER[1], column: '-100%', covered: true, focus: ORDER[1] },
    'the move is made under cover and the right column reveals it');
  assert.deepEqual(value.done, { scene: ORDER[1], cleared: true, intervals: 0, layers: 1 },
    'the repeated press did not move twice, and nothing is left behind');
});

test('sound starts on, buttons click and each scratch starts 100 ms into its phase, quietly, until the speaker turns it off', { skip }, () => {
  const { value } = runInChrome({ html: hosted, files: scratchFiles, width: 1280,
    flags: ['--autoplay-policy=no-user-gesture-required'], driver: `
    var report = { played: [] };
    var scratcher = probe.q('[data-scratcher]');
    var speaker = probe.q('[data-sound]');
    var started = 0;
    // Recorded rather than heard. A page opened from disk cannot fetch the
    // recordings, so it plays them through audio elements.
    HTMLMediaElement.prototype.play = function () {
      report.played.push({ file: this.src.split('/').pop(), at: Math.round(performance.now() - started), column: scratcher.style.backgroundPosition.split(' ')[0], volume: this.volume });
      return Promise.resolve();
    };
    probe
      .wait(300)
      .step(function () {
        report.startsOn = speaker.getAttribute('aria-pressed');
        report.name = speaker.textContent.trim();
        var icon = probe.q('.sound-icon', speaker);
        report.icon = { image: probe.style(icon, 'backgroundImage').indexOf('assets/ui/trust/sound.png') >= 0, x: probe.style(icon, 'backgroundPositionX'), width: icon.getBoundingClientRect().width };
        report.button = { border: probe.style(speaker, 'borderTopStyle'), background: probe.style(speaker, 'backgroundColor'), width: speaker.getBoundingClientRect().width };
        started = performance.now();
        probe.q('[data-begin]').click();
      })
      .wait(1700)
      .step(function () {
        speaker.click();
        report.turnedOff = speaker.getAttribute('aria-pressed');
        report.offIcon = probe.style(probe.q('.sound-icon', speaker), 'backgroundPositionX');
        report.playedWhileOn = report.played.length;
        probe.q('[data-next]').click();
      })
      .wait(1700)
      .step(function () { report.playedWhileOff = report.played.length - report.playedWhileOn; })
      .run(function () { probe.done(report); });
  ` });

  assert.equal(value.startsOn, 'true', 'sound is on until the reader turns it off');
  assert.equal(value.name, 'Sound', 'the approved label is the accessible name');
  assert.deepEqual(value.icon, { image: true, x: '0px', width: 40 }, "Trust's speaker, its waves half");
  assert.deepEqual(value.button, { border: 'none', background: 'rgba(0, 0, 0, 0)', width: 44 }, 'an icon, not a boxed button');
  const clicks = value.played.filter((entry) => entry.file.startsWith('button'));
  const scratches = value.played.filter((entry) => entry.file.startsWith('scratch'));
  assert.equal(clicks.length, 1, 'Begin clicks once');
  assert.match(clicks[0].file, /^button[123]\.mp3$/, "one of Trust's three button clicks");
  assert.ok(clicks[0].at < 20, `the click is immediate, at ${clicks[0].at} ms`);
  assert.deepEqual(scratches.map((entry) => [entry.file, entry.column]),
    [['scratch_in.mp3', '0%'], ['scratch_out.mp3', '-100%']]);
  assert.deepEqual([...new Set(value.played.map((entry) => entry.volume))], [0.3], 'every clip plays at 30% of full volume');
  const [scribble, rub] = scratches.map((entry) => entry.at);
  assert.ok(scribble >= 100 && scribble < 140, `scratch_in at ${scribble} ms`);
  assert.ok(rub >= 900 && rub < 960, `scratch_out at ${rub} ms`);
  assert.equal(value.turnedOff, 'false');
  assert.equal(value.offIcon, '100%', 'the crossed-out half');
  assert.equal(value.playedWhileOff, 0, 'nothing plays once it is off');
});

test('a phone gets the transition over the passage alone, and other moves are not held up by it', { skip }, () => {
  const { value } = runInChrome({ html: hosted, files: scratchFiles, width: 360, height: 780, hash: `#${ORDER[3]}`, driver: `
    ${COUNT_INTERVALS}
    var report = {};
    var scratcher = probe.q('[data-scratcher]');
    probe
      .wait(300)
      .step(function () {
        probe.q('[data-next]').click();
        var box = scratcher.getBoundingClientRect();
        var body = probe.q('.essay-body').getBoundingClientRect();
        report.spansPassage = Math.abs(box.left - body.left) < 1 && Math.abs(box.right - body.right) < 1;
        report.footerClear = box.bottom <= probe.q('.reader-controls').getBoundingClientRect().top + 1;
        report.launcherAbove = Number(getComputedStyle(probe.q('.rail-launcher')).zIndex) > Number(getComputedStyle(scratcher).zIndex);
      })
      .wait(300)
      .step(function () {
        // Printing mid-transition finishes the move rather than dropping it.
        window.dispatchEvent(new Event('beforeprint'));
        report.printed = { scene: probe.sceneId(), cleared: scratcher.hidden, intervals: intervals() };
        probe.q('[data-next]').click();
      })
      .wait(300)
      .step(function () {
        // Switching to continuous reading mid-transition supersedes it.
        probe.q('[data-view-toggle]').click();
        report.superseded = {
          view: document.documentElement.getAttribute('data-view'),
          cleared: scratcher.hidden,
          intervals: intervals(),
          scenes: probe.all('[data-scene]').filter(probe.visible).length
        };
      })
      .wait(1600)
      .step(function () {
        report.stillContinuous = document.documentElement.getAttribute('data-view');
        report.stillCleared = scratcher.hidden;
      })
      .run(function () { probe.done(report); });
  ` });

  assert.equal(value.spansPassage, true);
  assert.equal(value.footerClear, true);
  assert.equal(value.launcherAbove, true, 'the Chapters launcher is not drawn over');
  assert.deepEqual(value.printed, { scene: ORDER[4], cleared: true, intervals: 0 });
  assert.deepEqual(value.superseded, { view: 'reading', cleared: true, intervals: 0, scenes: 31 });
  assert.equal(value.stillContinuous, 'reading', 'the abandoned move is never made');
  assert.equal(value.stillCleared, true);
});

test('Sources keeps its way back on screen, scrollbars are not drawn, and the landing credits the authors', { skip }, () => {
  for (const width of [360, 1280]) {
    const { value: page } = runInChrome({ html: sources, files: hostedFiles, width, height: 780, driver: `
      var report = {};
      var back = probe.q('[data-return]');
      probe
        .step(function () {
          report.atTop = probe.inViewport(back);
          report.scrollbar = probe.style(document.documentElement, 'scrollbarWidth');
          report.long = document.documentElement.scrollHeight > innerHeight * 2;
          scrollTo(0, document.documentElement.scrollHeight);
        })
        .step(function () {
          report.scrolled = scrollY > 0;
          report.atBottom = probe.inViewport(back);
          var last = probe.all('.source').pop().getBoundingClientRect();
          report.lastEntryClear = last.bottom <= back.getBoundingClientRect().top + 1;
          report.notes = probe.all('.source-note').length;
        })
        .run(function () { probe.done(report); });
    ` });
    assert.deepEqual(page, { atTop: true, scrollbar: 'none', long: true, scrolled: true, atBottom: true, lastEntryClear: true, notes: 0 },
      `Sources at ${width}px`);
  }

  const { value: landing } = essayPage({ width: 360, driver: `
    var credit = probe.q('.landing-credit');
    probe.done({ lines: credit.innerText.split('\\n'), visible: probe.visible(credit) });
  ` });
  assert.equal(landing.visible, true);
  assert.deepEqual(landing.lines, content.landing.credit.map((line) => line.map((part) => part.text).join('')), 'two lines');
});

test('hiding the chapters gives the passage the room, and the rail never clips its own controls', { skip }, () => {
  const { value } = essayPage({ width: 1280, height: 800, hash: `#${ORDER[2]}`, driver: `
    var report = {};
    var rail = probe.q('.chapter-rail');
    var toggle = probe.q('[data-rail-toggle]');
    probe
      .step(function () {
        // The toggle as it is drawn on hover or focus: grown, with its ring.
        toggle.style.transform = 'scale(1.02)';
        var box = toggle.getBoundingClientRect(), edge = rail.getBoundingClientRect();
        var ring = 6;
        report.ringInsideRail = box.left - ring >= edge.left && box.top - ring >= edge.top;
        report.continuousShown = probe.visible(probe.q('[data-view-toggle]'));
        // A marked chapter and its first part are separate highlights.
        var chapter = probe.q('.rail-chapter-link[aria-current]').getBoundingClientRect();
        var first = probe.q('.rail-chapter-link[aria-current]').closest('.rail-chapter').querySelector('.rail-parts a').getBoundingClientRect();
        report.highlightGap = Math.round(first.top - chapter.bottom);
        toggle.style.transform = '';
        toggle.click();
      })
      .step(function () {
        var body = probe.q('.essay-body').getBoundingClientRect();
        var art = probe.q('[data-current] > .art').getBoundingClientRect();
        var prose = probe.q('[data-current] p').getBoundingClientRect();
        report.centred = Math.abs((body.left + body.right) / 2 - innerWidth / 2) < 2;
        report.artWidth = Math.round(art.width);
        report.gap = Math.round(art.left - prose.right);
      })
      .run(function () { probe.done(report); });
  ` });
  assert.equal(value.ringInsideRail, true, 'a grown, focused Hide chapters is not cut off');
  assert.equal(value.continuousShown, false, 'Read continuously is deferred');
  assert.ok(value.highlightGap >= 4, `chapter and first part highlights are ${value.highlightGap}px apart`);
  assert.equal(value.centred, true, 'the passage and its drawing are centred');
  assert.equal(value.artWidth, 416, 'the drawing takes the wider 26rem column');
  assert.ok(value.gap >= 30 && value.gap <= 50, `the drawing sits beside the prose, ${value.gap}px away`);
});

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
      railVisible: probe.visible(probe.q('.chapter-rail')),
      launcherVisible: probe.visible(probe.q('.rail-launcher')),
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
      launcherBottom: Math.round(probe.q('.rail-launcher').getBoundingClientRect().bottom),
      hash: location.hash,
      backVisible: probe.visible(probe.q('[data-back]')),
      nextVisible: probe.visible(probe.q('[data-next]')),
      readAgainVisible: probe.visible(probe.q('[data-read-again]')),
      launcherVisible: probe.visible(probe.q('.rail-launcher')),
      railVisible: probe.visible(probe.q('.chapter-rail')),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      footerControls: probe.all('.reader-controls button, .reader-controls .button')
        .filter(probe.visible)
        .map(function (control) { return control.textContent.trim(); }),
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
  .step(function () { probe.q('[data-rail-restore]').click(); })
  .step(function () {
    report.drawerOpen = {
      rail: document.documentElement.getAttribute('data-rail'),
      railVisible: probe.visible(probe.q('.chapter-rail')),
      coversTheScene: probe.q('.chapter-rail').getBoundingClientRect().height
        >= document.documentElement.clientHeight * 0.8,
      focusedInside: probe.q('.chapter-rail').contains(document.activeElement),
      partsReachable: probe.all('[data-part-link]').filter(probe.visible).length,
    };
  })
  .step(function () { probe.q('[data-chapter-link="c6"]').click(); })
  .step(function () {
    report.afterChapterJump = {
      scene: probe.sceneId(),
      hash: location.hash,
      rail: document.documentElement.getAttribute('data-rail'),
      railVisible: probe.visible(probe.q('.chapter-rail')),
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
  assert.equal(value.landing.railVisible, false, 'the approved landing lists no chapter navigation');
  assert.equal(value.landing.launcherVisible, false, 'nor a way to open it');
  assert.equal(value.landing.title, content.landing.title);
  assert.deepEqual(value.landing.actions, ['Begin', 'Sources & Credits']);
  assert.equal(value.landing.horizontalOverflow, 0, 'the landing does not scroll sideways at 375px');

  assert.equal(value.firstScene.view, 'beat');
  assert.equal(value.firstScene.scene, ORDER[0]);
  assert.equal(value.firstScene.onlyCurrentVisible, 1, 'one scene is on screen at a time');
  // At phone width the launcher is fixed across the top of the window, so the
  // scene stops under it rather than behind it. That is the whole point of
  // the scroll margin; a scene at 0 would be reading its first line through
  // the launcher.
  assert.equal(value.firstScene.launcherVisible, true, 'a phone needs the way into the chapter drawer');
  assert.equal(value.firstScene.railVisible, false, 'and the drawer itself starts shut');
  assert.ok(value.firstScene.topOfWindow >= value.firstScene.launcherBottom,
    `the scene's first line is ${value.firstScene.launcherBottom - value.firstScene.topOfWindow}px behind the launcher`);
  assert.ok(value.firstScene.topOfWindow - value.firstScene.launcherBottom <= 12,
    `the scene starts ${value.firstScene.topOfWindow}px down with the launcher ending at ${value.firstScene.launcherBottom}`);
  assert.equal(value.firstScene.hash, `#${ORDER[0]}`);
  assert.equal(value.firstScene.backVisible, true);
  assert.equal(value.firstScene.nextVisible, true);
  assert.equal(value.firstScene.readAgainVisible, false, 'Read again belongs at the end, not the beginning');
  assert.deepEqual(value.firstScene.footerControls, [content.interface.back, content.interface.next],
    'the reading footer carries Back and Next and nothing else');
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
    Math.abs(value.afterNext.topOfWindow - value.firstScene.topOfWindow) <= 1 || value.afterNext.scrolledAsFarAsItGoes,
    `the scene sits ${value.afterNext.topOfWindow}px down a page that could still scroll`,
  );
  assert.equal(value.afterNext.horizontalOverflow, 0);

  // The drawer: opened from the launcher, covering the reading column, with
  // focus inside it and every part of the current chapter reachable.
  assert.equal(value.drawerOpen.rail, 'open');
  assert.equal(value.drawerOpen.railVisible, true);
  assert.equal(value.drawerOpen.coversTheScene, true, 'a drawer that covers nothing is not a drawer');
  assert.equal(value.drawerOpen.focusedInside, true, 'opening the drawer left focus behind it');
  assert.ok(value.drawerOpen.partsReachable > 0, 'the drawer offers no parts to choose');

  const chapterSix = content.chapters.find((chapter) => chapter.id === 'c6');
  assert.equal(value.afterChapterJump.scene, chapterSix.sceneIds[0]);
  assert.equal(value.afterChapterJump.hash, `#${chapterSix.sceneIds[0]}`);
  assert.equal(value.afterChapterJump.rail, 'closed', 'the drawer stayed over the scene it navigated to');
  assert.equal(value.afterChapterJump.railVisible, false);
  assert.equal(value.afterChapterJump.visibleScenes, 1);

  assert.equal(value.continuous.view, 'reading');
  assert.equal(value.continuous.toggleLabel, content.interface.partView);
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
        report.readAgainInFooter = probe.q('.reader-controls [data-read-again]') !== null;
        report.sources = probe.q('[data-sources]').getAttribute('href');
      }).run(function () { probe.done(report); });`,
  });

  assert.equal(value.scene, last);
  assert.equal(value.nextVisible, false, 'there is nothing after the last scene');
  assert.equal(value.backVisible, true);
  assert.equal(value.readAgain, `#${ORDER[0]}`);
  assert.equal(value.readAgainInFooter, false, 'the footer carries Back and Next alone');
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

test('focus moves with the reader, and the keyboard still sees where it went', { skip }, () => {
  const { value } = essayPage({
    width: 1024,
    height: 900,
    driver: `
      var report = {};
      function ring(element) {
        return {
          id: element.getAttribute('data-scene') || element.getAttribute('id'),
          style: probe.style(element.querySelector('.scene-title') || element, 'outlineStyle'),
          width: probe.style(element.querySelector('.scene-title') || element, 'outlineWidth'),
          focusVisible: element.matches(':focus-visible'),
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
        .step(function () { probe.q('[data-part-link="${ORDER.at(-2)}"]').click(); })
        .step(function () { report.afterPart = { scene: probe.sceneId(), focused: ring(document.activeElement) }; })
        .run(function () { probe.done(report); });`,
  });

  // Every move puts focus on the scene it opened, which is what announces the
  // move once to a reader who is listening.
  assert.equal(value.afterBegin.id, ORDER[0], 'Begin moves focus into the scene it opened');
  assert.equal(value.afterNext.id, ORDER[1]);
  assert.equal(value.afterArrowRight.scene, ORDER[2], 'the arrow keys walk the scenes');
  assert.equal(value.afterArrowRight.focused.id, ORDER[2]);
  assert.equal(value.afterArrowLeft, ORDER[1]);

  const chapterEight = content.chapters.find((chapter) => chapter.id === 'c8');
  assert.equal(value.afterChapterJump.id, chapterEight.sceneIds[0]);
  assert.equal(value.afterPart.scene, ORDER.at(-2), 'a part in the rail opens its own passage');
  assert.equal(value.afterPart.focused.id, ORDER.at(-2));

  // A keyboard reader has no pointer to tell them where they are, so the ring
  // is still painted when the browser judges the move to be a keyboard one.
  assert.equal(value.afterArrowRight.focused.focusVisible, true);
  assert.equal(value.afterArrowRight.focused.style, 'solid', 'the keyboard move is painted');
  assert.notEqual(value.afterArrowRight.focused.width, '0px');
});

test('keyboard passage focus marks its title without outlining the whole scene', { skip }, () => {
  // The honest limit of this harness, stated rather than worked around: every
  // click it can make is `element.click()`, which is a script call and not a
  // pointer interaction, so Chrome keeps its keyboard modality and reports
  // `:focus-visible` for the scene afterwards. A real mouse press would not,
  // and driving one needs a DevTools socket this setup cannot open -- see
  // test/support/chrome.js.
  //
  // What can be checked for real, in the browser that parsed the file, is the
  // rule that decides it: after the 11 October amendment there is no rule
  // ringing `.scene:focus`, so whether a scene is outlined is entirely the
  // browser's `:focus-visible` judgement rather than something this
  // stylesheet forces on every move. The pointer case is that judgement.
  const { value } = essayPage({
    width: 1024,
    height: 900,
    flags: ['--allow-file-access-from-files'],
    driver: `
      var report = { outlining: [] };
      probe.step(function () {
        var sheet = Array.prototype.slice.call(document.styleSheets).filter(function (candidate) {
          return (candidate.href || '').indexOf('styles.css') >= 0;
        })[0];
        report.read = !!sheet;
        Array.prototype.slice.call(sheet.cssRules).forEach(function (rule) {
          if (rule.constructor.name !== 'CSSStyleRule') return;
          if (!rule.style.getPropertyValue('outline')) return;
          report.outlining.push(rule.selectorText);
        });
      }).run(function () { probe.done(report); });`,
  });

  assert.equal(value.read, true, 'the browser could not read the stylesheet it parsed');
  const outlining = value.outlining.flatMap((selector) => selector.split(',').map((part) => part.trim()));
  assert.ok(!outlining.includes('.scene:focus'), `a rule still forces a ring on every scene: ${outlining.join(', ')}`);
  assert.ok(!outlining.includes('.scene:focus-visible'),
    'a deep link or a return from Sources would ring the whole scene');
  const sceneRing = outlining.find((selector) => selector.endsWith('.scene:focus-visible .scene-title'));
  assert.ok(sceneRing, 'a keyboard reader lost the ring entirely');
  assert.match(sceneRing, /\[data-move="keyboard"\]/);
  assert.ok(outlining.includes('.source:focus'), 'a citation no longer marks the entry it landed on');
  assert.ok(outlining.includes(':focus-visible'), 'interactive controls lost their focus ring');
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

/* --- The chapter rail, in both arrangements ------------------------------- */

test('on a wide screen the rail stands beside the essay and collapses out of it', { skip }, () => {
  const scene = ORDER[20];
  const { value } = essayPage({
    width: 1280,
    height: 900,
    hash: `#${scene}`,
    driver: `
      var report = {};
      function shape(label) {
        var rail = probe.q('.chapter-rail');
        var current = probe.q('[data-scene][data-current]');
        var paragraph = probe.q('p.narration, p.line', current);
        return {
          label: label,
          rail: document.documentElement.getAttribute('data-rail'),
          railVisible: probe.visible(rail),
          railLeft: probe.visible(rail) ? Math.round(rail.getBoundingClientRect().left) : null,
          railRight: probe.visible(rail) ? Math.round(rail.getBoundingClientRect().right) : null,
          launcherVisible: probe.visible(probe.q('.rail-launcher')),
          proseLeft: Math.round(paragraph.getBoundingClientRect().left),
          proseWidth: Math.round(paragraph.getBoundingClientRect().width),
          sceneOnScreen: probe.inViewport(current),
          scene: probe.sceneId(),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          expanded: probe.all('[data-chapter-toggle]')
            .filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })
            .map(function (b) { return b.getAttribute('data-chapter-toggle'); }),
          currentPart: probe.q('[data-part-link][aria-current]')
            ? probe.q('[data-part-link][aria-current]').getAttribute('data-part-link') : null,
          partsReachable: probe.all('[data-part-link]').filter(probe.visible).length,
        };
      }
      probe
        .step(function () { report.open = shape('open'); })
        .step(function () { probe.q('[data-rail-toggle]').click(); })
        .step(function () {
          report.collapsed = shape('collapsed');
          report.focusedOnLauncher = document.activeElement === probe.q('[data-rail-restore]');
          report.restoreExpanded = probe.q('[data-rail-restore]').getAttribute('aria-expanded');
        })
        .step(function () { probe.q('[data-rail-restore]').click(); })
        .step(function () {
          report.restored = shape('restored');
          report.focusedInRail = probe.q('.chapter-rail').contains(document.activeElement);
        })
        .run(function () { probe.done(report); });`,
  });

  // Open: a column of navigation to the left of a column of prose.
  assert.equal(value.open.rail, 'open');
  assert.equal(value.open.railVisible, true);
  assert.equal(value.open.launcherVisible, false, 'the way back is not offered while the rail is there');
  assert.ok(value.open.railRight <= value.open.proseLeft,
    `the rail overlaps the prose: rail ends at ${value.open.railRight}, prose starts at ${value.open.proseLeft}`);
  assert.equal(value.open.overflow, 0);

  // Only the chapter being read is expanded, and the part being read is marked.
  assert.deepEqual(value.open.expanded, [sceneById.get(scene).chapterId]);
  assert.equal(value.open.currentPart, scene);
  assert.equal(value.open.partsReachable,
    content.chapters.find((chapter) => chapter.id === sceneById.get(scene).chapterId).sceneIds.length,
    'a collapsed chapter should offer no parts to tab through');

  // Collapsed: the rail's column goes, the launcher appears, and the reader
  // is still looking at the scene they were reading.
  assert.equal(value.collapsed.rail, 'closed');
  assert.equal(value.collapsed.railVisible, false);
  assert.equal(value.collapsed.partsReachable, 0, 'a collapsed rail is out of the keyboard order with it');
  assert.equal(value.collapsed.launcherVisible, true);
  assert.equal(value.restoreExpanded, 'false', 'the restore control misreports the rail as open');
  assert.equal(value.focusedOnLauncher, true, 'collapsing the rail dropped focus to the body');
  assert.equal(value.collapsed.scene, scene);
  assert.equal(value.collapsed.sceneOnScreen, true, 'the reflow left the scene off screen');
  assert.ok(value.collapsed.proseLeft < value.open.proseLeft, 'the essay did not take the room the rail gave up');
  assert.equal(value.collapsed.overflow, 0);

  // Restored, with focus on the control that closes it again.
  assert.equal(value.restored.rail, 'open');
  assert.equal(value.restored.railVisible, true);
  assert.equal(value.restored.launcherVisible, false);
  assert.equal(value.focusedInRail, true);
  assert.equal(value.restored.scene, scene);
  assert.equal(value.restored.sceneOnScreen, true);
});

test('at phone width the drawer opens, dismisses on Escape, and gives focus back', { skip }, () => {
  const scene = content.scenes.find((entry) => entry.blocks.some((block) => block.parts.some((part) => part.citation))).id;
  const { value } = essayPage({
    width: 375,
    height: 780,
    hash: `#${scene}`,
    driver: `
      var report = {};
      function shape() {
        var rail = probe.q('.chapter-rail');
        return {
          rail: document.documentElement.getAttribute('data-rail'),
          railVisible: probe.visible(rail),
          launcherVisible: probe.visible(probe.q('.rail-launcher')),
          partsReachable: probe.all('[data-part-link]').filter(probe.visible).length,
          scene: probe.sceneId(),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      }
      probe
        .step(function () { report.shut = shape(); })
        .step(function () { probe.q('[data-rail-restore]').click(); })
        .step(function () {
          report.opened = shape();
          report.focusedInside = probe.q('.chapter-rail').contains(document.activeElement);
          report.closeIsInside = probe.q('.chapter-rail [data-rail-toggle]') !== null;
          // What the drawer covers must not be reachable behind it. The
          // browser's own inert attribute is the guard; this is whether the
          // browser honours it, which no assertion about the attribute can
          // answer.
          var inside = document.activeElement;
          probe.q('[data-next]').focus();
          report.footerTookFocus = document.activeElement === probe.q('[data-next]');
          probe.q('.citation').focus();
          report.essayTookFocus = document.activeElement === probe.q('.citation');
          report.focusStayedInside = probe.q('.chapter-rail').contains(document.activeElement);
          inside.focus();
          var box = probe.q('.chapter-rail').getBoundingClientRect();
          report.covers = Math.round(box.width) >= document.documentElement.clientWidth
            && Math.round(box.height) >= document.documentElement.clientHeight * 0.8;
          report.rowHeights = probe.all('.chapter-rail a').filter(probe.visible)
            .map(function (link) { return Math.round(link.getBoundingClientRect().height); });
        })
        .step(function () {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        })
        .step(function () {
          report.afterEscape = shape();
          report.focusedOnTrigger = document.activeElement === probe.q('[data-rail-restore]');
        })
        .step(function () { probe.q('[data-rail-restore]').click(); })
        .step(function () { probe.q('[data-rail-toggle]').click(); })
        .step(function () {
          report.afterCloseControl = shape();
          report.focusedOnTriggerAgain = document.activeElement === probe.q('[data-rail-restore]');
        })
        .step(function () { probe.q('[data-rail-restore]').click(); })
        .step(function () { probe.q('[data-part-link="${ORDER.at(-4)}"]').click(); })
        .step(function () {
          report.afterPart = shape();
          report.focusedOnScene = document.activeElement === probe.q('#${ORDER.at(-4)}');
        })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.shut.rail, 'closed');
  assert.equal(value.shut.railVisible, false, 'the drawer starts shut on a phone');
  assert.equal(value.shut.launcherVisible, true, 'and the way in is on screen');
  assert.equal(value.shut.partsReachable, 0, 'a shut drawer must not be tabbable');

  assert.equal(value.opened.rail, 'open');
  assert.equal(value.opened.railVisible, true);
  assert.equal(value.covers, true, 'the drawer should cover the reading column, not sit in the margin');
  assert.equal(value.opened.launcherVisible, false, 'the same word must not be offered twice at once');
  assert.equal(value.closeIsInside, true, 'the control that closes the drawer is inside it');
  assert.equal(value.focusedInside, true, 'opening the drawer left focus behind it');
  assert.equal(value.footerTookFocus, false, 'the reading footer is reachable behind the open drawer');
  assert.equal(value.essayTookFocus, false, 'the covered essay is reachable behind the open drawer');
  assert.equal(value.focusStayedInside, true, 'focus escaped the drawer onto something covered');
  assert.ok(value.opened.partsReachable > 0);
  assert.equal(value.opened.overflow, 0, 'the drawer scrolls the page sideways');
  for (const height of value.rowHeights) {
    assert.ok(height >= 44, `a drawer row is ${height}px tall, under the 44px a fingertip needs`);
  }

  assert.equal(value.afterEscape.rail, 'closed', 'Escape did not dismiss the drawer');
  assert.equal(value.focusedOnTrigger, true, 'Escape dropped focus instead of returning it');
  assert.equal(value.afterEscape.scene, scene, 'and dismissing is not a move through the essay');

  assert.equal(value.afterCloseControl.rail, 'closed');
  assert.equal(value.focusedOnTriggerAgain, true);

  assert.equal(value.afterPart.rail, 'closed', 'choosing a part left the drawer over the destination');
  assert.equal(value.afterPart.scene, ORDER.at(-4));
  assert.equal(value.focusedOnScene, true, 'and focus belongs on the destination, not the trigger');
});

/* --- A drawing beside the passage, and prose at a measure ----------------- */

test('on a wide screen the drawing sits beside its passage, smaller than the prose', { skip }, () => {
  // The scenes with a drawing in the authored position, at a width where
  // there is room for a column of prose and a drawing next to it.
  const scenes = ORDER.filter((id) => {
    const visual = sceneById.get(id).visual;
    return visual.layout === 'single' || visual.layout === 'group';
  }).slice(0, 6);

  for (const id of scenes) {
    const { value } = essayPage({
      width: 1440,
      height: 900,
      hash: `#${id}`,
      driver: `
        var report = {};
        probe.step(function () {
          var scene = probe.q('[data-scene][data-current]');
          var anchor = probe.q('.art-anchor', scene);
          var art = anchor.getBoundingClientRect();
          report.art = { left: Math.round(art.left), right: Math.round(art.right), width: Math.round(art.width) };
          report.prose = probe.all('p.narration, p.line', scene).map(function (p) {
            var box = p.getBoundingClientRect();
            return { left: Math.round(box.left), right: Math.round(box.right), width: Math.round(box.width) };
          });
          report.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          report.labels = probe.all('.art-label', scene).map(function (label) {
            var box = label.getBoundingClientRect();
            return {
              text: label.textContent,
              inside: box.left >= art.left - 1 && box.right <= art.right + 1,
              inViewport: probe.inViewport(label),
            };
          });
          // The authored order is the reading order: the drawing comes after
          // the block the production note puts it after, whatever the layout
          // does with it.
          var children = Array.prototype.slice.call(scene.children);
          report.domPosition = children.indexOf(probe.q('figure.art', scene));
          report.blocksBefore = children.slice(0, report.domPosition)
            .filter(function (node) { return node.tagName === 'P'; }).length;
        }).run(function () { probe.done(report); });`,
    });

    const widest = Math.max(...value.prose.map((paragraph) => paragraph.width));
    assert.ok(value.art.width < widest,
      `${id}: the drawing is ${value.art.width}px beside ${widest}px of prose, which is not supporting it`);
    assert.ok(value.art.left >= Math.max(...value.prose.map((paragraph) => paragraph.right)) - 1,
      `${id}: the drawing overlaps the sentences it should sit beside`);
    assert.equal(value.overflow, 0, `${id} scrolls sideways at 1440px`);
    assert.equal(value.blocksBefore, sceneById.get(id).visual.afterBlock,
      `${id}: the drawing moved out of its authored position in the reading order`);

    for (const label of value.labels) {
      assert.equal(label.inside, true, `${id}: "${label.text}" hangs outside the smaller drawing`);
      assert.equal(label.inViewport, true, `${id}: "${label.text}" is clipped out of the window`);
    }
  }
});

test('a line of prose stays a length a reader can track, in the face that sets it', { skip }, () => {
  // Measured against a fixture paragraph built in the browser, never against
  // the approved manuscript: what is being checked is the column, and a
  // website sentence is whatever length the author wrote it.
  for (const width of [375, 1024, 1440]) {
    const { value } = essayPage({
      width,
      height: 900,
      hash: `#${ORDER[0]}`,
      driver: afterFonts(`
        var scene = probe.q('[data-scene][data-current]');
        var sample = document.createElement('p');
        sample.className = 'narration';
        var filler = 'the quick brown fox jumps over a lazy dog and then considers whether an ordinary afternoon counts as a good one ';
        sample.textContent = filler + filler + filler + filler;
        scene.appendChild(sample);
        var box = sample.getBoundingClientRect();
        var lines = Math.round(box.height / parseFloat(probe.style(sample, 'lineHeight')));
        report.width = Math.round(box.width);
        report.lines = lines;
        report.charsPerLine = Math.round(sample.textContent.trim().length / lines);
        report.family = probe.style(sample, 'fontFamily');
        sample.remove();
      `),
    });

    assert.match(value.family, new RegExp(PROJECT_FONT.family), 'measured in the fallback, which proves nothing');
    assert.ok(value.lines > 3, `the fixture wrapped onto ${value.lines} lines, too few to average`);
    assert.ok(
      value.charsPerLine >= 35 && value.charsPerLine <= 75,
      `at ${width}px a line holds ${value.charsPerLine} characters, outside the band a reader can track`,
    );
    if (width >= 1024) {
      assert.ok(
        value.charsPerLine >= 55,
        `at ${width}px the column is still a strip: ${value.charsPerLine} characters a line`,
      );
    }
  }
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
                // Pair wrappers use display:contents; measure the rendered image anchor.
                visible: probe.visible(anchor),
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
  const expectedDrawn = content.scenes.reduce((total, scene) => total + (scene.visual.control ? 1 : scene.visual.views.length), 0);
  assert.equal(drawn, expectedDrawn, 'every selected visible drawing was measured');
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
    const expectedLabels = content.scenes.reduce((total, scene) => total + scene.visual.views
      .filter((view, index) => !scene.visual.control || index === 0)
      .reduce((sum, view) => sum + content.assets.find((asset) => asset.ref === view.ref).labels.length, 0), 0);
    assert.equal(labelled, expectedLabels, `all authored labels measured at ${width}px: ${JSON.stringify(scenes.map((scene) => [scene.scene, scene.views.map((view) => [view.ref, view.visible, view.labels.length])]))}`);
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
    hash: `#${content.scenes.find((entry) => entry.visual.layout === 'pair').id}`,
    driver: `
      var report = {};
      probe.step(function () {
        var figure = probe.q('.art[data-layout="pair"]', probe.q('#${content.scenes.find((entry) => entry.visual.layout === 'pair').id}'));
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
  const scene = content.scenes.find((entry) => entry.visual.layout === 'pair');
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
            sourcesActions: probe.all('[data-sources]').filter(probe.visible).length,
          };
        })
        .step(function () { probe.q('[data-begin]').click(); })
        .step(function () {
          report.reading = controls();
          report.railWhileReading = probe.all('.rail-secondary button, .rail-secondary .button')
            .filter(probe.visible)
            .map(function (control) { return control.textContent.trim(); });
          report.readingSourcesActions = probe.all('[data-sources]').filter(probe.visible).length;
        })
        .step(function () { probe.q('[data-back]').click(); })
        .step(function () {
          report.backOnLanding = {
            view: document.documentElement.getAttribute('data-view'),
            controls: controls(),
            rail: probe.all('.chapter-rail a, .chapter-rail button').filter(probe.visible)
              .map(function (control) { return control.textContent.trim(); }),
          };
        })
        .run(function () { probe.done(report); });`,
  });

  // Read continuously would let a first-time visitor switch view without ever
  // meeting the essay. Sources & Credits is on the approved landing, so it
  // stays there and nowhere else until there is something to read.
  assert.equal(value.onLanding.view, 'landing');
  assert.deepEqual(value.onLanding.controls, []);
  assert.deepEqual(value.onLanding.landingActions, [content.landing.beginLabel, content.landing.sourcesLabel]);
  assert.equal(value.onLanding.sourcesActions, 1, 'the landing offers one route to the register, not two');

  // The reading footer is Back and Next. Everything else a reader can do is
  // in the rail, which the next report covers.
  assert.deepEqual(value.reading, [content.interface.back, content.interface.next]);
  // Read continuously is deferred by the owner: the rail offers Sources & Credits alone.
  assert.deepEqual(value.railWhileReading, [content.interface.sources]);
  assert.equal(value.readingSourcesActions, 1, 'and still one route to it, because the landing is off screen');

  assert.equal(value.backOnLanding.view, 'landing');
  assert.deepEqual(value.backOnLanding.controls, [], 'and the footer goes again on the way out');
  assert.deepEqual(value.backOnLanding.rail, [], 'and so does the rail');
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
          report.atLastScene = probe.q('.rail-secondary [data-sources]').getAttribute('href');
          report.citationsHere = probe.all('.citation', probe.q('[data-scene][data-current]')).length;
        })
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () { report.continuous = probe.q('.rail-secondary [data-sources]').getAttribute('href'); })
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
          report.beforeScroll = probe.q('.rail-secondary [data-sources]').getAttribute('href');
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
          report.afterScroll = probe.q('.rail-secondary [data-sources]').getAttribute('href');
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
          var link = probe.q('.rail-secondary [data-sources]');
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

test('the address a reader could copy opens the view they were in', { skip }, () => {
  const scene = content.scenes.find((entry) => entry.blocks.some((block) => block.parts.some((part) => part.citation))).id;

  // What the address bar holds after switching into and out of continuous
  // reading, taken from a real browser's own location rather than from what
  // the script believes it wrote.
  const { value: written } = essayPage({
    width: 1024,
    height: 900,
    hash: `#${scene}`,
    driver: `
      var report = {};
      probe
        .step(function () { report.atScene = location.search + location.hash; })
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () { report.continuous = location.search + location.hash; })
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () { report.backToScene = location.search + location.hash; })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(written.atScene, `#${scene}`);
  assert.equal(written.continuous, `?view=continuous#${scene}`, 'continuous reading is not in the address');
  assert.equal(written.backToScene, `#${scene}`, 'a stale mode was left in the address');

  // And each of those addresses, opened fresh, gives the view it describes.
  for (const [address, expected] of [
    [{ hash: `#${scene}` }, 'beat'],
    [{ query: '?view=continuous', hash: `#${scene}` }, 'reading'],
  ]) {
    const { value } = essayPage({
      width: 1024,
      height: 900,
      ...address,
      driver: `
        var report = {};
        probe.step(function () {
          report.view = document.documentElement.getAttribute('data-view');
          report.visibleScenes = probe.all('[data-scene]').filter(probe.visible).length;
          report.onScreen = probe.inViewport(probe.q('#${scene}'));
        }).run(function () { probe.done(report); });`,
    });
    assert.equal(value.view, expected, `reloading ${JSON.stringify(address)} opened the wrong view`);
    assert.equal(value.visibleScenes, expected === 'reading' ? ORDER.length : 1);
    assert.equal(value.onScreen, true, 'and lands at the scene either way');
  }
});

test('returning from Sources and switching view rewrites the address', { skip }, () => {
  // The way back carries `?view=continuous`. Switching to the scene view has
  // to take it out, or the URL contradicts the page and reloading or sharing
  // it opens continuous reading again.
  const scene = ORDER[18];
  const { value } = essayPage({
    width: 1024,
    height: 900,
    query: '?view=continuous',
    hash: `#${scene}`,
    driver: `
      var report = {};
      probe
        .step(function () { report.arrived = { view: document.documentElement.getAttribute('data-view'), address: location.search + location.hash }; })
        .step(function () { probe.q('[data-view-toggle]').click(); })
        .step(function () {
          report.afterSwitch = {
            view: document.documentElement.getAttribute('data-view'),
            address: location.search + location.hash,
            scene: probe.sceneId(),
          };
        })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.arrived.view, 'reading');
  assert.equal(value.arrived.address, `?view=continuous#${scene}`);

  assert.equal(value.afterSwitch.view, 'beat');
  assert.equal(value.afterSwitch.scene, scene);
  assert.equal(value.afterSwitch.address, `#${scene}`, 'the stale mode survived the switch');
});

test('leaving continuous reading keeps the passage, not the way in', { skip }, () => {
  // A reader enters continuous reading at one scene, reads on by scrolling,
  // then presses Scene view. Scene view has to open the passage in front of
  // them. Opening the scene they came in at would silently undo the reading
  // they just did -- here, twenty-four parts of it.
  const entered = ORDER[4];
  const target = ORDER.at(-3);

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
  assert.equal(value.afterNext, ORDER.at(-2));
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
      // The rail is written into the markup, not assembled by a script, so a
      // reader with none still gets a working list of chapters and parts --
      // with every chapter expanded, because nothing collapsed any of them.
      report.railVisible = doc.querySelector('.chapter-rail').getClientRects().length > 0;
      report.parts = Array.prototype.slice.call(doc.querySelectorAll('[data-part-link]'))
        .filter(function (link) { return link.getClientRects().length > 0; }).length;
      report.railChapters = Array.prototype.slice.call(doc.querySelectorAll('.rail-chapter-link'))
        .filter(function (link) { return link.getClientRects().length > 0; }).length;
      report.railToggles = Array.prototype.slice.call(doc.querySelectorAll('[data-chapter-toggle], [data-rail-toggle], [data-rail-restore]'))
        .filter(function (control) { return control.getClientRects().length > 0; }).length;
      report.readAgain = doc.querySelector('[data-read-again]').getClientRects().length > 0;
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

  assert.equal(report.railVisible, true, 'the chapter navigation needs no script to be a list of links');
  assert.equal(report.railChapters, content.chapters.length);
  assert.equal(report.parts, ORDER.length, 'every part is listed, because nothing collapsed a chapter');
  assert.equal(report.railToggles, 0, 'a control that only works with a script is not offered without one');
  assert.equal(report.readAgain, false, 'and neither is Read again, which only a script can place');
});

test('the print rules drop the navigation and keep every scene, from either view', { skip }, () => {
  // Print cannot be emulated without a DevTools socket this setup cannot
  // open, so the print block is rewritten to `@media all` and rendered. It is
  // the same technique the pair test uses, and the only way to see what those
  // rules actually do to a layout rather than trusting that they exist.
  const printRules = { ...hostedFiles, 'styles.css': built.hostedCss.replace('@media print', '@media all') };

  for (const [label, driver] of [
    ['from a scene', ''],
    ['from continuous reading', "probe.q('[data-view-toggle]').click();"],
  ]) {
    const { value } = runInChrome({
      html: hosted,
      files: printRules,
      width: 1024,
      height: 900,
      hash: `#${ORDER[20]}`,
      driver: `
        var report = {};
        probe
          .step(function () { ${driver} })
          .step(function () {
            report.scenes = probe.all('[data-scene]').filter(probe.visible).length;
            report.chapterTitles = probe.all('.chapter-title').filter(probe.visible).length;
            report.landing = probe.visible(probe.q('.landing'));
            report.comparisonStates = probe.all('.art-comparison .art-view').filter(probe.visible).length;
            report.comparisonLabels = probe.all('.art-comparison .art-view-label').filter(probe.visible).length;
            report.rail = probe.visible(probe.q('.chapter-rail'));
            report.launcher = probe.visible(probe.q('.rail-launcher'));
            report.readAgain = probe.visible(probe.q('[data-read-again]'));
            report.footer = probe.visible(probe.q('.reader-controls'));
            report.comparisonControls = probe.all('.art-control').filter(probe.visible).length;
            report.parts = probe.all('[data-part-link]').filter(probe.visible).length;
          })
          .run(function () { probe.done(report); });`,
    });

    assert.equal(value.scenes, ORDER.length, `${label}: the printed pages are missing scenes`);
    assert.equal(value.chapterTitles, content.chapters.length, `${label}: a chapter heading is missing`);
    assert.equal(value.landing, true, `${label}: the title page is missing`);
    assert.equal(value.comparisonStates, 4, `${label}: a comparison printed one of its two drawings`);
    assert.equal(value.comparisonLabels, 4, `${label}: and one of them unlabelled`);

    // And none of the apparatus. The rail and its launcher are navigation; a
    // printed page has nowhere to navigate to.
    assert.equal(value.rail, false, `${label}: the chapter rail was printed`);
    assert.equal(value.parts, 0, `${label}: 45 part links were printed`);
    assert.equal(value.launcher, false, `${label}: the drawer launcher was printed`);
    assert.equal(value.readAgain, false, `${label}: Read again was printed, and paper cannot be pressed`);
    assert.equal(value.footer, false, `${label}: the reading footer was printed`);
    assert.equal(value.comparisonControls, 0, `${label}: a comparison control was printed`);
  }
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
  const { value } = runInChrome({
    html: hosted,
    files: scratchFiles,
    width: 1024,
    height: 900,
    flags: ['--force-prefers-reduced-motion=reduce'],
    driver: `
      var report = {};
      probe
        .wait(300)
        .step(function () { probe.q('[data-begin]').click(); probe.q('[data-next]').click(); })
        .step(function () {
          var scene = probe.q('[data-scene][data-current]');
          report.scene = probe.sceneId();
          report.visible = probe.visible(scene);
          report.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          report.sheetLoaded = !!probe.q('[data-scratcher]').style.backgroundImage;
          report.scratcherHidden = probe.q('[data-scratcher]').hidden;
          report.runningEffects = document.getAnimations().length;
          report.imageOpacity = probe.style(probe.q('img', scene), 'opacity');
          report.animations = probe.all('*').filter(function (element) {
            return probe.style(element, 'animationName') !== 'none';
          }).length;
        })
        .run(function () { probe.done(report); });`,
  });

  assert.equal(value.reduced, true, 'the browser was asked for reduced motion');
  assert.equal(value.scene, ORDER[1]);
  assert.equal(value.visible, true);
  assert.equal(value.imageOpacity, '1', 'the drawing is simply there; there is no entrance to suppress');
  assert.equal(value.animations, 0, 'no CSS motion is painted');
  assert.equal(value.sheetLoaded, true, 'the transition was available, and declined');
  assert.equal(value.scratcherHidden, true, 'the scratch transition is omitted and both moves are made at once');
  assert.equal(value.runningEffects, 0, 'no Web Animation is started');
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
