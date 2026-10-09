/**
 * Runs a built page in a real browser, with no dependencies and no socket.
 *
 * `test/support/dom.js` answers what the browser script does. It cannot
 * answer what a browser does with the stylesheet: what a view actually hides,
 * whether a focus ring is painted, whether a 360-pixel-wide window scrolls
 * sideways, or whether a disclosure keeps focus on its own summary. Those
 * need a browser, so this runs one.
 *
 * The mechanism is Chrome's `--dump-dom`, which loads a page, runs its
 * scripts, and prints the resulting DOM. A driver script is appended to the
 * page, walks it the way a reader would, and leaves its findings in a
 * base64 attribute on the root element, which survives the dump unambiguously.
 *
 * A page can be given the files it links to, which is how the hosted output
 * is run here: index.html with its real stylesheet, script, and fonts beside
 * it, so a question about a font the browser had to go and fetch has an
 * answer. Serving the same tree over HTTP instead would be closer still, but
 * a Windows browser driven from WSL cannot reach a loopback port inside it;
 * what the preview server does over HTTP is covered in test/build.test.js.
 *
 * Nothing here is required: `findChrome()` returns null when no browser is
 * installed, and the browser suite skips rather than failing. What actually
 * ran is recorded in docs/verification.md.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/** Explicit first, then the usual names, then where WSL finds Windows. */
const CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
  '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

let resolved;

/** @returns {string|null} a usable browser binary, or null if there is none */
export function findChrome() {
  if (resolved !== undefined) return resolved;
  resolved = CANDIDATES.find((path) => path && existsSync(path)) || null;
  return resolved;
}

const isWindowsBinary = (binary) => binary.endsWith('.exe');

/**
 * A directory the browser can read, and the `file:` URL prefix for it.
 *
 * A Windows browser cannot open a Linux path, so under WSL the directory is
 * named by its UNC path instead. `wslpath` does the translation; if it is not
 * there, neither is WSL, and the ordinary path is right.
 */
function workspace(binary) {
  const directory = mkdtempSync(join(tmpdir(), 'essay-browser-'));
  if (!isWindowsBinary(binary)) return { directory, url: (name) => `file://${directory}/${name}` };

  const windowsPath = execFileSync('wslpath', ['-w', directory], { encoding: 'utf8' }).trim();
  const slashes = windowsPath.replace(/\\/g, '/');
  return { directory, windowsPath, url: (name) => `file:///${slashes}/${name}` };
}

/**
 * Loads `html` with `driver` appended, and returns whatever the driver
 * recorded.
 *
 * @param {object} options
 * @param {string} options.html a complete built document
 * @param {string} options.driver source for a classic script, run after the
 *   page's own script; it calls `probe.done(value)` when finished
 * @param {Record<string, string|Buffer>} [options.files] resources the page
 *   links to, by the path it links them at — a stylesheet, a script, a font.
 *   The hosted output is a page plus linked files, and a question about a
 *   linked font cannot be asked of a document that has none.
 * @param {string} [options.hash] a fragment, as a deep link would supply
 * @param {number} [options.width] layout width in CSS pixels
 * @param {number} [options.height] layout height in CSS pixels
 * @param {string[]} [options.flags] extra browser flags
 * @returns {{value: unknown, dom: string}}
 */
export function runInChrome({ html, driver, files = {}, hash = '', width = 360, height = 780, flags = [] }) {
  const binary = findChrome();
  if (!binary) throw new Error('No browser is installed; callers should have skipped.');

  const space = workspace(binary);
  const profile = join(space.directory, 'profile');

  // The page is written as `page.html` at the root of the workspace, so a
  // linked file goes in at exactly the path the page asks for.
  for (const [path, data] of Object.entries(files)) {
    const destination = join(space.directory, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, data);
  }

  // A desktop browser window will not go below roughly 500 CSS pixels wide,
  // so `--window-size=360` quietly lays the page out at ~490 and a phone
  // width is never actually tested. A frame of the requested size does give
  // the page that layout viewport, so the narrow sizes go in one. The page is
  // unmodified inside it; only the driver has to reach across.
  const framed = width < FRAME_BELOW;
  const windowSize = framed ? `${Math.max(width, FRAME_BELOW) + FRAME_MARGIN},${height + FRAME_MARGIN}` : `${width},${height}`;

  writeFileSync(join(space.directory, 'page.html'), framed ? html : html.replace('</body>', `<script>\n${PROBE}\n${driver}\n</script>\n</body>`));
  if (framed) writeFileSync(join(space.directory, 'host.html'), hostPage({ width, height, hash, driver }));

  try {
    const dom = execFileSync(binary, [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      `--window-size=${windowSize}`,
      `--user-data-dir=${space.windowsPath ? `${space.windowsPath}\\profile` : profile}`,
      '--virtual-time-budget=8000',
      // Only so the host page can drive the frame; both are local files
      // written by this function, and nothing else is served.
      ...(framed ? ['--allow-file-access-from-files'] : []),
      ...flags,
      '--dump-dom',
      framed ? space.url('host.html') : `${space.url('page.html')}${hash}`,
    ], { encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });

    const match = dom.match(/data-probe="([A-Za-z0-9+/=]*)"/);
    if (!match) throw new Error('The driver did not finish; the page recorded nothing.');
    return { value: JSON.parse(Buffer.from(match[1], 'base64').toString('utf8')), dom };
  } finally {
    rmSync(space.directory, { recursive: true, force: true });
  }
}

/** Below this width a desktop window cannot go, so a frame is used instead. */
const FRAME_BELOW = 520;
const FRAME_MARGIN = 80;

/**
 * A bare host whose only job is to give the page a narrow layout viewport and
 * to run the driver inside it. The driver still sees the page's own `window`
 * and `document`, so it is written the same way either side of this.
 */
const hostPage = ({ width, height, hash, driver }) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#fff}
iframe{width:${width}px;height:${height}px;border:0;display:block}
</style></head><body>
<iframe id="frame" src="page.html${hash}"></iframe>
<script>
(function () {
  var frame = document.getElementById('frame');
  frame.addEventListener('load', function () {
    frame.contentWindow.eval(${JSON.stringify(`${PROBE}\n${driver}`)});
    (function waitForResult() {
      var found = frame.contentDocument.documentElement.getAttribute('data-probe');
      if (found === null) { setTimeout(waitForResult, 10); return; }
      document.documentElement.setAttribute('data-probe', found);
    })();
  });
})();
</script>
</body></html>
`;

/**
 * The helpers every driver gets. `probe.step` queues work so that each step
 * starts in a fresh task, which is what a `toggle` event and a style
 * recalculation need in order to have happened.
 */
const PROBE = `
var probe = (function () {
  var steps = [];
  var api = {
    q: function (selector, root) { return (root || document).querySelector(selector); },
    all: function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); },
    visible: function (element) {
      if (!element) return false;
      return element.getClientRects().length > 0;
    },
    // Rendered is not the same as on screen. An element the reader was just
    // sent to has to be inside the window, not merely laid out somewhere.
    inViewport: function (element) {
      if (!element || element.getClientRects().length === 0) return false;
      var box = element.getBoundingClientRect();
      var height = window.innerHeight || document.documentElement.clientHeight;
      var width = window.innerWidth || document.documentElement.clientWidth;
      return box.bottom > 0 && box.top < height && box.right > 0 && box.left < width;
    },
    style: function (element, property) { return window.getComputedStyle(element)[property]; },
    sceneId: function () {
      var scene = document.querySelector('[data-scene][data-current]');
      return scene ? scene.getAttribute('data-scene') : null;
    },
    activeId: function () {
      var active = document.activeElement;
      if (!active) return null;
      return active.getAttribute('data-scene') || active.getAttribute('data-source')
        || active.getAttribute('id') || active.tagName.toLowerCase();
    },
    step: function (fn) { steps.push(fn); return api; },
    done: function (value) {
      var json = JSON.stringify(value);
      var bytes = unescape(encodeURIComponent(json));
      document.documentElement.setAttribute('data-probe', btoa(bytes));
    },
    run: function (finish) {
      var index = 0;
      (function next() {
        if (index >= steps.length) { finish(); return; }
        var fn = steps[index];
        index += 1;
        fn();
        setTimeout(next, 0);
      })();
    },
  };
  return api;
})();
`;
