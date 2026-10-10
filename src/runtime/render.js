/**
 * The shared renderer.
 *
 * Every output — the hosted page, the continuous reading and print view, and
 * the self-contained offline file — is this one function with different
 * resource URLs. The whole essay is rendered into the markup, and the browser
 * script only changes which part of it is on screen, so the printed page, a
 * browser with scripting unavailable, and the offline file all still carry the
 * complete argument.
 *
 * `provenance` is authoring material and is deliberately never read here.
 */

import { SOURCE_EVIDENCE_LEVELS } from '../content/schema.js';
import { renderSceneArt } from '../art/index.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes text for element content and for double-quoted attributes alike. */
export const esc = (value) => String(value).replace(/[&<>"']/g, (character) => ESCAPES[character]);

const paragraphs = (lines, className) =>
  lines.map((line) => `<p${className ? ` class="${className}"` : ''}>${esc(line)}</p>`).join('\n');

const indexBy = (list) => new Map(list.map((entry) => [entry.id, entry]));

/**
 * A source is shown with the evidence level the audit actually reached, and
 * what it supports is phrased against that level. A work that was never opened
 * shows no supported claim at all; it shows why the notes list it.
 *
 * The same block is used beside a beat and in the register. Only the register
 * copy carries the identifier, because that is the one a fragment link points
 * at and an element identifier may appear once. The beat copy therefore keeps
 * the level and the limitation in place *and* offers the register link, so a
 * reader never has to leave the beat to learn how far the work was checked.
 *
 * @param {object} source
 * @param {{register?: boolean}} [options] `register` marks the anchored copy
 */
function renderSourceReference(source, options = {}) {
  const level = SOURCE_EVIDENCE_LEVELS[source.reviewStatus];

  const claim = source.supportedClaim
    ? `<p class="source-claim"><span class="label">${esc(level.claimLabel)}</span> ${esc(source.supportedClaim)}</p>`
    : `<p class="source-role"><span class="label">Listed in the notes for</span> ${esc(source.intendedRole)}</p>`;

  const detail = [
    source.citation ? `<p class="source-citation">${esc(source.citation)}</p>` : '',
    source.evidenceBasis ? `<p class="source-basis"><span class="label">What was read</span> ${esc(source.evidenceBasis)}</p>` : '',
    claim,
    `<p class="source-limit"><span class="label">Limitation</span> ${esc(source.limitation)}</p>`,
  ].filter(Boolean).join('\n');

  const anchor = options.register ? ` id="${esc(source.id)}" tabindex="-1"` : '';
  const register = options.register
    ? ''
    : `\n<p class="source-more"><a href="#${esc(source.id)}" data-source-link="${esc(source.id)}">Full entry in the sources</a></p>`;

  return `<li class="source"${anchor} data-source="${esc(source.id)}">
<p class="source-head"><a href="${esc(source.url)}" rel="noreferrer">${esc(source.label)}</a> <span class="source-type">${esc(source.type)}</span></p>
<p class="source-status" data-status="${esc(source.reviewStatus)}">${esc(level.label)}</p>
${detail}${register}
</li>`;
}

const percent = (value) => `${(Math.round(value * 100) / 100).toFixed(2)}%`;

/**
 * The name and state of one figure, as browser text rather than lettering.
 *
 * A contributor gets a nametag: the boxed name above the head that says this
 * drawing stands for a person who wrote something here. An invented friend
 * gets their name too — a reader has to be able to follow Bob from beat to
 * beat — but not that nametag.
 *
 * That the friend is invented is said under the drawing instead of beside the
 * name. Set over a head it was six and a half pixels tall on a phone, which is
 * not a statement anybody can read, and the phrase is longer than any name, so
 * it was also what pushed labels into each other on a crowded beat. Under the
 * drawing it is ordinary body text, in every view and in print.
 */
function renderFigureLabel(character, expression, anchor, placement) {
  const position = placement === 'over' && anchor
    ? ` style="--art-x:${percent(anchor.x)};--art-y:${percent(anchor.y)}"`
    : '';
  const name = character.role === 'member'
    ? `<span class="nametag">${esc(character.displayName)}</span>`
    : `<span class="figure-name">${esc(character.displayName)}</span>`;
  return `<li class="art-label" data-role="${esc(character.role)}"${position}>${name}<span class="expression">${esc(expression.label)}</span></li>`;
}

/* --------------------------------------------------------------------------
 * Where the names go.
 *
 * A name sits above its own head wherever there is room for it. On a crowded
 * drawing there is not: eight figures across one frame put labels through each
 * other, which a reader meets as two names on top of one another rather than
 * as a layout decision. So the drawing is asked, before anything is written,
 * whether the labels fit — and if any pair would collide or run off the edge,
 * the whole set moves into a row under the drawing, in the order the figures
 * stand in. All of them move together: half over and half under would read as
 * a mistake.
 *
 * The budget is one measured number. A label is at most 12.4% of its frame's
 * width — measured in Chrome across every label in the essay, at a 360-pixel
 * phone layout and at a 1280-pixel desktop one, where the type is at the floor
 * and the ceiling of its clamp. 16% is that with room to spare, and the
 * browser suite measures the real boxes afterwards rather than trusting it.
 * ----------------------------------------------------------------------- */

/** The widest a label gets, as a share of the frame it is positioned in. */
const LABEL_WIDTH_SHARE = 16;

/**
 * @param {Array<{x: number, y: number}>} anchors the composition's own anchors
 * @returns {'over'|'list'} whether names can sit above the heads
 */
function labelPlacement(anchors) {
  // A drawing with nobody in it has no names to place. Eleven beats are the
  // narrator alone, and saying "list" about them would be a claim about a
  // layout that does not exist.
  if (anchors.length === 0) return 'none';
  if (anchors.length === 1) return edgesFit(anchors[0]) ? 'over' : 'list';
  const ordered = [...anchors].sort((a, b) => a.x - b.x);
  if (!ordered.every(edgesFit)) return 'list';
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].x - ordered[index - 1].x < LABEL_WIDTH_SHARE) return 'list';
  }
  return 'over';
}

/** A label is centred on its anchor, so it needs half its width either side. */
const edgesFit = (anchor) => anchor.x - LABEL_WIDTH_SHARE / 2 >= 0 && anchor.x + LABEL_WIDTH_SHARE / 2 <= 100;

/**
 * One authored drawing: a scene's, or the landing's.
 *
 * The illustration is inline SVG generated during the build, so it carries no
 * request, no font, and no external reference, and the single offline file owns
 * every line of it. Names sit above the heads as HTML text positioned over the
 * drawing: they stay selectable, they scale with the reader's own type size,
 * and they are never baked into the artwork.
 *
 * Everything drawn is named by the content document — the composition, the
 * state it settles into, who is in it, and what each of them is feeling. There
 * is no illustration in this file, including on the landing: an opening that
 * chose its own cast would be inventing one.
 *
 * A beat may have no composition yet. That too is declared in the content
 * document rather than guessed at here, and the figures and the written
 * description carry it exactly as they do in print.
 */
function renderVisual(visual, castById, className) {
  // A beat that is deliberately not an illustrated situation gets no frame at
  // all. An empty bordered box next to a source register would read as a
  // drawing that failed to arrive; the description still introduces what
  // follows, as it does everywhere else.
  if (visual.artAbsence === 'text-only') {
    return `<p class="scene-visual-note" data-art="text-only">${esc(visual.description)}</p>`;
  }

  const appearances = visual.cast.map((appearance) => {
    const character = castById.get(appearance.characterId);
    const expression = character.expressions.find((entry) => entry.id === appearance.expressionId);
    return { character, expression };
  });

  const drawing = visual.artId
    ? renderSceneArt({
      artId: visual.artId,
      artState: visual.artState,
      figures: appearances.map(({ character, expression }) => ({ figure: character.artId, expression: expression.artId })),
    })
    : null;

  // The anchors are the drawing's own, so the decision is made from the same
  // geometry the figures were placed with rather than from a figure count.
  const placement = drawing ? labelPlacement(drawing.anchors) : 'list';
  const placed = appearances.map(({ character, expression }, index) => ({
    character,
    expression,
    anchor: drawing?.anchors[index] ?? null,
  }));
  // The names are listed in the order the figures stand in, left to right,
  // rather than in the order the cast happens to be written in. That is the
  // order a sighted reader meets them in, and it is the only association a
  // reader who cannot see the drawing has, so both get the same one. Three
  // compositions place their slots out of left-to-right order.
  const ordered = drawing ? [...placed].sort((a, b) => a.anchor.x - b.anchor.x) : placed;
  const labels = ordered
    .map(({ character, expression, anchor }) => renderFigureLabel(character, expression, anchor, placement))
    .join('\n');

  // Which of these figures are invented is said in full-size text under the
  // drawing, where there is always room for it.
  const invented = appearances.filter(({ character }) => character.role === 'friend');
  const fiction = invented.length === 0
    ? ''
    : `<p class="figure-fiction"><span class="label">Invented figures</span> ${invented.map(({ character }) => esc(character.displayName)).join(', ')}</p>`;

  // A frame with no composition is an empty box, and a reader should not have
  // to guess whether a drawing failed to load. It says so instead. This is a
  // fact about this one visual, not about the document: a beat whose drawing
  // exists never shows it, and the content document is what declares which is
  // which.
  const pending = visual.artId
    ? ''
    : '<p class="scene-visual-pending">The drawing for this beat is not made yet. The figures below are named slots, and the description under the frame carries what the finished panel will show.</p>';

  const frame = [
    `<div class="scene-visual-frame" data-art="${esc(visual.artId ?? 'none')}" data-art-state="${esc(visual.artState ?? 'described')}" data-labels="${placement}">`,
    drawing ? drawing.svg : '',
    pending,
    labels
      ? `<ul class="art-labels" aria-label="Who is in this drawing, from left to right">\n${labels}\n</ul>`
      : '',
    '</div>',
  ].filter(Boolean).join('\n');

  // The description lives in the caption rather than an aria-label, so the
  // nametags stay real text and nothing is announced twice.
  return `<figure class="${className}">
${frame}
${fiction}<figcaption>${esc(visual.description)}</figcaption>
</figure>`;
}

function renderDialogue(lines, castById) {
  if (lines.length === 0) return '';
  const spoken = lines
    .map((line) => {
      const speaker = castById.get(line.speakerId);
      const name = speaker.role === 'member'
        ? `<span class="nametag">${esc(speaker.displayName)}</span>`
        : `<span class="figure-name">${esc(speaker.displayName)}</span>`;
      const kind = line.stance === 'member-endorsed' ? '' : '<span class="line-kind">invented example</span>';
      return `<li class="line" data-stance="${esc(line.stance)}">
<p class="line-speaker">${name}${kind}</p>
<p class="line-text">${esc(line.text)}</p>
</li>`;
    })
    .join('\n');
  return `<ul class="dialogue">\n${spoken}\n</ul>`;
}

/** One visible caveat, or a run of them, as the block the reader cannot skip. */
const renderLimitations = (limitations) => (limitations.length === 0 ? '' : `<aside class="limitations" aria-label="Limitations">
<p class="label">Keep in mind</p>
${paragraphs(limitations)}
</aside>`);

/**
 * The beat's essential blocks, in the order the beat actually reads.
 *
 * Twenty beats answer before the narrator explains and five state a caveat
 * before the line it qualifies, so a fixed narration-then-dialogue-then-caveat
 * order would quietly rewrite the argument. `mainPath` is the authored
 * sequence; consecutive blocks of one kind are gathered so dialogue is still
 * one list and a run of caveats is still one callout.
 */
function renderMainPath(scene, castById) {
  const runs = [];
  for (const entry of scene.mainPath) {
    const last = runs[runs.length - 1];
    if (last && last.kind === entry.kind) last.indexes.push(entry.index);
    else runs.push({ kind: entry.kind, indexes: [entry.index] });
  }

  return runs
    .map((run) => {
      if (run.kind === 'narration') {
        return `<div class="narration">\n${paragraphs(run.indexes.map((index) => scene.narration[index]))}\n</div>`;
      }
      if (run.kind === 'dialogue') {
        return renderDialogue(run.indexes.map((index) => scene.dialogue[index]), castById);
      }
      return renderLimitations(run.indexes.map((index) => scene.limitations[index]));
    })
    .filter(Boolean)
    .join('\n');
}

function renderDetail(detail, sourceById) {
  // Each panel links the sources it leans on, so a reader following the extra
  // reasoning can reach the audited entry without hunting for the label.
  const sources = detail.sourceIds
    .map((id) => {
      const source = sourceById.get(id);
      return `<li><a href="#${esc(source.id)}" data-source-link="${esc(source.id)}">${esc(source.label)}</a></li>`;
    })
    .join('\n');
  // `open` in the markup is the contract, not a default the script restores:
  // print, a scriptless browser, and the continuous view all read it in place.
  return `<details class="detail" id="${esc(detail.id)}" data-detail="${esc(detail.id)}" open>
<summary>${esc(detail.title)}</summary>
<div class="detail-body">
${paragraphs(detail.body)}
${sources ? `<ul class="detail-sources">\n${sources}\n</ul>` : ''}
</div>
</details>`;
}

function renderScene(scene, context, position) {
  const { castById, sourceById, conceptById, detailById } = context;

  const concepts = scene.conceptIds.length
    ? `<p class="concepts"><span class="label">Concepts</span> ${scene.conceptIds.map((id) => esc(conceptById.get(id).name)).join(' &middot; ')}</p>`
    : '';

  const sources = scene.sourceIds.length
    ? `<section class="scene-sources" aria-label="Sources used in this beat">
<p class="label">Sources</p>
<ul class="source-list">
${scene.sourceIds.map((id) => renderSourceReference(sourceById.get(id))).join('\n')}
</ul>
</section>`
    : '';

  const details = scene.detailIds.map((id) => renderDetail(detailById.get(id), sourceById)).join('\n');

  // `aria-labelledby` gives the beat an accessible name, so moving focus here
  // announces the beat's own title. That is the only announcement of a move:
  // the progress line deliberately carries no live region, which would repeat
  // the same change a second time.
  return `<li class="scene" id="${esc(scene.id)}" data-scene="${esc(scene.id)}" data-chapter="${esc(scene.chapterId)}" data-position="${position}" tabindex="-1" aria-labelledby="${esc(scene.id)}-title">
<h3 class="scene-title" id="${esc(scene.id)}-title">${esc(scene.title)}</h3>
${renderVisual(scene.visual, castById, 'scene-visual')}
${renderMainPath(scene, castById)}
${concepts}
${details}
${sources}
</li>`;
}

function renderChapter(chapter, context) {
  const { sceneById, positions } = context;
  const scenes = chapter.sceneIds
    .map((id) => renderScene(sceneById.get(id), context, positions.get(id)))
    .join('\n');

  const numbering = chapter.number === null
    ? ''
    : ` data-chapter-number="${chapter.number}" data-chapter-count="${context.chapterCount}"`;

  return `<section class="chapter" id="${esc(chapter.id)}" data-chapter="${esc(chapter.id)}"${numbering} aria-labelledby="${esc(chapter.id)}-title">
<header class="chapter-head">
<h2 id="${esc(chapter.id)}-title">${esc(chapter.title)}</h2>
<p class="chapter-connection chapter-opening">${esc(chapter.opening)}</p>
</header>
<ol class="scenes">
${scenes}
</ol>
<p class="chapter-connection chapter-closing">${esc(chapter.closing)}</p>
</section>`;
}

function renderLanding(content, options, firstSceneId, castById) {
  const members = content.cast.filter((character) => character.role === 'member');
  const names = members.map((member) => `<li class="nametag">${esc(member.displayName)}</li>`).join('\n');

  // The opening illustration is authored like any other: which figures stand
  // around the question, and what each of them is feeling, are content
  // decisions, not something this renderer picks.
  const illustration = content.project.visual
    ? renderVisual(content.project.visual, castById, 'landing-art')
    : '';

  const readingTime = content.project.readingTimeEstimate
    ? `<p class="reading-time">About ${esc(content.project.readingTimeEstimate)} to read.</p>`
    : '<p class="reading-time">The reading time is not estimated yet; it will be measured from the finished prose.</p>';

  return `<section class="landing" id="landing" aria-labelledby="landing-title">
<h1 id="landing-title">${esc(content.project.question)}</h1>
<p class="landing-summary">${esc(content.project.summary)}</p>
<ul class="landing-cast" aria-label="Written by">
${names}
</ul>
${illustration}
<p class="landing-actions"><a class="button begin" href="#${esc(firstSceneId)}" data-begin>Begin</a></p>
<p class="landing-sources"><a href="#sources" data-sources-link>Sources, and how far each one was checked</a></p>
${readingTime}
</section>`;
}

function renderDraftNotice(status) {
  if (status.final) return '';
  return `<aside class="draft-notice" role="note" aria-label="${esc(status.label)}">
<p class="draft-label">${esc(status.label)}</p>
<p>${esc(status.notice)}</p>
</aside>`;
}

/**
 * The chapter list stays on screen in every view, so it is also where the
 * register is reachable from inside a beat. The sources link sits outside the
 * ordered list on purpose: the register is not a seventh chapter.
 */
function renderChapterNav(content) {
  // The opening is not one of the six shared questions, so it carries no
  // number: numbering it would make the first question the second chapter.
  const items = content.chapters
    .map((chapter) => {
      const number = chapter.number === null ? '' : `<span class="chapter-number">${chapter.number}</span> `;
      return `<li><a href="#${esc(chapter.id)}" data-chapter-link="${esc(chapter.id)}">${number}${esc(chapter.title)}</a></li>`;
    })
    .join('\n');
  return `<nav class="chapter-nav" id="chapters" aria-label="Chapters and sources">
<p class="label" id="chapter-nav-label">Chapters</p>
<ol aria-labelledby="chapter-nav-label">
${items}
</ol>
<p class="nav-aside"><a href="#sources" data-sources-link>Sources</a></p>
</nav>`;
}

function renderSourceRegister(content) {
  if (content.sources.length === 0) return '';
  return `<section class="source-register" id="sources" tabindex="-1" aria-labelledby="sources-title">
<h2 id="sources-title">Sources</h2>
<p>Each source shows how far it was actually checked &mdash; read in full, abstract only, publisher or catalogue description only, or not opened at all &mdash; and what that material supports is phrased against that level. Opening a destination needs a connection; everything else here reads offline.</p>
<ul class="source-list">
${content.sources.map((source) => renderSourceReference(source, { register: true })).join('\n')}
</ul>
<p class="register-return js-only"><button type="button" data-return-to-beats>Back to where I was reading</button></p>
</section>`;
}

/**
 * Progress and the two boundaries are plain text next to the buttons rather
 * than a live region: focus already moves to the newly selected beat and
 * announces its title, and a live region here would say the same move twice.
 */
function renderBeatControls(totalScenes) {
  // Each accessible name starts with the word on the button, so a reader who
  // says "Next" is understood by voice control and a screen-reader user hears
  // a name that matches what a sighted reader is describing to them.
  return `<nav class="beat-controls js-only" aria-label="Move through the essay">
<button type="button" data-back aria-label="Back one beat">Back</button>
<p class="beat-position">
<span class="beat-count">Beat <span data-position-current>1</span> of ${totalScenes}</span>
<span class="beat-where" data-position-where></span>
<span class="beat-boundary" data-position-boundary></span>
</p>
<button type="button" data-next aria-label="Next beat">Next</button>
</nav>`;
}

/**
 * @param {object} content a validated content document
 * @param {object} options
 * @param {{url: string}} options.stylesheet  external stylesheet, or inline CSS
 * @param {{url?: string, source?: string}} options.script browser script
 * @param {object} [options.illustration] landing artwork resource
 * @param {string} options.inlineStyles CSS text when embedding rather than linking
 * @param {string[]} [options.fontNotices] one credit per font this output carries
 * @param {'hosted'|'offline'} options.mode
 * @returns {string} a complete HTML document
 */
export function renderDocument(content, options) {
  const context = {
    castById: indexBy(content.cast),
    sourceById: indexBy(content.sources),
    conceptById: indexBy(content.concepts),
    detailById: indexBy(content.details),
    sceneById: indexBy(content.scenes),
    positions: new Map(),
    chapterCount: content.chapters.filter((chapter) => chapter.number !== null).length,
  };

  // Reading order is the chapters' declared scene order, never array position.
  const orderedSceneIds = content.chapters.flatMap((chapter) => chapter.sceneIds);
  orderedSceneIds.forEach((id, index) => context.positions.set(id, index + 1));

  const head = options.inlineStyles
    ? `<style>\n${options.inlineStyles}\n</style>`
    : `<link rel="stylesheet" href="${esc(options.stylesheetUrl)}">`;

  const script = options.inlineScript
    ? `<script>\n${options.inlineScript}\n</script>`
    : `<script src="${esc(options.scriptUrl)}" defer></script>`;

  // One paragraph per font this output actually carries. The hosted page
  // credits the project typeface and the fallback behind it; the offline file
  // carries only the fallback and says only that.
  const fontNotices = (options.fontNotices ?? [])
    .map((notice) => `<p class="colophon-font">${esc(notice)}</p>`)
    .join('\n');

  // Where the drawings came from. The sheet is a flattened raster study, so it
  // is provenance rather than production artwork: every figure in the essay is
  // drawn from the scalable parts in `src/art/`, and the contributors'
  // appearances in both are provisional stand-ins rather than likenesses.
  const conceptSheet = options.illustration
    ? `<details class="concept-sheet">
<summary>The concept sheet these drawings came from</summary>
<figure>
<img src="${esc(options.illustration.url)}" alt="${esc(options.illustration.alt)}" width="${options.illustration.width}" height="${options.illustration.height}">
<figcaption>${esc(options.illustration.caption)}</figcaption>
</figure>
</details>`
    : '';

  // The bundled font's licence requires its notice to travel with every copy
  // of the font, so it is part of the document rather than a neighbouring file.
  const fontLicence = options.fontLicense
    ? `<details class="licence">
<summary>Bundled font licence</summary>
<pre class="licence-text">${esc(options.fontLicense.trimEnd())}</pre>
</details>`
    : '';

  return `<!doctype html>
<html lang="en" data-mode="${esc(options.mode)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(content.project.title)}</title>
<meta name="description" content="${esc(content.project.summary)}">
<meta name="robots" content="${content.status.final ? 'index' : 'noindex'}">
${head}
<script>document.documentElement.classList.add('js');</script>
</head>
<body>
<a class="skip-link" href="#essay">Skip to the essay</a>
${renderDraftNotice(content.status)}
<main id="essay" tabindex="-1">
${renderLanding(content, options, orderedSceneIds[0], context.castById)}
${renderChapterNav(content)}
<div class="essay-body" data-essay>
${content.chapters.map((chapter) => renderChapter(chapter, context)).join('\n')}
</div>
${renderSourceRegister(content)}
</main>
${renderBeatControls(orderedSceneIds.length)}
<p class="view-switch js-only"><button type="button" data-view-toggle>Read the whole thing</button></p>
<footer class="colophon">
<p>${esc(content.project.title)} &mdash; original illustrated essay by ${content.cast.filter((character) => character.role === 'member').map((member) => esc(member.displayName)).join(', ')}.</p>
${fontNotices}
${conceptSheet}
${fontLicence}
</footer>
${script}
</body>
</html>
`;
}
