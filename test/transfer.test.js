/**
 * The approved copy, and nothing else.
 *
 * The owner approved two artefacts on 11 October 2026 and asked for them to be
 * integrated exactly: `docs/editorial/full-essay-v2.md`, the essay as a
 * reader-legible document, and `docs/editorial/full-essay-handoff-v2.json`,
 * the same copy in machine form. Everything a reader sees has to come from
 * them. These checks read both files directly and compare them against the
 * content document and against the rendered pages — part by part, paragraph by
 * paragraph, in order — so a changed, reordered, missing or invented line fails
 * here rather than reaching a reader.
 *
 * What these checks are not: editorial approval. They establish that the
 * published copy is the supplied copy. Whether the supplied copy is good is the
 * owner's judgement, and it was given separately.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { APPROVED_ESSAY, SUPERSEDED_SCRIPT, visibleText, countWords } from '../src/content/transfer.js';
import { buildContent, serialise } from '../src/tools/transfer.js';
import { renderEssay, renderSourcesPage, esc } from '../src/runtime/render.js';
import { readerSentences } from '../src/build/verify.js';
import { loadValidContent, repoRoot } from './helpers.js';
import { parseHtml } from './support/dom.js';

const essayMarkdown = readFileSync(join(repoRoot, APPROVED_ESSAY.markdown.path), 'utf8');
const handoffJson = readFileSync(join(repoRoot, APPROVED_ESSAY.handoff.path), 'utf8');
const handoff = JSON.parse(handoffJson);
const content = loadValidContent();

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

/** Every approved part, in the order the approved handoff puts them. */
const approvedParts = handoff.chapters.flatMap((chapter) => chapter.parts);
const contribution = JSON.parse(readFileSync(join(repoRoot, 'docs/editorial/contribution-amendment.json'), 'utf8'));
const contributionById = new Map(contribution.scenes.map((scene) => [scene.id, scene]));

/* --- The approved documents ----------------------------------------------- */

test('both approved documents are still the revisions the owner approved', () => {
  assert.equal(sha256(essayMarkdown), APPROVED_ESSAY.markdown.sha256);
  assert.equal(sha256(handoffJson), APPROVED_ESSAY.handoff.sha256);
  assert.equal(content.source.essay.sha256, APPROVED_ESSAY.markdown.sha256);
  assert.equal(content.source.handoff.sha256, APPROVED_ESSAY.handoff.sha256);

  // The authorization record binds the same two checksums, so the thing that
  // was authorized and the thing that is published are one revision.
  const authorization = JSON.parse(
    readFileSync(join(repoRoot, 'docs/editorial/integration-authorization.json'), 'utf8'),
  );
  assert.equal(authorization.replacement_integration_authorized, true);
  assert.equal(authorization.files['full-essay-v2.md'].sha256, APPROVED_ESSAY.markdown.sha256);
  assert.equal(authorization.files['full-essay-handoff-v2.json'].sha256, APPROVED_ESSAY.handoff.sha256);

  // And what it does not authorize is recorded just as plainly.
  assert.equal(authorization.production_release_authorized, false);
  assert.equal(authorization.final_layout_owner_review, 'pending');
});

test('the superseded script is kept as provenance, and is not what this builds from', () => {
  const script = readFileSync(join(repoRoot, SUPERSEDED_SCRIPT.path), 'utf8');
  assert.equal(sha256(script), SUPERSEDED_SCRIPT.sha256, 'the superseded script was edited');
  assert.equal(content.source.supersedes.sha256, SUPERSEDED_SCRIPT.sha256);

  // Its copy is gone from the published essay. A sentence from it that still
  // appeared would mean the two revisions had been mixed.
  const html = renderEssay(content, { mode: 'hosted', stylesheetUrl: 's.css', scriptUrl: 'r.js' });
  for (const sentence of ['Masaya lang tumawa with friends', 'No special occasion']) {
    const inScript = script.includes(sentence);
    assert.ok(inScript, `the superseded script should contain "${sentence}"`);
  }
  // The one line both revisions carry is TJ's, which the approved essay keeps
  // deliberately; the scene titles it replaced do not survive. "Back to the
  // afternoon" is deliberately not on this list: it was a scene title in the
  // old script and is a chapter title in the new essay, so its presence is
  // approved copy rather than a leak.
  for (const title of ['No special occasion', 'Three answers', 'Where we\'re speaking from', 'One bad day']) {
    assert.ok(!html.includes(`>${esc(title)}<`), `a superseded scene title reached the page: ${title}`);
  }
});

test('the committed content document is the one the approved essay transfers to', async () => {
  const rebuilt = serialise(await buildContent());
  const committed = readFileSync(join(repoRoot, 'content/content.json'), 'utf8');
  assert.equal(rebuilt, committed,
    'content/content.json has drifted from the approved essay; run npm run content:transfer');
});

/* --- Copy, part by part --------------------------------------------------- */

test('every part carries the approved copy, by its own checksum', () => {
  assert.equal(approvedParts.length, 31);
  assert.equal(content.scenes.length, 31);

  content.scenes.forEach((scene, index) => {
    const approved = approvedParts[index];
    assert.equal(scene.partKey, approved.key, `part ${index + 1} is not the approved part`);
    assert.equal(scene.title, contributionById.get(scene.id)?.title ?? approved.title);

    // The copy the handoff records for this part, by the checksum it records
    // for it, and present verbatim in the Markdown the owner read.
    assert.equal(sha256(approved.reader_copy_markdown), approved.reader_copy_sha256, approved.key);
    assert.ok(essayMarkdown.includes(approved.reader_copy_markdown),
      `${approved.key}: the approved copy is not in the essay document verbatim`);
  });
});

test('every paragraph matches the approved paragraph, in order and in kind', () => {
  let paragraphs = 0;
  content.scenes.forEach((scene, index) => {
    const approved = contributionById.get(scene.id) ?? approvedParts[index];
    assert.equal(scene.blocks.length, approved.paragraphs.length, `${approved.key}: paragraph count`);

    scene.blocks.forEach((block, blockIndex) => {
      paragraphs += 1;
      const source = approved.paragraphs[blockIndex];
      assert.equal(block.kind, source.kind, `${approved.key}[${blockIndex}]: kind`);
      assert.equal(block.speaker, source.speaker ?? null, `${approved.key}[${blockIndex}]: speaker`);

      // The authored paragraph, reassembled: the text parts joined back with
      // each citation marker put back where the author wrote it.
      const rebuilt = block.parts
        .map((part) => (part.text === undefined ? `[${part.citation}]` : part.text))
        .join('');
      const authored = source.markdown.replace(/\[(\d{1,2})\]\((https?:\/\/[^\s)]+)\)/g, '[$1]');
      assert.equal(rebuilt, authored, `${approved.key}[${blockIndex}]: the sentence changed`);
    });
  });
  assert.equal(paragraphs, 130, 'the four-card contribution changes the base 123 paragraphs to 130');
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
  // Narration is unlabelled: the approved essay gives the narrator no visible
  // name, and a rendered "Narrator" would be a word the owner did not write.
  assert.ok(!html.includes('>Narrator<'));
  // The approved essay is almost entirely narration; one paragraph is TJ's.
  assert.equal(document.querySelectorAll('.line').length, 5, 'four basketball lines and one canteen reflection');
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

  // The marker leads to the register entry, not to the work. The approved
  // copy writes the work's own address beside the number; that address
  // belongs to the entry, where the access note and the limitation are.
  for (const source of content.sourcesPage.sources) {
    assert.ok(!html.includes(`>${esc(source.url)}<`), `a work's address reached the essay: ${source.url}`);
  }
  assert.ok(!html.includes('](http'), 'a raw markdown link survived the transfer');
});

test('no renderer-added prose reaches the essay', () => {
  const html = renderEssay(content, { mode: 'hosted', stylesheetUrl: 's.css', scriptUrl: 'r.js' });
  const document = parseHtml(html);
  const approved = new Set([
    ...readerSentences(content),
    ...content.chapters.map((chapter) => chapter.title),
    ...Object.values(content.interface),
    // The credit footnote is two lines in one paragraph; its own text is
    // both lines with the break between them.
    content.landing.credit.map((line) => line.map((part) => part.text).join('')).join(''),
    ...content.assets.flatMap((asset) => asset.labels.map((label) => label.text)),
    ...content.scenes.flatMap((scene) => scene.visual.views.map((view) => view.label)).filter(Boolean),
  ]);

  // Every visible string in the essay body is one the owner approved. The
  // numbered citation labels are the one structural addition, and the approved
  // interface names them. Each element is judged on the text it holds itself,
  // so a container is not read as the run-together text of its children.
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

/* --- The interface -------------------------------------------------------- */

test('every control name is the one the approved handoff supplies', () => {
  const ui = handoff.interface;
  assert.deepEqual([content.interface.back, content.interface.next], ui.footer);
  assert.deepEqual([content.interface.hideChapters, content.interface.showChapters], ui.desktop_sidebar_toggle);
  assert.deepEqual([content.interface.chapters, content.interface.closeChapters], ui.phone_drawer);
  assert.deepEqual([content.interface.continuous, content.interface.sources], ui.secondary_sidebar);
  assert.equal(content.interface.partView, ui.continuous_mode_return);
  assert.equal(content.interface.backToReading, ui.source_return);
  assert.equal(content.interface.skip, ui.skip_link);
  assert.equal(content.interface.readAgain, ui.end_content_action);
  assert.equal(content.interface.begin, ui.landing_action);
  // The owner's reader amendment gives the title its question mark.
  assert.equal(content.interface.title, `${handoff.website_title}?`);

  // The approved interface names no Print control and no counter, so the
  // contract carries neither.
  assert.equal(content.interface.print, undefined);
  assert.match(ui.toolbar_limits, /No Print button, counters or scene badge/);
});

/* --- The Sources & Credits page ------------------------------------------- */

test('the Sources & Credits page carries only approved copy', () => {
  const page = content.sourcesPage;
  const amendment = JSON.parse(readFileSync(join(repoRoot, 'docs/editorial/polish-amendment.json'), 'utf8'));
  const approved = handoff.source_page_markdown + '\n' + amendment.credit_items.join('\n');
  const html = renderSourcesPage(content, { mode: 'hosted', stylesheetUrl: 's.css', scriptUrl: 'r.js' });

  assert.ok(html.includes(esc(page.title)));
  // Each block is checked part by part, because a part may be a link: the
  // approved page writes it as Markdown and the page writes it as an anchor,
  // so the label and the destination are checked rather than the syntax.
  for (const key of ['intro', 'classNote', 'credits', 'methodNote']) {
    for (const part of page[key]) {
      if (part.link === undefined) {
        assert.ok(approved.includes(part.text), `${key} carries text the approved page does not: ${part.text}`);
      } else {
        assert.ok(approved.includes(`[${part.link}](${part.url})`), `${key} link is not the approved one: ${part.link}`);
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

  // The register's bibliographic lines and access notes are the approved ones,
  // entry by entry and in the approved order.
  page.sources.forEach((source, index) => {
    const entry = handoff.sources[index];
    if (!entry) {
      assert.deepEqual(source, contribution.sources[index - handoff.sources.length]);
      assert.ok(html.includes(esc(source.citation)));
      return;
    }
    assert.equal(source.number, entry.number);
    assert.equal(source.sourceId, entry.id, `entry ${entry.number} changed R identity`);
    assert.ok(entry.entry_markdown.includes(source.citation), `entry ${entry.number}: bibliographic line`);
    assert.ok(approved.includes(`${entry.number}. ${entry.entry_markdown}`), `entry ${entry.number} is not on the page`);
    assert.ok(html.includes(esc(source.url)));
  });
});

/* --- Old addresses -------------------------------------------------------- */

test('every published address is relocated as the approved handoff says', () => {
  const approved = handoff.proposed_old_address_relocations;
  assert.equal(content.relocations.length, approved.length);
  content.relocations.forEach((relocation, index) => {
    assert.equal(relocation.from, approved[index].old_scene_id);
    assert.equal(relocation.partKey, approved[index].new_part_key);
    const destination = content.scenes.find((scene) => scene.id === relocation.to);
    assert.ok(destination, `${relocation.from} leads nowhere`);
    assert.equal(destination.partKey, approved[index].new_part_key);
  });

  // The approved id policy: changed copy never reuses a published address.
  const parts = new Set(content.scenes.map((scene) => scene.id));
  for (const relocation of content.relocations) {
    assert.ok(!parts.has(relocation.from), `${relocation.from} was reused for changed copy`);
  }
  assert.match(handoff.id_policy, /Never reuse s088–s132 for changed copy/);
});

/* --- The measurement ------------------------------------------------------ */

test('the recorded word count is the rule applied to the approved copy', () => {
  assert.equal(content.measure.words, countWords(content.scenes));
  assert.match(content.measure.rule, /31 main-path parts/);
  // The approved essay is substantially longer than the script it replaced,
  // which is what the owner asked for. The figure is recomputed rather than
  // asserted at a number that would have to be edited by hand.
  assert.ok(content.measure.words > 8000, `measured ${content.measure.words} words`);

  // And no reader is shown it.
  const html = renderEssay(content, { mode: 'hosted', stylesheetUrl: 's.css', scriptUrl: 'r.js' });
  assert.ok(!html.includes(String(content.measure.words)));
  assert.ok(!html.includes(content.measure.rule));
});

test('no scaffolding from either superseded build survives', () => {
  const html = renderEssay(content, { mode: 'hosted', stylesheetUrl: 's.css', scriptUrl: 'r.js' });
  for (const phrase of ['mainPath', 'reviewStatus', 'Beat ', 'detail panel', 'progress']) {
    assert.ok(!html.includes(phrase), `superseded scaffolding reached the page: ${phrase}`);
  }
  // The authoring keys are an internal mapping, not something a reader meets.
  assert.ok(!html.includes('v2-c1-p1'));
  for (const scene of content.scenes) assert.ok(!html.includes(`>${scene.partKey}<`));
});

test('visibleText reassembles a sentence the way a reader meets it', () => {
  assert.equal(visibleText([{ text: 'A claim' }, { citation: 7 }, { text: ' and more.' }]),
    'A claim[7] and more.');
  assert.equal(visibleText([{ text: 'No citation here.' }]), 'No citation here.');
});
