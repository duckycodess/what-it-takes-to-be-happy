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

import { buildOutputs, auditOutputs, selectedImages } from '../src/build/build.js';
import { auditSelfContainedHtml, auditArtwork, auditBundledLicence } from '../src/build/verify.js';
import { PROJECT_FONT, FALLBACK_FONT, FALLBACK_FONT_LICENSE } from '../src/build/assets.js';
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
    // What a reader sees is the decoded character, not the escape the
    // renderer wrote: an apostrophe in approved copy arrives as `&#39;`.
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every `<img>` tag in an output, as written. */
const images = (html) => [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);

const attribute = (tag, name) => (tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`)) || [])[1];

test('the build produces outputs that pass every packaging check', async () => {
  const content = loadValidContent();
  const outputs = await buildOutputs(content);
  assert.doesNotThrow(() => auditOutputs(outputs, content));
  assert.deepEqual(auditSelfContainedHtml(outputs.offline), []);
});

test('the hosted page links the drawings as files, with their boxes reserved', async () => {
  const content = loadValidContent();
  const { hosted } = await buildOutputs(content);
  const selected = new Set(selectedImages(content));
  const tags = images(hosted);

  assert.ok(tags.length >= 20, `the essay should show every delivered drawing, found ${tags.length}`);
  assert.deepEqual(auditArtwork(hosted, content), []);

  for (const tag of tags) {
    const src = attribute(tag, 'src');
    // A linked file, not 28 MB of base64 in the first response, and not a
    // resized or regenerated copy of something nobody inspected.
    assert.ok(selected.has(src), `${src} is not one of the inspected selected assets`);
    assert.match(tag, /width="\d+"/);
    assert.match(tag, /height="\d+"/, 'the box is reserved before the image arrives');
    assert.equal(attribute(tag, 'decoding'), 'async');
    assert.ok(attribute(tag, 'alt'), 'every drawing carries its approved alternative text');
  }

  // Exactly one eager image: the opening illustration a reader sees before
  // scrolling. Making the other 34 eager would pull the whole 21 MB of
  // artwork over a phone connection to read the first scene.
  const eager = tags.filter((tag) => attribute(tag, 'loading') !== 'lazy');
  assert.equal(eager.length, 1, 'only the first illustration loads eagerly');
  assert.equal(attribute(eager[0], 'src'), content.landing.visual.views[0].ref === 'A01'
    ? selectedImages(content)[0]
    : attribute(eager[0], 'src'));
  assert.equal(tags[0], eager[0], 'and it is the first one in the document');
});

test('no unselected provenance output is ever served', async () => {
  const content = loadValidContent();
  const { hosted, sources, offline } = await buildOutputs(content);
  for (const [label, html] of [['the essay', hosted], ['the register', sources], ['the export', offline]]) {
    assert.ok(!html.includes('source-generation'), `${label} serves an output nobody selected`);
  }
});

test('the single-file export inlines every drawing instead, and fetches nothing', async () => {
  const content = loadValidContent();
  const { offline, hosted } = await buildOutputs(content);

  assert.equal(images(offline).length, images(hosted).length, 'the export shows exactly what the site shows');
  for (const tag of images(offline)) {
    assert.match(attribute(tag, 'src'), /^data:image\/png;base64,/);
  }
  assert.deepEqual(auditArtwork(offline, content, { inline: true }), []);
  assert.deepEqual(auditSelfContainedHtml(offline), []);
  assert.match(offline, /@font-face[\s\S]{0,200}url\(data:font\/ttf;base64,/);

  // Reported, not asserted as a quality: about 28 MB of base64 is what
  // inlining 21 MB of PNGs costs. This file is retained tooling, and its size
  // is the reason the hosted site links the same drawings rather than
  // embedding them. It is not a release gate and no threshold here is proof
  // of performance.
  const megabytes = offline.length / 1024 / 1024;
  assert.ok(megabytes > 20, `the export inlines the artwork; it is ${megabytes.toFixed(1)} MB`);
});

test('the font is embedded in the export exactly once', async () => {
  const { offline, fontBytes } = await buildOutputs(loadValidContent());
  // The substitution is textual, and the token used to be spelled out in the
  // stylesheet's own header comment as well as in the rule, which put a second
  // megabyte of base64 into every copy of this file.
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

  const faces = [...offline.matchAll(/@font-face\s*\{[^}]*\}/g)];
  assert.equal(faces.length, 1, 'one @font-face, which is the bundled fallback');
  assert.match(faces[0][0], new RegExp(`font-family:\\s*'${FALLBACK_FONT.family}'`));

  // The typeface's name does survive, once: the approved credits say what the
  // website is set in, and that copy may not be rewritten for an export. What
  // must not survive is any rule asking a browser for a face this file does
  // not carry, which would silently fall back and misrepresent the design.
  const styles = offline.slice(offline.indexOf('<style>'), offline.lastIndexOf('</style>'));
  assert.ok(!styles.includes(PROJECT_FONT.family), 'no stack asks for a face the file has no bytes for');
  const named = offline.split(PROJECT_FONT.family).length - 1;
  assert.equal(named, 1, 'the name appears only in the approved credits');
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

test('the typeface credit is the approved register copy, not a renderer-written notice', async () => {
  const content = loadValidContent();
  const { hosted, sources, offline } = await buildOutputs(content);

  // The approved script puts credits on Sources & Credits and forbids a
  // credits footer on the scenes themselves. So the grant is named where the
  // approved copy names it, and nowhere else.
  assert.ok(sources.includes('Futura Handwritten'), 'the register credits the typeface');
  assert.ok(sources.includes('Billy Snyder'), 'and its author');
  assert.ok(!hosted.includes('Billy Snyder'), 'the essay carries no credits footer');

  const credit = content.sourcesPage.credits.map((part) => part.text ?? part.link).join('');
  assert.ok(credit.includes('Futura Handwritten'), 'and that copy is the approved copy, not written here');

  // The export bundles a different face, so it owes its own notice, which it
  // carries in addition to the approved credits rather than instead of them.
  assert.ok(offline.includes(FALLBACK_FONT.noticeAlone));
  assert.ok(!offline.includes(PROJECT_FONT.notice), 'and claims no grant for a font it does not serve');
});

test('every output that bundles the fallback carries its licence, and the site publishes it', async () => {
  const { offline, fontLicense } = await buildOutputs(loadValidContent());
  assert.match(fontLicense, /Bitstream Vera/, 'the committed licence file should be the real one');
  assert.deepEqual(auditBundledLicence(offline, fontLicense), [],
    'the single file is a copy of the font and must carry its notice inside it');

  // The hosted site serves the font as a file, so the notice travels as the
  // file beside it rather than as prose the approved page does not contain.
  runBuild();
  const published = join(DIST, FALLBACK_FONT_LICENSE.published);
  assert.ok(existsSync(published), 'the licence is published next to the font it covers');
  assert.match(readFileSync(published, 'utf8'), /Bitstream Vera/);
  assert.ok(existsSync(join(DIST, FALLBACK_FONT.published)));
});

test('the hosted page and the offline file read identically apart from their font credits', async () => {
  const content = loadValidContent();
  const { hosted, sources, offline } = await buildOutputs(content);

  // The export is one document: the essay and the register together. So the
  // comparison is against both hosted pages, and what is left over is the
  // notice the export owes for the face it bundles.
  const site = visibleText(`${hosted} ${sources}`);
  const exported = visibleText(offline).replace(FALLBACK_FONT.noticeAlone, '').replace(/\s+/g, ' ').trim();

  // Part by part, because a citation sits inside a run of prose: the text
  // either side of `[4]` is contiguous, the two together are not.
  for (const scene of content.scenes) {
    for (const block of scene.blocks) {
      for (const part of block.parts) {
        if (part.text === undefined) continue;
        const normalised = part.text.replace(/\s+/g, ' ').trim();
        if (normalised === '') continue;
        assert.ok(site.includes(normalised), `the site is missing a sentence of ${scene.id}`);
        assert.ok(exported.includes(normalised), `the export is missing a sentence of ${scene.id}`);
      }
    }
  }
  assert.ok(exported.includes(content.sourcesPage.sources.at(-1).citation.replace(/\s+/g, ' ').trim()));
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
  const sentence = content.scenes[0].blocks[0].parts[0].text;
  const broken = { ...outputs, hosted: outputs.hosted.replace(sentence, '') };
  assert.throws(() => auditOutputs(broken, content), /does not carry the complete approved argument/);
});

test('an output that drops a drawing or its alternative text fails the build', async () => {
  const content = loadValidContent();
  const outputs = await buildOutputs(content);
  const first = images(outputs.hosted)[0];

  const withoutAlt = { ...outputs, hosted: outputs.hosted.replace(first, first.replace(/ alt="[^"]*"/, ' alt=""')) };
  assert.throws(() => auditOutputs(withoutAlt, content), /does not present the inspected generated artwork correctly/);

  const resized = { ...outputs, hosted: outputs.hosted.replace(first, first.replace(/src="[^"]*"/, 'src="assets/generated/resized/opening.png"')) };
  assert.throws(() => auditOutputs(resized, content), /does not present the inspected generated artwork correctly/);
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

  assert.match(output, /dist\/offline\.html is retained tooling, not a release gate/);
  assert.ok(!/dist\/index\.html\s+\d+ bytes/.test(output), 'an offline export writes no hosted file');
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
    assert.match(await page.text(), /<h1 id="landing-title"[^>]*>What it takes to be happy<\/h1>/);

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
