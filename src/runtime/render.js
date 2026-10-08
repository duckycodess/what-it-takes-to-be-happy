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
 */
function renderSourceReference(source) {
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

  return `<li class="source">
<p class="source-head"><a href="${esc(source.url)}" rel="noreferrer">${esc(source.label)}</a> <span class="source-type">${esc(source.type)}</span></p>
<p class="source-status" data-status="${esc(source.reviewStatus)}">${esc(level.label)}</p>
${detail}
</li>`;
}

const percent = (value) => `${(Math.round(value * 100) / 100).toFixed(2)}%`;

/** The name and state of one figure, as browser text rather than lettering. */
function renderFigureLabel(character, expression, anchor) {
  const position = anchor ? ` style="--art-x:${percent(anchor.x)};--art-y:${percent(anchor.y)}"` : '';
  return `<li class="art-label" data-role="${esc(character.role)}"${position}><span class="nametag">${esc(character.displayName)}</span><span class="expression">${esc(expression.label)}</span></li>`;
}

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

  const labels = appearances
    .map(({ character, expression }, index) => renderFigureLabel(character, expression, drawing?.anchors[index]))
    .join('\n');

  const frame = [
    `<div class="scene-visual-frame" data-art="${esc(visual.artId ?? 'none')}" data-art-state="${esc(visual.artState ?? 'described')}">`,
    drawing ? drawing.svg : '',
    labels ? `<ul class="art-labels" aria-label="Who is in this drawing">\n${labels}\n</ul>` : '',
    '</div>',
  ].filter(Boolean).join('\n');

  // The description lives in the caption rather than an aria-label, so the
  // nametags stay real text and nothing is announced twice.
  return `<figure class="${className}">
${frame}
<figcaption>${esc(visual.description)}</figcaption>
</figure>`;
}

function renderDialogue(scene, castById) {
  if (scene.dialogue.length === 0) return '';
  const lines = scene.dialogue
    .map((line) => {
      const speaker = castById.get(line.speakerId);
      const kind = line.stance === 'member-endorsed' ? '' : '<span class="line-kind">invented example</span>';
      return `<li class="line" data-stance="${esc(line.stance)}">
<p class="line-speaker"><span class="nametag">${esc(speaker.displayName)}</span>${kind}</p>
<p class="line-text">${esc(line.text)}</p>
</li>`;
    })
    .join('\n');
  return `<ul class="dialogue">\n${lines}\n</ul>`;
}

function renderDetail(detail, sourceById) {
  const sources = detail.sourceIds
    .map((id) => `<li>${esc(sourceById.get(id).label)}</li>`)
    .join('\n');
  return `<details class="detail" open>
<summary>${esc(detail.title)}</summary>
<div class="detail-body">
${paragraphs(detail.body)}
${sources ? `<ul class="detail-sources">\n${sources}\n</ul>` : ''}
</div>
</details>`;
}

function renderScene(scene, context, position) {
  const { castById, sourceById, conceptById, detailById } = context;

  const limitations = scene.limitations.length
    ? `<aside class="limitations" aria-label="Limitations">
<p class="label">Keep in mind</p>
${paragraphs(scene.limitations)}
</aside>`
    : '';

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

  return `<li class="scene" id="${esc(scene.id)}" data-scene="${esc(scene.id)}" data-chapter="${esc(scene.chapterId)}" data-position="${position}" tabindex="-1">
<h3 class="scene-title">${esc(scene.title)}</h3>
${renderVisual(scene.visual, castById, 'scene-visual')}
<div class="narration">
${paragraphs(scene.narration)}
</div>
${renderDialogue(scene, castById)}
${concepts}
${limitations}
${details}
${sources}
</li>`;
}

function renderChapter(chapter, context) {
  const { sceneById, positions } = context;
  const scenes = chapter.sceneIds
    .map((id) => renderScene(sceneById.get(id), context, positions.get(id)))
    .join('\n');

  return `<section class="chapter" id="${esc(chapter.id)}" data-chapter="${esc(chapter.id)}" aria-labelledby="${esc(chapter.id)}-title">
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

function renderChapterNav(content) {
  const items = content.chapters
    .map((chapter) => `<li><a href="#${esc(chapter.sceneIds[0])}" data-chapter-link="${esc(chapter.id)}">${esc(chapter.title)}</a></li>`)
    .join('\n');
  return `<nav class="chapter-nav" id="chapters" aria-label="Chapters">
<p class="label" id="chapter-nav-label">Chapters</p>
<ol aria-labelledby="chapter-nav-label">
${items}
</ol>
</nav>`;
}

function renderSourceRegister(content) {
  if (content.sources.length === 0) return '';
  return `<section class="source-register" id="sources" aria-labelledby="sources-title">
<h2 id="sources-title">Sources</h2>
<p>Each source shows how far it was actually checked &mdash; read in full, abstract only, publisher or catalogue description only, or not opened at all &mdash; and what that material supports is phrased against that level. Opening a destination needs a connection; everything else here reads offline.</p>
<ul class="source-list">
${content.sources.map((source) => renderSourceReference(source)).join('\n')}
</ul>
</section>`;
}

function renderBeatControls(totalScenes) {
  return `<nav class="beat-controls js-only" aria-label="Move through the essay">
<button type="button" data-back>Back</button>
<p class="beat-position" aria-live="polite"><span data-position-current>1</span> of ${totalScenes}</p>
<button type="button" data-next>Next</button>
</nav>`;
}

/**
 * @param {object} content a validated content document
 * @param {object} options
 * @param {{url: string}} options.stylesheet  external stylesheet, or inline CSS
 * @param {{url?: string, source?: string}} options.script browser script
 * @param {object} [options.illustration] landing artwork resource
 * @param {string} options.inlineStyles CSS text when embedding rather than linking
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

  const fontNotice = options.fontNotice
    ? `<p class="colophon-font">${esc(options.fontNotice)}</p>`
    : '';

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
<main id="essay">
${renderLanding(content, options, orderedSceneIds[0], context.castById)}
${renderChapterNav(content)}
<div class="essay-body" data-essay>
${content.chapters.map((chapter) => renderChapter(chapter, context)).join('\n')}
</div>
${renderSourceRegister(content)}
</main>
${renderBeatControls(orderedSceneIds.length)}
<p class="view-switch js-only"><button type="button" data-view-toggle aria-pressed="false">Read the whole thing</button></p>
<footer class="colophon">
<p>${esc(content.project.title)} &mdash; original illustrated essay by ${content.cast.filter((character) => character.role === 'member').map((member) => esc(member.displayName)).join(', ')}.</p>
${fontNotice}
${conceptSheet}
${fontLicence}
</footer>
${script}
</body>
</html>
`;
}
