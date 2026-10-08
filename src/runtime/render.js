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

function renderVisual(scene, castById, artIsFinal) {
  const nametags = scene.visual.cast
    .map((appearance) => {
      const character = castById.get(appearance.characterId);
      const expression = character.expressions.find((entry) => entry.id === appearance.expressionId);
      return `<li class="figure-cast"><span class="nametag">${esc(character.displayName)}</span><span class="expression">${esc(expression.label)}</span></li>`;
    })
    .join('\n');

  // The frame holds a name and a stated feeling per figure and nothing else
  // until the drawing exists. Saying so is the honest thing to put in an empty
  // frame: a reader should not have to guess whether the art failed to load.
  const pending = artIsFinal
    ? ''
    : '\n<p class="scene-visual-pending">The original drawing for this beat is not made yet. The figures below are named slots, and the caption carries what the finished panel will show.</p>';

  // The description lives in the caption rather than an aria-label, so the
  // nametags stay real text and nothing is announced twice.
  return `<figure class="scene-visual">
<div class="scene-visual-frame">${pending}
${nametags ? `<ul class="figure-cast-list">\n${nametags}\n</ul>` : ''}
</div>
<figcaption>${esc(scene.visual.description)}</figcaption>
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
  const { castById, sourceById, conceptById, detailById, artIsFinal } = context;

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

  // `aria-labelledby` gives the beat an accessible name, so moving focus here
  // announces the beat's own title. That is the only announcement of a move:
  // the progress line deliberately carries no live region, which would repeat
  // the same change a second time.
  return `<li class="scene" id="${esc(scene.id)}" data-scene="${esc(scene.id)}" data-chapter="${esc(scene.chapterId)}" data-position="${position}" tabindex="-1" aria-labelledby="${esc(scene.id)}-title">
<h3 class="scene-title" id="${esc(scene.id)}-title">${esc(scene.title)}</h3>
${renderVisual(scene, castById, artIsFinal)}
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

function renderLanding(content, options, firstSceneId) {
  const members = content.cast.filter((character) => character.role === 'member');
  const names = members.map((member) => `<li class="nametag">${esc(member.displayName)}</li>`).join('\n');

  const illustration = options.illustration
    ? `<figure class="landing-art">
<img src="${esc(options.illustration.url)}" alt="${esc(options.illustration.alt)}" width="${options.illustration.width}" height="${options.illustration.height}">
<figcaption>${esc(options.illustration.caption)}</figcaption>
</figure>`
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
  const items = content.chapters
    .map((chapter, index) =>
      `<li><a href="#${esc(chapter.id)}" data-chapter-link="${esc(chapter.id)}"><span class="chapter-number">${index + 1}</span> ${esc(chapter.title)}</a></li>`)
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
  return `<nav class="beat-controls js-only" aria-label="Move through the essay">
<button type="button" data-back aria-label="Back to the previous beat">Back</button>
<p class="beat-position">
<span class="beat-count">Beat <span data-position-current>1</span> of ${totalScenes}</span>
<span class="beat-where" data-position-where></span>
<span class="beat-boundary" data-position-boundary></span>
</p>
<button type="button" data-next aria-label="On to the next beat">Next</button>
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
    // No finished scene artwork exists while the document is non-final, so
    // every empty frame says so rather than looking like a loading failure.
    artIsFinal: content.status.final,
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
${renderLanding(content, options, orderedSceneIds[0])}
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
${fontNotice}
${fontLicence}
</footer>
${script}
</body>
</html>
`;
}
