/**
 * The approved copy, and nothing else.
 *
 * The owner approved one artefact: `docs/redesign/approved-scene-script.md`.
 * Everything a reader sees has to come from it. These checks read that file
 * directly and compare it against the content document and against the
 * rendered pages, sentence by sentence and in order, so a changed, reordered,
 * missing or invented line fails here rather than reaching a reader.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { APPROVED_SCRIPT, visibleText, countWords } from '../src/content/transfer.js';
import { buildContent, serialise } from '../src/tools/transfer.js';
import { renderEssay, renderSourcesPage, esc } from '../src/runtime/render.js';
import { readerSentences } from '../src/build/verify.js';
import { loadValidContent, repoRoot } from './helpers.js';
import { parseHtml } from './support/dom.js';

const script = readFileSync(join(repoRoot, APPROVED_SCRIPT.path), 'utf8');
const content = loadValidContent();

/** Every `Narrator:`/`TJ:` line of reader copy, in the file's own order. */
function approvedCopy() {
  const lines = [];
  let inScene = false;
  let copy = false;
  for (const raw of script.split('\n')) {
    const line = raw.trimEnd();
    if (/^### s\d{3} \| /.test(line)) {
      inScene = true;
      copy = false;
      lines.push({ kind: 'title', text: line.replace(/^### s\d{3} \| /, '') });
      continue;
    }
    if (/^## /.test(line)) inScene = false;
    if (!inScene) continue;
    if (line === '**Reader copy**') { copy = true; continue; }
    if (line.startsWith('**Production:**')) { copy = false; continue; }
    if (!copy || line === '') continue;
    const spoken = line.match(/^(Narrator|TJ|Koj|Vier): (.+)$/);
    assert.ok(spoken, `unlabelled reader copy in the approved script: ${line}`);
    // What the reader sees: the authored sentence with `[^07]` shown as `[7]`.
    lines.push({ kind: 'copy', speaker: spoken[1], text: spoken[2].replace(/\[\^0?(\d+)\]/g, '[$1]') });
  }
  return lines;
}

test('the approved script is still the revision the owner approved', () => {
  assert.equal(createHash('sha256').update(script).digest('hex'), APPROVED_SCRIPT.sha256);
  assert.equal(content.source.sha256, APPROVED_SCRIPT.sha256);
});

test('the committed content document is the one the approved script transfers to', async () => {
  const rebuilt = serialise(await buildContent());
  const committed = readFileSync(join(repoRoot, 'content/content.json'), 'utf8');
  assert.equal(rebuilt, committed,
    'content/content.json has drifted from the approved script; run npm run content:transfer');
});

test('every reader-visible sentence matches the approved script, in order', () => {
  const approved = approvedCopy();
  const transferred = [];
  for (const chapterId of content.chapters.map((chapter) => chapter.id)) {
    const chapter = content.chapters.find((entry) => entry.id === chapterId);
    for (const sceneId of chapter.sceneIds) {
      const scene = content.scenes.find((entry) => entry.id === sceneId);
      transferred.push({ kind: 'title', text: scene.title });
      for (const block of scene.blocks) {
        transferred.push({
          kind: 'copy',
          speaker: block.kind === 'narration' ? 'Narrator' : block.speaker,
          text: visibleText(block.parts),
        });
      }
    }
  }
  assert.deepEqual(transferred, approved);
});

test('the rendered essay carries those same sentences, in the same order', () => {
  const html = renderEssay(content, { mode: 'hosted', stylesheetUrl: 's.css', scriptUrl: 'r.js' });
  const document = parseHtml(html);
  const rendered = [];
  for (const scene of document.querySelectorAll('[data-scene]')) {
    rendered.push(scene.querySelector('.scene-title').textContent);
    for (const block of scene.querySelectorAll('.narration, .line')) {
      const text = block.localName === 'p' && block.getAttribute('class') === 'narration'
        ? block.textContent
        : block.querySelector('.line-text').textContent;
      rendered.push(text);
    }
  }
  assert.deepEqual(rendered, readerSentences(content).map((text) => text));
});

test('a speaker label is an element, never part of the sentence', () => {
  const html = renderEssay(content, { mode: 'hosted', stylesheetUrl: 's.css', scriptUrl: 'r.js' });
  const document = parseHtml(html);
  for (const line of document.querySelectorAll('.line')) {
    const speaker = line.querySelector('.speaker').textContent;
    assert.ok(['TJ', 'Koj', 'Vier'].includes(speaker), `unexpected speaker ${speaker}`);
    assert.ok(!line.querySelector('.line-text').textContent.startsWith(`${speaker}:`));
  }
  // Narration is unlabelled: the approved script gives the narrator no visible
  // name, and a rendered "Narrator" would be a word the owner did not write.
  assert.ok(!html.includes('>Narrator<'));
});

test('citations are normalised to the approved visible and accessible forms', () => {
  const html = renderEssay(content, {
    mode: 'hosted',
    stylesheetUrl: 's.css',
    scriptUrl: 'r.js',
    sourceHref: (number, scene) => `sources.html?from=${scene}&view=scene#source-${number}`,
  });
  const document = parseHtml(html);
  const links = document.querySelectorAll('.citation');
  assert.ok(links.length >= 26);

  for (const link of links) {
    const number = Number(link.getAttribute('data-citation'));
    assert.equal(link.textContent, `[${number}]`);
    assert.equal(link.getAttribute('aria-label'), `Source ${number}`);
    assert.match(link.getAttribute('href'), new RegExp(`#source-${number}$`));
  }
  // The authoring marker never reaches the page.
  assert.ok(!html.includes('[^'), 'a raw footnote marker survived the transfer');
});

test('no renderer-added prose reaches the essay', () => {
  const html = renderEssay(content, { mode: 'hosted', stylesheetUrl: 's.css', scriptUrl: 'r.js' });
  const document = parseHtml(html);
  const approved = new Set([
    ...readerSentences(content),
    ...content.chapters.map((chapter) => chapter.title),
    ...Object.values(content.interface),
    ...content.assets.flatMap((asset) => asset.labels.map((label) => label.text)),
    ...content.scenes.flatMap((scene) => scene.visual.views.map((view) => view.label)).filter(Boolean),
  ]);

  // Every visible string in the essay body is one the owner approved. The
  // numbered citation labels are the one structural addition, and the approved
  // interface section names them. Each element is judged on the text it holds
  // itself, so a container is not read as the run-together text of its
  // children.
  const ownText = (node) => node.childNodes
    .filter((child) => child.nodeType === 3)
    .map((child) => child.data)
    .join('');

  for (const node of document.querySelectorAll('p, h1, h2, h3, a, button, span, li')) {
    const text = ownText(node).replace(/\s+/g, ' ').trim();
    if (text === '') continue;
    if (/^\[\d+\]$/.test(text)) continue;
    if (approved.has(text)) continue;
    // A paragraph containing a citation link reads as sentence + [n] + rest;
    // its own sentence is the approved one with the markers restored.
    const normalised = text.replace(/\s*\[\d+\]\s*/g, (match) => (match.startsWith(' ') ? ' ' : ''));
    const matches = [...approved].some((value) => value.replace(/\s*\[\d+\]\s*/g, ' ').replace(/\s+/g, ' ').trim()
      === normalised.replace(/\s+/g, ' ').trim());
    assert.ok(matches, `unapproved text reached the essay: ${JSON.stringify(text.slice(0, 90))}`);
  }
});

test('the Sources & Credits page carries only approved copy', () => {
  const page = content.sourcesPage;
  const html = renderSourcesPage(content, { mode: 'hosted', stylesheetUrl: 's.css', scriptUrl: 'r.js' });

  assert.ok(html.includes(esc(page.title)));
  // Each block is checked part by part, because a part may be a link: the
  // approved file writes it as Markdown and the page writes it as an anchor,
  // so the label and the destination are checked rather than the syntax.
  for (const key of ['intro', 'classNote', 'credits', 'methodNote']) {
    for (const part of page[key]) {
      if (part.link === undefined) {
        assert.ok(script.includes(part.text), `${key} carries text the approved script does not: ${part.text}`);
      } else {
        assert.ok(script.includes(`[${part.link}](${part.url})`), `${key} link is not the approved one: ${part.link}`);
        assert.ok(html.includes(esc(part.url)));
      }
    }
  }
  // The font grant and the visual reference both stay on this page.
  const credits = page.credits.map((part) => (part.link === undefined ? part.text : part.link)).join('');
  assert.match(credits, /Futura Handwritten/);
  assert.match(credits, /Billy Snyder/);
  assert.match(credits, /The Evolution of Trust/);
  assert.equal(page.returnLabel, 'Back to reading');

  // The register's bibliographic lines and access notes are the approved ones.
  for (const source of page.sources) {
    assert.ok(script.includes(source.citation), `citation ${source.number} is not in the approved script`);
    assert.ok(html.includes(source.url));
  }
});

test('the measured word count is recomputed, not stored as a target', () => {
  assert.equal(content.measure.words, countWords(content.scenes));
  assert.match(content.measure.rule, /excluding speaker labels, citation markers/);
  // The handoff estimated 4,138; the rule above recomputes 4,137 from the
  // approved copy. Neither number is a band the copy may be trimmed to reach.
  assert.equal(content.measure.words, 4137);
});

test('the approved structure is intact: 45 scenes, 8 chapters, 26 sources', () => {
  assert.equal(content.scenes.length, 45);
  assert.equal(content.chapters.length, 8);
  assert.equal(content.sourcesPage.sources.length, 26);
  assert.equal(content.scenes[0].id, 's088');
  assert.equal(content.scenes.at(-1).id, 's132');
  assert.deepEqual(
    content.chapters.map((chapter) => chapter.sceneIds[0]),
    ['s088', 's092', 's097', 's103', 's109', 's114', 's122', 's128'],
  );
});

test('no scaffolding from the superseded storyboard survived', () => {
  const serialised = JSON.stringify(content);
  for (const term of ['readingTimeEstimate', 'artId', 'provenance', 'detailIds', 'conceptIds', 'limitations']) {
    assert.ok(!serialised.includes(term), `the content document still contains ${term}`);
  }
});
