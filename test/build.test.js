/**
 * Packaging checks. These run the real build command, so they also cover the
 * preview server against the files a static host would actually serve.
 *
 * Everything here lives in one file on purpose: it is the only suite that
 * writes to `dist/`, and test files otherwise run concurrently.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

import { buildOutputs, auditOutputs } from '../src/build/build.js';
import { auditOfflineHtml, auditBundledLicence, auditInlineArtwork } from '../src/build/verify.js';
import { PROJECT_FONT, FALLBACK_FONT } from '../src/build/assets.js';
import { createPreviewServer } from '../src/tools/preview.js';
import { loadValidContent, repoRoot } from './helpers.js';

const DIST = join(repoRoot, 'dist');

const runBuild = (args = []) =>
  execFileSync(process.execPath, ['src/build/build.js', ...args], { cwd: repoRoot, encoding: 'utf8' });

function hashTree(directory) {
  const entries = {};
  const walk = (current) => {
    for (const name of readdirSync(current).sort()) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) walk(full);
      else entries[relative(directory, full)] = createHash('sha256').update(readFileSync(full)).digest('hex');
    }
  };
  walk(directory);
  return entries;
}

/** Visible text only: no markup, no embedded styles, scripts, or data URIs. */
function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The colophon's font credits, which each output owes for its own fonts. */
const fontCredits = (html) =>
  [...html.matchAll(/<p class="colophon-font">([^<]*)<\/p>/g)].map((match) => match[1]);

const withoutFontCredits = (html) => html.replace(/<p class="colophon-font">[^<]*<\/p>/g, '');

test('the build produces outputs that pass every packaging check', async () => {
  const content = loadValidContent();
  const outputs = await buildOutputs(content);
  assert.doesNotThrow(() => auditOutputs(outputs, content));
  assert.deepEqual(auditOfflineHtml(outputs.offline), []);
});

test('the offline file embeds the font and the illustration rather than fetching them', async () => {
  const { offline, fontBytes } = await buildOutputs(loadValidContent());
  assert.match(offline, /@font-face[\s\S]{0,200}url\(data:font\/ttf;base64,/);
  assert.match(offline, /<img src="data:image\/png;base64,/);
  assert.ok(offline.length > 1_000_000, 'the embedded binaries should dominate the file size');

  // Once. The substitution is textual, and the token used to be spelled out
  // in the stylesheet's own header comment as well as in the rule, which put
  // a second megabyte of base64 into every copy of this file.
  const embedded = offline.split(fontBytes.toString('base64').slice(0, 512)).length - 1;
  assert.equal(embedded, 1, 'the font is embedded exactly once');
});

test('the hosted page links the project typeface from this site, with no local lookup', async () => {
  const { hostedCss } = await buildOutputs(loadValidContent());

  const faces = [...hostedCss.matchAll(/@font-face\s*\{[^}]*\}/g)].map((match) => match[0]);
  assert.equal(faces.length, 2, 'the hosted stylesheet declares the project typeface and the fallback');

  const project = faces.find((face) => face.includes(`'${PROJECT_FONT.family}'`));
  assert.ok(project, 'the project typeface is declared by name');
  assert.match(project, new RegExp(`src:\\s*url\\(${PROJECT_FONT.published.replace(/[/.]/g, '\\$&')}\\)`));
  assert.ok(!/local\s*\(/.test(project), 'a local() source would let a font of the same name stand in for the one recorded here');
  assert.match(project, /font-display:\s*swap/, 'the prose stays readable while the face is fetched');

  const fallback = faces.find((face) => face.includes(`'${FALLBACK_FONT.family}'`));
  assert.ok(fallback, 'the fallback is still declared');
  assert.match(fallback, new RegExp(`url\\(${FALLBACK_FONT.published.replace(/[/.]/g, '\\$&')}\\)`));

  assert.match(hostedCss, /--body:\s*'Futura Handwritten',\s*'Bundled Fallback'/, 'and the stack puts one behind the other');
});

test('the offline file carries the fallback alone and no trace of the project typeface', async () => {
  const { offline, projectFontBytes } = await buildOutputs(loadValidContent());

  assert.ok(!offline.includes(projectFontBytes.toString('base64').slice(0, 512)), 'none of its bytes');
  assert.ok(!offline.includes(PROJECT_FONT.published), 'no URL pointing at it');
  assert.ok(!offline.includes(PROJECT_FONT.family), 'and not even its name, in a stack with no face for it');

  const faces = [...offline.matchAll(/@font-face\s*\{[^}]*\}/g)];
  assert.equal(faces.length, 1, 'one @font-face, which is the bundled fallback');
  assert.match(faces[0][0], new RegExp(`font-family:\\s*'${FALLBACK_FONT.family}'`));
});

test('a build that would ship the project typeface offline fails instead', async () => {
  const content = loadValidContent();
  const outputs = await buildOutputs(content);

  for (const [label, leak] of [
    ['its bytes', outputs.projectFontBytes.toString('base64')],
    ['a link to it', `<link rel="preload" href="${PROJECT_FONT.published}">`],
    ['its name in a stack', `<style>:root{--body:'${PROJECT_FONT.family}'}</style>`],
  ]) {
    const broken = { ...outputs, offline: outputs.offline.replace('</head>', `<!--${leak}--></head>`) };
    assert.throws(
      () => auditOutputs(broken, content),
      /carries the project typeface|depends on resources it does not carry/,
      `${label} should stop the build`,
    );
  }
});

test('each output credits the fonts it actually carries, and only those', async () => {
  const content = loadValidContent();
  const outputs = await buildOutputs(content);

  assert.ok(outputs.hosted.includes('Futura Handwritten by Billy Snyder'), 'the hosted page credits the author');
  assert.ok(outputs.hosted.includes('Feel free to use this font for anything you want'), 'and quotes the permission it is served under');
  assert.ok(outputs.hosted.includes('Bitstream Vera'), 'and still carries the fallback licence');
  assert.ok(!outputs.offline.includes('Billy Snyder'), 'the offline file does not credit a font it does not carry');

  const stripped = { ...outputs, hosted: outputs.hosted.replace(/<p class="colophon-font">[^<]*Billy Snyder[^<]*<\/p>/, '') };
  assert.throws(() => auditOutputs(stripped, content), /does not credit every font it carries/);
});

test('both outputs carry the complete font licence', async () => {
  const { hosted, offline, fontLicense } = await buildOutputs(loadValidContent());
  assert.match(fontLicense, /Bitstream Vera/, 'the committed licence file should be the real one');
  assert.deepEqual(auditBundledLicence(offline, fontLicense), [], 'the single offline file is a copy of the font and must carry its notice');
  assert.deepEqual(auditBundledLicence(hosted, fontLicense), []);
});

test('optional panels print open without depending on a beforeprint handler', async () => {
  const { offline } = await buildOutputs(loadValidContent());
  const print = offline.slice(offline.indexOf('@media print'));
  assert.match(print, /details::details-content/, 'modern engines need the details content made visible for print');
  assert.match(print, /details:not\(\[open\]\) > \*:not\(summary\)/, 'older engines need the fallback rule');
});

test('the hosted page and the offline file read identically apart from their font credits', async () => {
  const { hosted, offline } = await buildOutputs(loadValidContent());
  assert.equal(visibleText(withoutFontCredits(offline)), visibleText(withoutFontCredits(hosted)));

  // The one sanctioned difference, asserted rather than assumed: the outputs
  // carry different fonts, so they owe different credits. Everything that is
  // part of the argument is covered by the comparison above.
  assert.deepEqual(fontCredits(hosted).length, 2, 'the hosted page credits the project typeface and the fallback');
  assert.deepEqual(fontCredits(offline).length, 1, 'the offline file carries the fallback alone');
  assert.match(fontCredits(hosted)[0], /Futura Handwritten by Billy Snyder/);
  assert.ok(fontCredits(offline).every((credit) => !credit.includes('Futura')), 'the offline file must not credit a font it does not carry');
});

test('an output that reaches outside itself fails the build instead of shipping', async () => {
  const content = loadValidContent();
  const outputs = await buildOutputs(content);
  const broken = { ...outputs, offline: outputs.offline.replace('</head>', '<link rel="stylesheet" href="https://example.org/x.css"></head>') };
  assert.throws(() => auditOutputs(broken, content), /depends on resources it does not carry/);
});

test('an output that drops essential content fails the build instead of shipping', async () => {
  const content = loadValidContent();
  const outputs = await buildOutputs(content);
  const narration = content.scenes[0].narration[0];
  const broken = { ...outputs, hosted: outputs.hosted.replace(narration, '') };
  assert.throws(() => auditOutputs(broken, content), /does not carry the complete content/);
});

test('the single offline file carries every drawing, with nothing left to fetch', async () => {
  const content = loadValidContent();
  const { hosted, offline } = await buildOutputs(content);

  const count = (html) => (html.match(/<svg class="scene-art"/g) ?? []).length;
  const drawn = content.scenes.filter((scene) => scene.visual.artId !== null).length;
  const landing = content.project.visual.artId ? 1 : 0;
  assert.equal(count(offline), drawn + landing, 'every drawn beat, plus the landing when it has a drawing');
  assert.equal(count(offline), count(hosted), 'the offline file draws exactly what the hosted page draws');

  assert.deepEqual(auditInlineArtwork(offline), []);
  assert.deepEqual(auditOfflineHtml(offline), []);

  // The artwork is markup, not a packaged file: it costs the offline file no
  // request and no asset, which is the whole reason it is drawn this way.
  assert.ok(!/<img[^>]*scene-art/.test(offline));
});

test('a drawing that reached outside itself would fail the build rather than ship', async () => {
  const content = loadValidContent();
  const outputs = await buildOutputs(content);
  const broken = {
    ...outputs,
    hosted: outputs.hosted.replace('<svg class="scene-art"', '<svg class="scene-art"><image href="https://example.org/art.png"/>'),
  };
  assert.throws(() => auditOutputs(broken, content), /reaches outside itself or carries its own lettering/);
});

test('the drawing is settled in the markup, and motion is only an entrance on top of it', async () => {
  const { offline } = await buildOutputs(loadValidContent());
  const styles = offline.slice(offline.indexOf('<style>'), offline.indexOf('</style>'));

  // Nothing hides the condition layer by default, so a scriptless browser, the
  // print route, and the offline file all show the finished explanation.
  assert.ok(!/\[data-art-layer=.reveal.\]\s*\{[^}]*(display:\s*none|opacity:\s*0)/.test(styles));

  // The entrance runs only for the beat a reader is actually on, which is also
  // why Next and Back cannot strand it: the state it settles into is the state
  // the markup already has.
  assert.match(styles, /@keyframes art-reveal/);
  assert.match(styles, /\.scene\[data-current\] \[data-art-layer='reveal'\]\s*\{\s*animation: art-reveal/);

  // Reduced motion keeps the same drawing and drops the movement.
  const reduced = styles.slice(styles.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /\[data-art-layer='reveal'\][\s\S]*?animation: none !important/);
  assert.match(reduced, /opacity: 1 !important/);

  // Print does not depend on an event or a view state either.
  const print = styles.slice(styles.indexOf('@media print'));
  assert.match(print, /\[data-art-layer='reveal'\][\s\S]*?opacity: 1 !important/);
});

test('names over a drawing reflow instead of shrinking with it', async () => {
  const { offline } = await buildOutputs(loadValidContent());
  const styles = offline.slice(offline.indexOf('<style>'), offline.indexOf('</style>'));

  // The frame is the measuring context, so label type is sized against the
  // drawing's own width rather than the window's.
  assert.match(styles, /\.scene-visual-frame\s*\{[^}]*container-type: inline-size/);
  assert.match(styles, /\.art-label\s*\{[^}]*font-size: clamp\(/);
  assert.match(styles, /@container \(max-width: [\d.]+rem\)/);

  // A name is positioned from the drawing's own anchor and sits above the head.
  assert.match(styles, /\.art-label\s*\{[^}]*left: var\(--art-x/);
  assert.match(styles, /\.art-label\s*\{[^}]*transform: translate\(-50%, -100%\)/);
});

test('building twice from the same commit produces byte-identical output', () => {
  runBuild();
  const first = hashTree(DIST);
  runBuild();
  const second = hashTree(DIST);
  assert.deepEqual(second, first);
  assert.ok(Object.keys(first).length >= 7, 'expected the hosted files, the assets, and the offline file');
});

test('the offline export writes only the single file and leaves the hosted output alone', () => {
  runBuild();
  const before = hashTree(DIST);
  const output = runBuild(['--only=offline']);
  const after = hashTree(DIST);

  assert.match(output, /Offline export only/);
  assert.deepEqual(after, before, 'an offline export changes nothing else in dist/');
  assert.ok(existsSync(join(DIST, 'index.html')), 'the hosted entry point survives an offline export');
});

test('the preview server serves the built site and refuses to escape it', async () => {
  runBuild();
  const { hostedCss } = await buildOutputs(loadValidContent());
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.equal(page.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.match(await page.text(), /<h1 id="landing-title">/);

    const styles = await fetch(`${base}/styles.css`);
    assert.equal(styles.status, 200);
    assert.equal(styles.headers.get('content-type'), 'text/css; charset=utf-8');

    // What the browser is actually sent when the stylesheet asks for a face.
    // The Chrome suite drives the same tree from disk, because a Windows
    // browser driven from WSL cannot reach a port inside it; this is the half
    // of the question that needs a real response over HTTP.
    for (const asset of [PROJECT_FONT, FALLBACK_FONT]) {
      const font = await fetch(`${base}/${asset.published}`);
      assert.equal(font.status, 200, `${asset.published} is served`);
      assert.equal(font.headers.get('content-type'), 'font/ttf');
      const served = Buffer.from(await font.arrayBuffer());
      assert.deepEqual(
        createHash('sha256').update(served).digest('hex'),
        createHash('sha256').update(readFileSync(join(repoRoot, asset.source))).digest('hex'),
        `${asset.published} is served byte for byte`,
      );
    }
    assert.ok(hostedCss.includes(PROJECT_FONT.published), 'and the stylesheet asks for it at that path');

    assert.equal((await fetch(`${base}/offline.html`)).status, 200);
    assert.equal((await fetch(`${base}/nothing-here`)).status, 404);
    assert.equal((await fetch(`${base}/%2e%2e/%2e%2e/package.json`)).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
