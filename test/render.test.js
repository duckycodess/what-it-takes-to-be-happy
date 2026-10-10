import test from 'node:test';
import assert from 'node:assert/strict';

import { renderDocument, esc } from '../src/runtime/render.js';
import { auditContentCoverage, auditOfflineHtml, auditBundledLicence, auditInlineArtwork } from '../src/build/verify.js';
import { SOURCE_EVIDENCE_LEVELS } from '../src/content/schema.js';
import { loadValidContent, byId } from './helpers.js';

const render = (content, overrides = {}) =>
  renderDocument(content, {
    mode: 'hosted',
    stylesheetUrl: 'styles.css',
    scriptUrl: 'reader.js',
    fontNotice: 'Bundled fallback font.',
    fontLicense: 'Permission is hereby granted to the fictional holder of this test licence.\n',
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
  const panels = [...html.matchAll(/<details class="detail"([^>]*)>/g)].map((match) => match[1]);

  assert.equal(panels.length, content.details.length, 'every authored panel is rendered');
  for (const attributes of panels) {
    assert.match(attributes, /\bopen\b/, 'a panel that is collapsed in the markup would hide its text from print and from a scriptless browser');
  }
  // The identifier is what lets the browser script give a reader their own
  // open-or-closed choice back after a view switch or a print.
  for (const detail of content.details) {
    assert.ok(html.includes(`data-detail="${detail.id}"`), `${detail.id} is not addressable`);
  }
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

test('each source is shown at the evidence level it actually reached', () => {
  const content = loadValidContent();
  const html = render(content);

  for (const source of content.sources) {
    const level = SOURCE_EVIDENCE_LEVELS[source.reviewStatus];
    assert.ok(html.includes(`data-status="${source.reviewStatus}">${esc(level.label)}</p>`), `${source.id} should show "${level.label}"`);

    if (source.supportedClaim) {
      // The claim is phrased against what was read, so an abstract or a
      // publisher description is never presented as a passage from the work.
      assert.ok(html.includes(`<span class="label">${esc(level.claimLabel)}</span> ${esc(source.supportedClaim)}`), `${source.id} should attribute its claim to ${level.claimLabel}`);
    } else {
      assert.ok(html.includes(esc(source.intendedRole)), `${source.id} should still say why the notes list it`);
    }
    assert.ok(html.includes(esc(source.limitation)), `${source.id} should keep its limitation visible`);
  }
});

test('an unopened source shows no supported claim anywhere in the output', () => {
  const content = loadValidContent();
  const html = render(content);
  const unopened = content.sources.filter((source) => !SOURCE_EVIDENCE_LEVELS[source.reviewStatus].requiresSupportedClaim);
  assert.ok(unopened.length > 0, 'the fixture should include a source that could not be opened');

  for (const source of unopened) {
    assert.ok(
      html.includes(`<span class="label">Listed in the notes for</span> ${esc(source.intendedRole)}`),
      `${source.id} should say why the notes list it instead of claiming support`,
    );
    // Every block rendered for this source must be free of a supports line.
    const blocks = [...html.matchAll(/<li class="source"[^>]*>[\s\S]*?<\/li>/g)]
      .map((match) => match[0])
      .filter((block) => block.includes(esc(source.url)));
    assert.ok(blocks.length > 0, `${source.id} should appear in the output`);
    for (const block of blocks) {
      assert.ok(!block.includes('class="source-claim"'), `${source.id} must not show a supported claim`);
    }
  }
});

test('an abstract-level reading is never shown as a passage-level one', () => {
  const content = loadValidContent();
  const html = render(content);
  const abstract = content.sources.find((source) => source.reviewStatus === 'verified-abstract');
  const claimIndex = html.indexOf(esc(abstract.supportedClaim));
  assert.ok(claimIndex > 0);
  const preceding = html.slice(Math.max(0, claimIndex - 200), claimIndex);
  assert.match(preceding, /The abstract supports/);
  assert.ok(!/The passage read supports<\/span>\s*$/.test(preceding));
});

/* ---- The order a beat reads in ------------------------------------------ */

const blockOrder = (sceneHtml) =>
  [...sceneHtml.matchAll(/<(div class="narration"|ul class="dialogue"|aside class="limitations")/g)]
    .map((match) => match[1].split(' ')[0] === 'div' ? 'narration' : match[1].startsWith('ul') ? 'dialogue' : 'limitations');

/** One beat's markup: from its own element to wherever the next beat starts. */
function sceneHtml(html, id) {
  const start = html.indexOf(`<li class="scene" id="${id}"`);
  assert.ok(start >= 0, `${id} is not in the output`);
  const next = html.indexOf('<li class="scene" id="', start + 1);
  return html.slice(start, next < 0 ? undefined : next);
}

test('the essential blocks are rendered in the order the beat was authored in', () => {
  const content = loadValidContent();
  const scene = byId(content.scenes, 'sc-three-readings');
  assert.ok(scene.narration.length >= 2 && scene.limitations.length >= 1);

  // The caveat belongs before the narration in this arrangement, which a fixed
  // narration-then-caveat renderer would silently reverse.
  scene.mainPath = [
    { kind: 'limitations', index: 0 },
    { kind: 'narration', index: 1 },
    { kind: 'narration', index: 0 },
  ];
  const html = sceneHtml(render(content), scene.id);
  assert.deepEqual(blockOrder(html), ['limitations', 'narration']);
  assert.ok(html.indexOf(esc(scene.narration[1])) < html.indexOf(esc(scene.narration[0])), 'paragraphs follow the authored sequence');
  assert.ok(html.indexOf(esc(scene.limitations[0])) < html.indexOf(esc(scene.narration[1])), 'the caveat comes first because the beat says so');
});

test('consecutive blocks of one kind stay one block, so dialogue is still a list', () => {
  const content = loadValidContent();
  const scene = byId(content.scenes, 'sc-chosen-difficulty');
  scene.mainPath = [
    { kind: 'narration', index: 0 },
    { kind: 'dialogue', index: 0 },
    { kind: 'narration', index: 1 },
  ];
  const html = sceneHtml(render(content), scene.id);
  assert.deepEqual(blockOrder(html), ['narration', 'dialogue', 'narration'], 'a line between two paragraphs splits them');

  const together = loadValidContent();
  const same = byId(together.scenes, 'sc-chosen-difficulty');
  same.mainPath = [
    { kind: 'narration', index: 0 },
    { kind: 'narration', index: 1 },
    { kind: 'dialogue', index: 0 },
  ];
  assert.deepEqual(blockOrder(sceneHtml(render(together), same.id)), ['narration', 'dialogue']);
});

test('a beat that is deliberately text-only gets no frame rather than an empty one', () => {
  const content = loadValidContent();
  const scene = byId(content.scenes, 'sc-rest-without-a-reason');
  scene.visual.artId = null;
  scene.visual.artState = null;
  scene.visual.artAbsence = 'text-only';
  scene.visual.cast = [];

  const html = sceneHtml(render(content), scene.id);
  assert.ok(!html.includes('scene-visual-frame'), 'no bordered box where there is deliberately no drawing');
  assert.ok(!html.includes('scene-visual-pending'), 'and no notice saying a drawing is still to come');
  assert.ok(html.includes(esc(scene.visual.description)), 'the description still introduces the beat');

  // A beat whose drawing is merely not made yet is the other case, and it does
  // say so, because a reader should not have to guess.
  const draft = loadValidContent();
  const waiting = byId(draft.scenes, 'sc-rest-without-a-reason');
  waiting.visual.artId = null;
  waiting.visual.artState = null;
  waiting.visual.artAbsence = 'pending';
  assert.ok(sceneHtml(render(draft), waiting.id).includes('scene-visual-pending'));
});

test('the chapter list numbers the chapters the reader counts, and only those', () => {
  const content = loadValidContent();
  content.chapters[0].number = null;
  const html = render(content);
  const items = [...html.matchAll(/<a href="#[^"]+" data-chapter-link="[^"]+">(.*?)<\/a>/g)].map((match) => match[1]);

  assert.equal(items.length, content.chapters.length);
  assert.equal(items[0], esc(content.chapters[0].title), 'an unnumbered chapter is named, not counted');
  assert.match(items[1], /^<span class="chapter-number">2<\/span> /);

  // The beat controls need the same two facts, so the chapter carries them.
  assert.ok(!html.includes(`data-chapter="${content.chapters[0].id}" data-chapter-number`));
  assert.ok(html.includes(`data-chapter-number="${content.chapters[1].number}" data-chapter-count="${content.chapters.length - 1}"`));
});

/* ---- The drawings ------------------------------------------------------- */

const frames = (html) => [...html.matchAll(/<div class="scene-visual-frame"[\s\S]*?<\/div>/g)].map((match) => match[0]);

test('every drawn beat renders its drawing inline, at the state the content asked for', () => {
  const content = loadValidContent();
  const html = render(content);

  for (const scene of content.scenes) {
    const frame = frames(html).find((entry) => entry.includes(`data-art="${scene.visual.artId ?? 'none'}"`));
    assert.ok(frame, `${scene.id} should render a frame`);
  }

  const drawn = content.scenes.filter((scene) => scene.visual.artId !== null);
  assert.ok(drawn.length > 0, 'the fixture should exercise drawn beats');
  for (const scene of drawn) {
    assert.ok(html.includes(`data-art="${scene.visual.artId}" data-art-state="${scene.visual.artState}"`), `${scene.id} should settle into ${scene.visual.artState}`);
  }

  // The settled state is in the markup, not applied later by a script: print,
  // a scriptless browser, and the offline file all get the finished drawing.
  const revealed = drawn.filter((scene) => scene.visual.artState === 'revealed');
  assert.ok(revealed.length > 0);
  assert.ok(html.includes('data-art-layer="reveal"'));
  assert.ok(html.includes('data-art-layer="base"'));
});

test('the landing drawing is authored content, not a choice the renderer makes', () => {
  const content = loadValidContent();
  const html = render(content);
  const landing = html.slice(html.indexOf('<figure class="landing-art">'), html.indexOf('</figure>', html.indexOf('<figure class="landing-art">')));

  assert.ok(landing.includes(`data-art="${content.project.visual.artId}" data-art-state="${content.project.visual.artState}"`));
  assert.equal((landing.match(/<li class="art-label"/g) ?? []).length, content.project.visual.cast.length);
  assert.ok(landing.includes(esc(content.project.visual.description)), 'the landing caption is the authored description');

  // Who stands around the question, and what each of them is feeling, follow
  // the document. An opening that picked its own cast would be inventing one.
  for (const appearance of content.project.visual.cast) {
    const character = byId(content.cast, appearance.characterId);
    const expression = character.expressions.find((entry) => entry.id === appearance.expressionId);
    // A contributor is named with the nametag; an invented friend is named and
    // said to be invented, which is a different label on purpose.
    const name = character.role === 'member'
      ? `<span class="nametag">${esc(character.displayName)}</span>`
      : `<span class="figure-name">${esc(character.displayName)}</span><span class="fiction-note">fictional illustration</span>`;
    assert.ok(landing.includes(`${name}<span class="expression">${esc(expression.label)}</span>`));
    assert.ok(landing.includes(`data-figure="${character.artId}" data-expression="${expression.artId}"`));
  }

  const changed = loadValidContent();
  changed.project.visual.artId = 'art-figure-row';
  changed.project.visual.artState = 'situation';
  changed.project.visual.cast = [{ characterId: 'cast-vier', expressionId: 'ex-uncertain' }];
  const other = render(changed);
  assert.ok(other.includes('<figure class="landing-art">\n<div class="scene-visual-frame" data-art="art-figure-row"'));
  assert.ok(!other.includes('data-art="art-opening-question"'));
});

test('a beat with no drawing keeps its figures and its description', () => {
  const content = loadValidContent();
  const scene = byId(content.scenes, 'sc-ordinary-afternoon');
  scene.visual.artId = null;
  scene.visual.artState = null;

  const html = render(content);
  const frame = frames(html).find((entry) => entry.includes('data-art="none"'));
  assert.ok(frame, 'a beat without a composition still renders its frame');
  assert.ok(!frame.includes('<svg'), 'nothing is drawn where nothing has been drawn');
  assert.ok(frame.includes('<span class="nametag">TJ</span>'), 'the figures present are still named');
  assert.ok(html.includes(esc(scene.visual.description)), 'the description still carries the beat');
});

test('names sit above heads as browser text, positioned by the drawing itself', () => {
  const content = loadValidContent();
  const html = render(content);

  const labels = [...html.matchAll(/<li class="art-label" data-role="(\w+)" style="--art-x:([\d.]+)%;--art-y:([\d.]+)%"><span class="nametag">([^<]+)<\/span><span class="expression">([^<]+)<\/span>/g)];
  assert.ok(labels.length >= 10, `expected a label for every drawn figure, found ${labels.length}`);

  for (const [, role, x, y, name, state] of labels) {
    assert.ok(['member', 'friend'].includes(role));
    assert.ok(Number(x) > 0 && Number(x) < 100, `${name} is anchored off the frame`);
    assert.ok(Number(y) > 0 && Number(y) < 100, `${name} is anchored off the frame`);
    assert.match(name, /\S/);
    assert.match(state, /\S/);
  }

  // The nametag is text in the page. Nothing in the artwork spells a name.
  for (const drawing of [...html.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((match) => match[0])) {
    assert.ok(!/<text\b/.test(drawing));
    for (const member of content.cast) assert.ok(!drawing.includes(member.displayName));
  }
});

test('the same figure is drawn differently when the content says it feels differently', () => {
  const content = loadValidContent();
  const one = render(content);

  const changed = loadValidContent();
  byId(changed.scenes, 'sc-ordinary-afternoon').visual.cast[0].expressionId = 'ex-sad';
  const other = render(changed);

  assert.notEqual(one, other, 'an expression change must reach the drawing');
  assert.ok(other.includes('data-expression="sadness"'));
});

test('every drawing in an output is self-contained and carries no lettering', () => {
  assert.deepEqual(auditInlineArtwork(render(loadValidContent())), []);

  const cases = [
    ['<svg><image href="art.png"/></svg>', /raster file/],
    ['<svg><use href="#head"/></svg>', /identifier/],
    ['<svg><text x="0">TJ</text></svg>', /Lettering/],
    ['<svg><g id="head"></g></svg>', /identifier/],
    ['<svg><circle fill="url(#g)"/></svg>', /another resource/],
    ['<svg><style>.a{font-family:Futura}</style></svg>', /stylesheet or script/],
  ];
  for (const [html, message] of cases) {
    const problems = auditInlineArtwork(html);
    assert.ok(problems.length > 0, `expected a problem for ${html}`);
    assert.ok(problems.some((problem) => message.test(problem.message)), `${html}: ${problems.map((p) => p.message).join(' / ')}`);
  }
});

test('the bundled font licence travels inside the document', () => {
  const content = loadValidContent();
  const licence = 'Permission is hereby granted to the fictional holder of this test licence.\n';
  assert.deepEqual(auditBundledLicence(render(content), licence), []);
  assert.equal(auditBundledLicence('<p>no licence here</p>', licence).length, 1);
});
