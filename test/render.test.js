import test from 'node:test';
import assert from 'node:assert/strict';

import { renderDocument, esc } from '../src/runtime/render.js';
import { auditContentCoverage, auditOfflineHtml } from '../src/build/verify.js';
import { loadValidContent, byId } from './helpers.js';

const render = (content, overrides = {}) =>
  renderDocument(content, {
    mode: 'hosted',
    stylesheetUrl: 'styles.css',
    scriptUrl: 'reader.js',
    fontNotice: 'Bundled fallback font.',
    illustration: { url: 'art.png', alt: 'Concept sheet.', caption: 'Provisional.', width: 10, height: 10 },
    ...overrides,
  });

const sceneOrder = (html) => [...html.matchAll(/data-scene="([^"]+)"/g)].map((match) => match[1]);

test('the rendered document carries every piece of essential content', () => {
  const content = loadValidContent();
  assert.deepEqual(auditContentCoverage(render(content), content), []);
});

test('reading order follows the chapters, not the order scenes are stored in', () => {
  const content = loadValidContent();
  const expected = content.chapters.flatMap((chapter) => chapter.sceneIds);

  const shuffled = loadValidContent();
  shuffled.scenes.reverse();
  const chapter = byId(shuffled.chapters, 'ch-what-counts');
  chapter.sceneIds = [...chapter.sceneIds].reverse();

  assert.deepEqual(sceneOrder(render(content)), expected);
  assert.deepEqual(
    sceneOrder(render(shuffled)),
    shuffled.chapters.flatMap((entry) => entry.sceneIds),
    'reordering by identifier changes the output order',
  );
  assert.notDeepEqual(sceneOrder(render(shuffled)), expected);
});

test('every beat is in the markup, so print and a scriptless browser keep the whole argument', () => {
  const content = loadValidContent();
  const html = render(content);
  assert.equal(sceneOrder(html).length, content.scenes.length);
  for (const scene of content.scenes) {
    assert.ok(html.includes(`id="${scene.id}"`));
  }
});

test('authoring provenance never reaches the output', () => {
  const content = loadValidContent();
  const html = render(content);
  for (const record of content.provenance) {
    assert.ok(!html.includes(record.note), `${record.id} note leaked`);
    assert.ok(!html.includes(record.sourceNote), `${record.id} sourceNote leaked`);
    assert.ok(!html.includes(record.id), `${record.id} identifier leaked`);
  }
  assert.ok(!/provenance/i.test(html), 'no authoring workflow vocabulary in the product');
});

test('optional detail is open in the markup, so the reveal is never the only route', () => {
  const content = loadValidContent();
  const html = render(content);
  const opened = [...html.matchAll(/<details class="detail" open>/g)];
  assert.equal(opened.length, content.details.length);
});

test('member names are rendered as selectable text, never baked into an image', () => {
  const content = loadValidContent();
  const html = render(content);
  for (const member of content.cast.filter((character) => character.role === 'member')) {
    assert.ok(html.includes(`<li class="nametag">${member.displayName}</li>`), `${member.displayName} is missing from the landing`);
  }
  assert.match(html, /<span class="nametag">TJ<\/span>/);
});

test('an invented figure is labelled as an example rather than as evidence', () => {
  const content = loadValidContent();
  const html = render(content);
  assert.match(html, /data-stance="fictional-illustration"/);
  assert.match(html, /<span class="line-kind">invented example<\/span>/);
});

test('content text is escaped rather than interpreted as markup', () => {
  const content = loadValidContent();
  byId(content.scenes, 'sc-rest-without-a-reason').title = '<script>alert(1)</script> & "quotes"';
  const html = render(content);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes(esc('<script>alert(1)</script> & "quotes"')));
});

test('the draft notice is rendered while the content is not final', () => {
  const content = loadValidContent();
  assert.match(render(content), /class="draft-notice"/);
  assert.match(render(content), /content="noindex"/);

  const final = loadValidContent();
  final.status.final = true;
  assert.ok(!render(final).includes('class="draft-notice"'));
  assert.match(render(final), /content="index"/);
});

test('hosted output links its resources and offline output embeds them', () => {
  const content = loadValidContent();
  const hosted = render(content);
  assert.match(hosted, /<link rel="stylesheet" href="styles\.css">/);
  assert.match(hosted, /<script src="reader\.js" defer><\/script>/);

  const offline = render(content, {
    mode: 'offline',
    inlineStyles: 'body{color:#000}',
    inlineScript: 'void 0;',
    illustration: { url: 'data:image/png;base64,AAAA', alt: 'a', caption: 'b', width: 1, height: 1 },
  });
  assert.match(offline, /<style>\nbody\{color:#000\}\n<\/style>/);
  assert.ok(!offline.includes('<link rel="stylesheet"'));
  assert.ok(!/<script src=/.test(offline));
});

test('the offline audit recognises each way a file could reach outside itself', () => {
  const cases = [
    ['<script src="reader.js"></script>', 'script-src'],
    ['<link rel="stylesheet" href="styles.css">', 'link-href'],
    ['<img src="art.png" alt="">', 'src'],
    ['<style>@font-face{src:url(font.ttf)}</style>', 'css-url'],
    ['<style>@import "other.css";</style>', 'css-import'],
    ['<a href="other.html">next</a>', 'a-href'],
    ['<img srcset="small.png 1x" src="data:image/png;base64,AA">', 'srcset'],
    ['<iframe src="data:text/html,hi"></iframe>', 'element'],
  ];
  for (const [html, kind] of cases) {
    const kinds = auditOfflineHtml(html).map((problem) => problem.kind);
    assert.ok(kinds.includes(kind), `expected ${kind} for ${html}`);
  }

  assert.deepEqual(
    auditOfflineHtml('<img src="data:image/png;base64,AA" alt=""><a href="#x">x</a><a href="https://example.org">e</a><style>body{background:url(data:image/png;base64,AA)}</style>'),
    [],
    'data URIs, fragments, and external destinations are all legitimate',
  );
});

test('missing essential content is reported rather than shipped', () => {
  const content = loadValidContent();
  const html = render(content).replace(esc(content.chapters[0].closing), '');
  const problems = auditContentCoverage(html, content);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].kind, 'chapter-closing');
});

test('leaked authoring provenance is reported rather than shipped', () => {
  const content = loadValidContent();
  const html = `${render(content)}<p>${esc(content.provenance[0].note)}</p>`;
  const problems = auditContentCoverage(html, content);
  assert.deepEqual(problems.map((problem) => problem.kind), ['provenance-leak']);
});
